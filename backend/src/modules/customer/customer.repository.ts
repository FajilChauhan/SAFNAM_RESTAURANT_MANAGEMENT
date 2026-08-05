// Customer repository owns customer-scoped database reads and engagement writes.
import { BookingStatus, DiscountType, InvoiceStatus, MenuEntityStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";

export class CustomerRepository {
  restaurantDetails() {
    return prisma.restaurant.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
  }

  categories() {
    return prisma.menuCategory.findMany({
      where: { deletedAt: null, status: MenuEntityStatus.ACTIVE },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
  }

  menuItems() {
    return prisma.menuItem.findMany({
      where: {
        deletedAt: null,
        status: MenuEntityStatus.ACTIVE,
        isAvailable: true,
        category: { deletedAt: null, status: MenuEntityStatus.ACTIVE },
      },
      include: { category: true, variants: true, addOns: true, availability: true },
      orderBy: { name: "asc" },
    });
  }

  todaysSpecials() {
    return prisma.menuItem.findMany({
      where: {
        deletedAt: null,
        status: MenuEntityStatus.ACTIVE,
        isAvailable: true,
        isTodaySpecial: true,
        category: { deletedAt: null, status: MenuEntityStatus.ACTIVE },
      },
      include: { category: true, variants: true, addOns: true },
      take: 12,
      orderBy: { name: "asc" },
    });
  }

  topFoods() {
    return prisma.orderItem.groupBy({
      by: ["menuItemId", "itemNameSnapshot"],
      where: { deletedAt: null },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });
  }

  activeOffers(now: Date) {
    return prisma.offer.findMany({
      where: {
        deletedAt: null,
        status: MenuEntityStatus.ACTIVE,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { endsAt: "asc" },
    });
  }

  bestCustomers() {
    return prisma.user.findMany({
      where: { deletedAt: null, role: "CUSTOMER", visitCount: { gt: 0 } },
      select: { id: true, fullName: true, avatarUrl: true, visitCount: true, totalSpending: true },
      orderBy: [{ totalSpending: "desc" }, { visitCount: "desc" }],
      take: 10,
    });
  }

  currentBooking(customerId: string) {
    return prisma.booking.findFirst({
      where: {
        customerId,
        deletedAt: null,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
      },
      include: this.bookingInclude(),
      orderBy: { startAt: "asc" },
    });
  }

  findCustomerBooking(customerId: string, bookingId: string) {
    return prisma.booking.findFirst({
      where: { id: bookingId, customerId, deletedAt: null },
      include: this.bookingInclude(),
    });
  }

  bookingHistory(customerId: string) {
    return prisma.booking.findMany({
      where: { customerId, deletedAt: null },
      include: this.bookingInclude(),
      orderBy: { startAt: "desc" },
    });
  }

  orderHistory(customerId: string) {
    return prisma.order.findMany({
      where: { deletedAt: null, booking: { customerId } },
      include: { booking: true, items: { include: { addOns: true } }, kitchenQueue: true },
      orderBy: { confirmedAt: "desc" },
    });
  }

  findCustomerOrder(customerId: string, orderId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, deletedAt: null, booking: { customerId } },
      include: { booking: true, items: { include: { addOns: true } }, kitchenQueue: true },
    });
  }

  invoiceHistory(customerId: string) {
    return prisma.invoice.findMany({
      where: { deletedAt: null, booking: { customerId } },
      include: { booking: true, items: true, payments: true },
      orderBy: { generatedAt: "desc" },
    });
  }

  findCustomerInvoice(customerId: string, invoiceId: string) {
    return prisma.invoice.findFirst({
      where: { id: invoiceId, deletedAt: null, booking: { customerId } },
      include: { booking: true, items: true, payments: true },
    });
  }

  paymentHistory(customerId: string) {
    return prisma.payment.findMany({
      where: { deletedAt: null, booking: { customerId } },
      include: { invoice: true, refunds: true },
      orderBy: { paidAt: "desc" },
    });
  }

  profile(customerId: string) {
    return prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        email: true,
        avatarUrl: true,
        visitCount: true,
        totalSpending: true,
        lastVisitAt: true,
      },
    });
  }

  leaderboard(customerId: string | null) {
    return prisma.user.findMany({
      where: { deletedAt: null, role: "CUSTOMER" },
      select: { id: true, fullName: true, avatarUrl: true, visitCount: true, totalSpending: true },
      orderBy: [{ totalSpending: "desc" }, { visitCount: "desc" }],
      take: 100,
    }).then((customers) => ({
      topCustomers: customers.slice(0, 10),
      currentRank: customerId ? customers.findIndex((customer) => customer.id === customerId) + 1 || null : null,
    }));
  }

  findRewardByBooking(bookingId: string) {
    return prisma.gameReward.findUnique({ where: { bookingId } });
  }

  findRewardByCode(rewardCode: string) {
    return prisma.gameReward.findUnique({ where: { rewardCode } });
  }

  createReward(input: {
    customerId: string;
    bookingId: string;
    rewardCode: string;
    discountType: DiscountType;
    discountValue: Prisma.Decimal;
    expiresAt: Date;
  }) {
    return prisma.gameReward.create({ data: { ...input, createdBy: input.customerId } });
  }

  findFeedbackByBooking(bookingId: string) {
    return prisma.customerFeedback.findUnique({ where: { bookingId } });
  }

  createFeedback(input: {
    customerId: string;
    bookingId: string;
    foodRating: number;
    serviceRating: number;
    imageUrls: string[];
    comments?: string;
  }) {
    return prisma.customerFeedback.create({ data: { ...input, createdBy: input.customerId } });
  }

  notifications(customerId: string) {
    return prisma.customerNotification.findMany({
      where: { customerId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  markNotificationRead(customerId: string, notificationId: string) {
    return prisma.customerNotification.updateMany({
      where: { id: notificationId, customerId, deletedAt: null },
      data: { readAt: new Date(), updatedBy: customerId },
    });
  }

  findPaymentByNumber(paymentNumber: string) {
    return prisma.payment.findUnique({ where: { paymentNumber } });
  }

  createCustomerPayment(input: {
    paymentNumber: string;
    invoiceId: string;
    bookingId: string;
    customerId: string;
    method: Prisma.PaymentUncheckedCreateInput["method"];
    amount: Prisma.Decimal;
    transactionId?: string;
    referenceNumber?: string;
    remarks?: string;
    invoicePaidAmount: Prisma.Decimal;
    invoiceBalanceAmount: Prisma.Decimal;
    invoiceStatus: InvoiceStatus;
  }) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber: input.paymentNumber,
          invoiceId: input.invoiceId,
          bookingId: input.bookingId,
          method: input.method,
          amount: input.amount,
          transactionId: input.transactionId,
          referenceNumber: input.referenceNumber,
          receivedById: input.customerId,
          status: PaymentStatus.SUCCESS,
          remarks: input.remarks,
          createdBy: input.customerId,
        },
        include: { invoice: true, booking: true },
      });

      await tx.invoice.update({
        where: { id: input.invoiceId },
        data: {
          paidAmount: input.invoicePaidAmount,
          balanceAmount: input.invoiceBalanceAmount,
          status: input.invoiceStatus,
          updatedBy: input.customerId,
        },
      });

      await tx.customerNotification.create({
        data: {
          customerId: input.customerId,
          type: "PAYMENT_SUCCESSFUL",
          title: "Payment successful",
          message: `Payment ${input.paymentNumber} was received successfully.`,
          createdBy: input.customerId,
        },
      });

      return payment;
    });
  }

  private bookingInclude() {
    return {
      customer: { select: { id: true, fullName: true, phoneNumber: true, email: true } },
      table: true,
      room: true,
      invoice: true,
      orders: { include: { items: { include: { addOns: true } }, kitchenQueue: true } },
      carts: { where: { deletedAt: null }, include: { items: { where: { deletedAt: null }, include: { menuItem: true, variant: true, addOns: { include: { addOn: true } } } } } },
    } satisfies Prisma.BookingInclude;
  }
}
