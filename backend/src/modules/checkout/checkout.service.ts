// Checkout service enforces final visit-closing rules before persistence.
import { BookingStatus, InvoiceStatus } from "@prisma/client";
import { BaseService } from "../../lib/BaseService.js";
import type { AuthenticatedUser } from "../../types/request.types.js";
import { ApiError } from "../../utils/ApiError.js";
import type { CheckoutBookingDto, CheckoutHistoryQueryDto } from "./dto/checkout.dto.js";
import { CheckoutRepository } from "./checkout.repository.js";
import type { CheckoutSummary } from "./types/checkout.types.js";

export class CheckoutService extends BaseService {
  constructor(private readonly checkoutRepository: CheckoutRepository) {
    super();
  }

  async checkout(dto: CheckoutBookingDto, actor: AuthenticatedUser) {
    const booking = this.ensureExists(
      await this.checkoutRepository.findBookingForCheckout(dto.bookingId),
      "Booking not found",
    );

    if (booking.checkout) throw new ApiError(409, "Booking is already checked out");
    if (booking.status === BookingStatus.CANCELLED) throw new ApiError(400, "Cancelled booking cannot checkout");
    if (booking.status === BookingStatus.NO_SHOW) throw new ApiError(400, "No-show booking cannot checkout");
    if (!booking.invoice) throw new ApiError(400, "Invoice must be generated before checkout");
    if (booking.invoice.status === InvoiceStatus.CANCELLED) throw new ApiError(400, "Cancelled invoice cannot checkout");
    if (booking.invoice.status !== InvoiceStatus.PAID || !booking.invoice.balanceAmount.equals(0)) {
      throw new ApiError(400, "Cannot checkout unpaid booking");
    }

    return this.checkoutRepository.completeCheckout({
      checkoutNumber: await this.generateCheckoutNumber(),
      bookingId: booking.id,
      invoiceId: booking.invoice.id,
      customerId: booking.customerId,
      checkedOutById: actor.id,
      invoiceTotal: booking.invoice.grandTotal,
      tableId: booking.tableId,
      roomId: booking.roomId,
      checkedOutAt: new Date(),
    });
  }

  async getDetails(bookingId: string) {
    return this.ensureExists(await this.checkoutRepository.findCheckoutByBookingId(bookingId), "Checkout not found");
  }

  history(query: CheckoutHistoryQueryDto) {
    return this.checkoutRepository.history(query);
  }

  toSummary(checkout: Awaited<ReturnType<CheckoutRepository["completeCheckout"]>>): CheckoutSummary {
    return {
      checkoutNumber: checkout.checkoutNumber,
      bookingNumber: checkout.booking.bookingNumber,
      invoiceNumber: checkout.invoice.invoiceNumber,
      invoiceTotal: checkout.invoiceTotal.toString(),
      checkedOutAt: checkout.checkedOutAt,
      customer: {
        id: checkout.customer.id,
        fullName: checkout.customer.fullName,
        phoneNumber: checkout.customer.phoneNumber,
      },
    };
  }

  private async generateCheckoutNumber() {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const checkoutNumber = `CHK-${datePart}-${Math.floor(100000 + Math.random() * 900000)}`;
      if (!(await this.checkoutRepository.findCheckoutByNumber(checkoutNumber))) return checkoutNumber;
    }
    throw new ApiError(500, "Could not generate checkout number");
  }
}

export const checkoutService = new CheckoutService(new CheckoutRepository());
