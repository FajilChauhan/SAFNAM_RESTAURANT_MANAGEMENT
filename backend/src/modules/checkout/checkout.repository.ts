// Checkout repository owns all database access and the final checkout transaction.
import { BookingStatus, InvoiceStatus, Prisma, RoomStatus, TableStatus } from "@prisma/client";
import { prisma } from "../../database/prisma.js";

export class CheckoutRepository {
  findBookingForCheckout(bookingId: string) {
    return prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { select: { id: true, fullName: true, phoneNumber: true, email: true } },
        table: true,
        room: true,
        invoice: true,
        checkout: true,
      },
    });
  }

  findCheckoutByBookingId(bookingId: string) {
    return prisma.checkoutSession.findUnique({
      where: { bookingId },
      include: this.defaultInclude(),
    });
  }

  findCheckoutByNumber(checkoutNumber: string) {
    return prisma.checkoutSession.findUnique({ where: { checkoutNumber } });
  }

  history(input: { customerId?: string }) {
    return prisma.checkoutSession.findMany({
      where: {
        customerId: input.customerId,
        deletedAt: null,
      },
      include: this.defaultInclude(),
      orderBy: { checkedOutAt: "desc" },
    });
  }

  completeCheckout(input: {
    checkoutNumber: string;
    bookingId: string;
    invoiceId: string;
    customerId: string;
    checkedOutById: string;
    invoiceTotal: Prisma.Decimal;
    tableId?: string | null;
    roomId?: string | null;
    checkedOutAt: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const checkout = await tx.checkoutSession.create({
        data: {
          checkoutNumber: input.checkoutNumber,
          bookingId: input.bookingId,
          invoiceId: input.invoiceId,
          customerId: input.customerId,
          checkedOutById: input.checkedOutById,
          invoiceTotal: input.invoiceTotal,
          checkedOutAt: input.checkedOutAt,
          createdBy: input.checkedOutById,
        },
      });

      await tx.booking.update({
        where: { id: input.bookingId },
        data: {
          status: BookingStatus.COMPLETED,
          checkedOutAt: input.checkedOutAt,
          updatedBy: input.checkedOutById,
        },
      });

      if (input.tableId) {
        await tx.diningTable.update({
          where: { id: input.tableId },
          data: { status: TableStatus.AVAILABLE, updatedBy: input.checkedOutById },
        });
      }

      if (input.roomId) {
        await tx.room.update({
          where: { id: input.roomId },
          data: { status: RoomStatus.AVAILABLE, updatedBy: input.checkedOutById },
        });
      }

      await tx.invoice.update({
        where: { id: input.invoiceId },
        data: {
          status: InvoiceStatus.LOCKED,
          lockedAt: input.checkedOutAt,
          updatedBy: input.checkedOutById,
        },
      });

      await tx.user.update({
        where: { id: input.customerId },
        data: {
          visitCount: { increment: 1 },
          totalSpending: { increment: input.invoiceTotal },
          lastVisitAt: input.checkedOutAt,
          updatedBy: input.checkedOutById,
        },
      });

      return tx.checkoutSession.findUniqueOrThrow({
        where: { id: checkout.id },
        include: this.defaultInclude(),
      });
    });
  }

  private defaultInclude() {
    return {
      booking: {
        select: {
          id: true,
          bookingNumber: true,
          bookingType: true,
          status: true,
          checkedOutAt: true,
          table: { select: { id: true, tableNumber: true, status: true } },
          room: { select: { id: true, roomNumber: true, status: true } },
        },
      },
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          grandTotal: true,
          paidAmount: true,
          balanceAmount: true,
          lockedAt: true,
        },
      },
      customer: { select: { id: true, fullName: true, phoneNumber: true, email: true } },
      checkedOutBy: { select: { id: true, fullName: true, role: true } },
    } satisfies Prisma.CheckoutSessionInclude;
  }
}
