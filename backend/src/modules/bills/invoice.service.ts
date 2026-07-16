import { BookingStatus, BookingType, DiscountType, InvoiceStatus, Prisma } from "@prisma/client";
import { BaseService } from "../../lib/BaseService.js";
import type { AuthenticatedUser } from "../../types/request.types.js";
import { ApiError } from "../../utils/ApiError.js";
import type { AddInvoiceChargeDto, GenerateInvoiceDto, UpdateDiscountDto } from "./dto/invoice.dto.js";
import { InvoiceRepository } from "./invoice.repository.js";
import type { InvoiceSummary } from "./types/invoice.types.js";

const PAID_LOCKED_STATUSES: InvoiceStatus[] = ["PARTIALLY_PAID", "PAID"];

export class InvoiceService extends BaseService {
  constructor(private readonly invoiceRepository: InvoiceRepository) {
    super();
  }

  async generate(dto: GenerateInvoiceDto, actor: AuthenticatedUser) {
    const booking = this.ensureExists(await this.invoiceRepository.findBookingForInvoice(dto.bookingId), "Booking not found");

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.NO_SHOW) {
      throw new ApiError(400, "Cancelled or no-show booking cannot generate invoice");
    }

    if (!booking.checkedInAt && booking.status !== BookingStatus.CHECKED_IN && booking.status !== BookingStatus.COMPLETED) {
      throw new ApiError(400, "Cannot generate invoice before check-in");
    }

    if (booking.invoice) {
      return this.recalculate(booking.invoice.id, actor.id);
    }

    const baseItems = this.buildBaseItems(booking, actor.id);
    const totals = this.calculateTotals(baseItems, {
      cgstRate: new Prisma.Decimal(dto.cgstRate ?? 0),
      sgstRate: new Prisma.Decimal(dto.sgstRate ?? 0),
      igstRate: new Prisma.Decimal(dto.igstRate ?? 0),
    });

    return this.invoiceRepository.createInvoice(
      {
        invoiceNumber: await this.generateInvoiceNumber(),
        bookingId: booking.id,
        status: InvoiceStatus.GENERATED,
        ...totals,
        generatedAt: new Date(),
        createdBy: actor.id,
      },
      baseItems,
    );
  }

  async getByBooking(bookingId: string) {
    return this.ensureExists(await this.invoiceRepository.findInvoiceByBookingId(bookingId), "Invoice not found");
  }

  async updateDiscount(invoiceId: string, dto: UpdateDiscountDto, actor: AuthenticatedUser) {
    const invoice = await this.getUnlockedInvoice(invoiceId);
    await this.invoiceRepository.updateInvoice(invoice.id, {
      discountType: dto.discountType,
      discountValue: new Prisma.Decimal(dto.discountValue),
      updatedBy: actor.id,
    });
    return this.recalculate(invoice.id, actor.id);
  }

  async addCharge(invoiceId: string, dto: AddInvoiceChargeDto, actor: AuthenticatedUser) {
    const invoice = await this.getUnlockedInvoice(invoiceId);
    const unitPrice = new Prisma.Decimal(dto.unitPrice);
    const totalAmount = unitPrice.mul(dto.quantity);

    await this.invoiceRepository.addItem(invoice.id, {
      invoiceId: invoice.id,
      type: dto.type,
      description: dto.description,
      quantity: dto.quantity,
      unitPrice,
      totalAmount,
      isManualCharge: true,
      createdBy: actor.id,
    });

    return this.recalculate(invoice.id, actor.id);
  }

  async removeCharge(invoiceItemId: string, actor: AuthenticatedUser) {
    const invoiceItem = this.ensureExists(await this.invoiceRepository.findInvoiceItemById(invoiceItemId), "Invoice item not found");
    this.ensureInvoiceEditable(invoiceItem.invoice);
    if (!invoiceItem.isManualCharge) {
      throw new ApiError(400, "Only manual charges can be removed");
    }
    await this.invoiceRepository.softDeleteItem(invoiceItemId, actor.id);
    return this.recalculate(invoiceItem.invoiceId, actor.id);
  }

  async cancel(invoiceId: string, actor: AuthenticatedUser) {
    const invoice = await this.getUnlockedInvoice(invoiceId);
    return this.invoiceRepository.updateInvoice(invoice.id, {
      status: InvoiceStatus.CANCELLED,
      cancelledAt: new Date(),
      updatedBy: actor.id,
    });
  }

  async summary(invoiceId: string): Promise<InvoiceSummary> {
    const invoice = this.ensureExists(await this.invoiceRepository.findInvoiceById(invoiceId), "Invoice not found");
    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      foodTotal: invoice.foodTotal.toString(),
      roomTotal: invoice.roomTotal.toString(),
      extraCharges: invoice.extraCharges.toString(),
      discountTotal: invoice.discountTotal.toString(),
      taxTotal: invoice.taxTotal.toString(),
      grandTotal: invoice.grandTotal.toString(),
      balanceAmount: invoice.balanceAmount.toString(),
    };
  }

  private async recalculate(invoiceId: string, actorId: string) {
    const invoice = this.ensureExists(await this.invoiceRepository.findInvoiceById(invoiceId), "Invoice not found");
    this.ensureInvoiceEditable(invoice);
    const totals = this.calculateTotals(invoice.items, {
      discountType: invoice.discountType ?? undefined,
      discountValue: invoice.discountValue,
      cgstRate: invoice.cgstRate,
      sgstRate: invoice.sgstRate,
      igstRate: invoice.igstRate,
      paidAmount: invoice.paidAmount,
    });
    return this.invoiceRepository.updateInvoice(invoice.id, { ...totals, updatedBy: actorId });
  }

  private buildBaseItems(booking: NonNullable<Awaited<ReturnType<InvoiceRepository["findBookingForInvoice"]>>>, actorId: string) {
    const foodItems = booking.orders.map((order) => ({
      orderId: order.id,
      type: "FOOD" as const,
      description: `Food order ${order.orderNumber}`,
      quantity: 1,
      unitPrice: order.totalSnapshot,
      totalAmount: order.totalSnapshot,
      isManualCharge: false,
      createdBy: actorId,
    }));

    if (booking.bookingType !== BookingType.ROOM || !booking.room) {
      return foodItems;
    }

    const days = Math.max(1, Math.ceil((booking.endAt.getTime() - booking.startAt.getTime()) / (24 * 60 * 60 * 1000)));
    const roomTotal = booking.room.pricePerDay.mul(days);

    return [
      ...foodItems,
      {
        type: "ROOM" as const,
        description: `Room ${booking.room.roomNumber} - ${days} day(s)`,
        quantity: days,
        unitPrice: booking.room.pricePerDay,
        totalAmount: roomTotal,
        isManualCharge: false,
        createdBy: actorId,
      },
    ];
  }

  private calculateTotals(
    items: Array<{ type: string; totalAmount: Prisma.Decimal }>,
    options: {
      discountType?: DiscountType;
      discountValue?: Prisma.Decimal;
      cgstRate: Prisma.Decimal;
      sgstRate: Prisma.Decimal;
      igstRate: Prisma.Decimal;
      paidAmount?: Prisma.Decimal;
    },
  ) {
    const foodTotal = this.sum(items.filter((item) => item.type === "FOOD"));
    const roomTotal = this.sum(items.filter((item) => item.type === "ROOM"));
    const extraCharges = this.sum(items.filter((item) => !["FOOD", "ROOM"].includes(item.type)));
    const subTotal = foodTotal.plus(roomTotal).plus(extraCharges);
    const discountValue = options.discountValue ?? new Prisma.Decimal(0);
    const discountTotal =
      options.discountType === DiscountType.PERCENTAGE ? subTotal.mul(discountValue).div(100) : discountValue;
    const taxableAmount = Prisma.Decimal.max(subTotal.minus(discountTotal), new Prisma.Decimal(0));
    const cgstAmount = taxableAmount.mul(options.cgstRate).div(100);
    const sgstAmount = taxableAmount.mul(options.sgstRate).div(100);
    const igstAmount = taxableAmount.mul(options.igstRate).div(100);
    const taxTotal = cgstAmount.plus(sgstAmount).plus(igstAmount);
    const grandTotal = taxableAmount.plus(taxTotal);
    const paidAmount = options.paidAmount ?? new Prisma.Decimal(0);

    return {
      foodTotal,
      roomTotal,
      extraCharges,
      discountTotal,
      cgstRate: options.cgstRate,
      sgstRate: options.sgstRate,
      igstRate: options.igstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      taxTotal,
      grandTotal,
      balanceAmount: grandTotal.minus(paidAmount),
    };
  }

  private sum(items: Array<{ totalAmount: Prisma.Decimal }>) {
    return items.reduce((total, item) => total.plus(item.totalAmount), new Prisma.Decimal(0));
  }

  private async getUnlockedInvoice(invoiceId: string) {
    const invoice = this.ensureExists(await this.invoiceRepository.findInvoiceById(invoiceId), "Invoice not found");
    this.ensureInvoiceEditable(invoice);
    return invoice;
  }

  private ensureInvoiceEditable(invoice: { status: InvoiceStatus }) {
    if (PAID_LOCKED_STATUSES.includes(invoice.status)) {
      throw new ApiError(400, "Invoice cannot be modified after payment");
    }
  }

  private async generateInvoiceNumber() {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const invoiceNumber = `INV-${datePart}-${Math.floor(100000 + Math.random() * 900000)}`;
      if (!(await this.invoiceRepository.findInvoiceByNumber(invoiceNumber))) return invoiceNumber;
    }
    throw new ApiError(500, "Could not generate invoice number");
  }
}

export const invoiceService = new InvoiceService(new InvoiceRepository());
