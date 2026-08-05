// Customer platform service composes ERP flows into customer-facing experiences.
import { BookingSource, BookingStatus, DiscountType, InvoiceStatus, OrderSource, Prisma } from "@prisma/client";
import { BaseService } from "../../lib/BaseService.js";
import type { AuthenticatedUser } from "../../types/request.types.js";
import { ApiError } from "../../utils/ApiError.js";
import { addDays } from "../../utils/date.js";
import { bookingService } from "../bookings/booking.service.js";
import { orderService } from "../orders/order.service.js";
import type { CustomerAddCartItemDto, CustomerBookingDto, CustomerFeedbackDto, CustomerPaymentDto, CustomerRescheduleDto } from "./dto/customer.dto.js";
import { CustomerRepository } from "./customer.repository.js";

export class CustomerService extends BaseService {
  constructor(private readonly customerRepository: CustomerRepository) {
    super();
  }

  async home() {
    const [restaurant, todaysSpecials, todaysOffers, topFoods, bestCustomers] = await Promise.all([
      this.customerRepository.restaurantDetails(),
      this.customerRepository.todaysSpecials(),
      this.customerRepository.activeOffers(new Date()),
      this.customerRepository.topFoods(),
      this.customerRepository.bestCustomers(),
    ]);

    return {
      heroBanner: restaurant,
      todaysSpecials,
      todaysOffers,
      topFoods,
      bestCustomers,
      gallery: [],
      aboutRestaurant: restaurant,
      chef: null,
      contact: restaurant,
    };
  }

  restaurantDetails() {
    return this.customerRepository.restaurantDetails();
  }

  async menu() {
    const [categories, items] = await Promise.all([this.customerRepository.categories(), this.customerRepository.menuItems()]);
    return { categories, items };
  }

  book(dto: CustomerBookingDto, actor: AuthenticatedUser) {
    return bookingService.create({ ...dto, source: BookingSource.CUSTOMER_APP }, actor);
  }

  async reschedule(bookingId: string, dto: CustomerRescheduleDto, actor: AuthenticatedUser) {
    await this.ensureOwnBooking(actor.id, bookingId);
    return bookingService.update(bookingId, dto);
  }

  async cancelBooking(bookingId: string, actor: AuthenticatedUser) {
    await this.ensureOwnBooking(actor.id, bookingId);
    return bookingService.cancel(bookingId);
  }

  currentBooking(customerId: string) {
    return this.customerRepository.currentBooking(customerId);
  }

  async currentSession(customerId: string, bookingId: string) {
    const booking = await this.ensureOwnBooking(customerId, bookingId);
    return {
      booking,
      unlocked: booking.status === BookingStatus.CHECKED_IN,
      actions: booking.status === BookingStatus.CHECKED_IN ? ["order-food", "track-order", "call-waiter", "need-water", "need-bill", "view-live-invoice"] : [],
    };
  }

  bookingHistory(customerId: string) {
    return this.customerRepository.bookingHistory(customerId);
  }

  async getCart(bookingId: string, actor: AuthenticatedUser) {
    await this.ensureOwnCheckedInBooking(actor.id, bookingId);
    return orderService.getActiveCart(bookingId, actor);
  }

  async addCartItem(dto: CustomerAddCartItemDto, actor: AuthenticatedUser) {
    await this.ensureOwnCheckedInBooking(actor.id, dto.bookingId);
    return orderService.addItem(dto, actor);
  }

  async updateCartQuantity(cartItemId: string, quantity: number, actor: AuthenticatedUser) {
    return orderService.updateQuantity(cartItemId, { quantity }, actor);
  }

  async updateCartNotes(cartItemId: string, specialNotes: string | undefined, actor: AuthenticatedUser) {
    return orderService.updateNotes(cartItemId, { specialNotes }, actor);
  }

  async removeCartItem(cartItemId: string, actor: AuthenticatedUser) {
    return orderService.removeItem(cartItemId, actor);
  }

  async clearCart(bookingId: string, actor: AuthenticatedUser) {
    await this.ensureOwnCheckedInBooking(actor.id, bookingId);
    return orderService.clearCart(bookingId, actor);
  }

  async confirmOrder(bookingId: string, actor: AuthenticatedUser) {
    await this.ensureOwnCheckedInBooking(actor.id, bookingId);
    return orderService.confirmOrder({ bookingId, source: OrderSource.CUSTOMER_APP }, actor);
  }

  orderHistory(customerId: string) {
    return this.customerRepository.orderHistory(customerId);
  }

  async orderTracking(customerId: string, orderId: string) {
    const order = this.ensureExists(await this.customerRepository.findCustomerOrder(customerId, orderId), "Order not found");
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      kitchenStatus: order.kitchenQueue?.status ?? null,
      timeline: {
        pending: order.kitchenQueue?.queuedAt ?? order.confirmedAt,
        preparing: order.kitchenQueue?.startedAt ?? null,
        ready: order.kitchenQueue?.readyAt ?? null,
        served: order.kitchenQueue?.servedAt ?? null,
      },
      items: order.items,
    };
  }

  invoiceHistory(customerId: string) {
    return this.customerRepository.invoiceHistory(customerId);
  }

  async liveInvoice(customerId: string, bookingId: string) {
    const booking = await this.ensureOwnBooking(customerId, bookingId);
    if (!booking.invoice) throw new ApiError(404, "Invoice not found");
    return this.customerRepository.findCustomerInvoice(customerId, booking.invoice.id);
  }

  paymentHistory(customerId: string) {
    return this.customerRepository.paymentHistory(customerId);
  }

  async pay(dto: CustomerPaymentDto, actor: AuthenticatedUser) {
    const invoice = this.ensureExists(await this.customerRepository.findCustomerInvoice(actor.id, dto.invoiceId), "Invoice not found");
    if (invoice.status === InvoiceStatus.CANCELLED) throw new ApiError(400, "Cannot pay cancelled invoice");
    if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.LOCKED || invoice.balanceAmount.equals(0)) {
      throw new ApiError(400, "Invoice is already paid");
    }
    const amount = new Prisma.Decimal(dto.amount);
    if (amount.gt(invoice.balanceAmount)) throw new ApiError(400, "Payment amount cannot exceed invoice balance");
    const paidAmount = invoice.paidAmount.plus(amount);
    const balanceAmount = invoice.grandTotal.minus(paidAmount);

    return this.customerRepository.createCustomerPayment({
      paymentNumber: await this.generatePaymentNumber(),
      invoiceId: invoice.id,
      bookingId: invoice.bookingId,
      customerId: actor.id,
      method: dto.method,
      amount,
      transactionId: dto.transactionId,
      referenceNumber: dto.referenceNumber,
      remarks: dto.remarks,
      invoicePaidAmount: paidAmount,
      invoiceBalanceAmount: balanceAmount,
      invoiceStatus: balanceAmount.lte(0) ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID,
    });
  }

  profile(customerId: string) {
    return this.customerRepository.profile(customerId);
  }

  offers() {
    return this.customerRepository.activeOffers(new Date());
  }

  leaderboard(customerId?: string | null) {
    return this.customerRepository.leaderboard(customerId ?? null);
  }

  async playGame(bookingId: string, actor: AuthenticatedUser) {
    await this.ensureOwnCheckedInBooking(actor.id, bookingId);
    const existingReward = await this.customerRepository.findRewardByBooking(bookingId);
    if (existingReward) throw new ApiError(409, "Game reward already claimed for this booking");

    return this.customerRepository.createReward({
      customerId: actor.id,
      bookingId,
      rewardCode: await this.generateRewardCode(),
      discountType: DiscountType.PERCENTAGE,
      discountValue: new Prisma.Decimal(5),
      expiresAt: addDays(new Date(), 30),
    });
  }

  async submitFeedback(bookingId: string, dto: CustomerFeedbackDto, actor: AuthenticatedUser) {
    const booking = await this.ensureOwnBooking(actor.id, bookingId);
    if (booking.status !== BookingStatus.COMPLETED) throw new ApiError(400, "Only completed bookings can be reviewed");
    const existingFeedback = await this.customerRepository.findFeedbackByBooking(bookingId);
    if (existingFeedback) throw new ApiError(409, "Feedback already submitted for this booking");

    return this.customerRepository.createFeedback({
      customerId: actor.id,
      bookingId,
      foodRating: dto.foodRating,
      serviceRating: dto.serviceRating,
      imageUrls: dto.imageUrls ?? [],
      comments: dto.comments,
    });
  }

  notifications(customerId: string) {
    return this.customerRepository.notifications(customerId);
  }

  markNotificationRead(customerId: string, notificationId: string) {
    return this.customerRepository.markNotificationRead(customerId, notificationId);
  }

  private async ensureOwnBooking(customerId: string, bookingId: string) {
    return this.ensureExists(await this.customerRepository.findCustomerBooking(customerId, bookingId), "Booking not found");
  }

  private async ensureOwnCheckedInBooking(customerId: string, bookingId: string) {
    const booking = await this.ensureOwnBooking(customerId, bookingId);
    if (booking.status !== BookingStatus.CHECKED_IN) throw new ApiError(400, "Customer can order only after check-in");
    return booking;
  }

  private async generatePaymentNumber() {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const paymentNumber = `CPAY-${datePart}-${Math.floor(100000 + Math.random() * 900000)}`;
      if (!(await this.customerRepository.findPaymentByNumber(paymentNumber))) return paymentNumber;
    }
    throw new ApiError(500, "Could not generate payment number");
  }

  private async generateRewardCode() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const rewardCode = `GAME-${Math.floor(100000 + Math.random() * 900000)}`;
      if (!(await this.customerRepository.findRewardByCode(rewardCode))) return rewardCode;
    }
    throw new ApiError(500, "Could not generate reward code");
  }
}

export const customerService = new CustomerService(new CustomerRepository());
