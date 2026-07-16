import type { InvoiceStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";

export class PaymentRepository {
  findInvoiceById(invoiceId: string) {
    return prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { booking: true, payments: { where: { deletedAt: null } } },
    });
  }

  findPaymentById(paymentId: string) {
    return prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: true,
        booking: true,
        receivedBy: { select: { id: true, fullName: true } },
        refunds: { where: { deletedAt: null } },
      },
    });
  }

  findPaymentByNumber(paymentNumber: string) {
    return prisma.payment.findUnique({ where: { paymentNumber } });
  }

  findRefundByNumber(refundNumber: string) {
    return prisma.paymentRefund.findUnique({ where: { refundNumber } });
  }

  createPayment(input: {
    paymentNumber: string;
    invoiceId: string;
    bookingId: string;
    method: Prisma.PaymentUncheckedCreateInput["method"];
    amount: Prisma.Decimal;
    transactionId?: string;
    referenceNumber?: string;
    receivedById: string;
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
          receivedById: input.receivedById,
          remarks: input.remarks,
          createdBy: input.receivedById,
        },
        include: { invoice: true, booking: true, receivedBy: { select: { id: true, fullName: true } } },
      });

      await tx.invoice.update({
        where: { id: input.invoiceId },
        data: {
          paidAmount: input.invoicePaidAmount,
          balanceAmount: input.invoiceBalanceAmount,
          status: input.invoiceStatus,
          updatedBy: input.receivedById,
        },
      });

      return payment;
    });
  }

  history(invoiceId: string) {
    return prisma.payment.findMany({
      where: { invoiceId, deletedAt: null },
      include: { refunds: { where: { deletedAt: null } }, receivedBy: { select: { id: true, fullName: true } } },
      orderBy: { paidAt: "desc" },
    });
  }

  refund(input: {
    paymentId: string;
    refundNumber: string;
    amount: Prisma.Decimal;
    reason: string;
    actorId: string;
    paymentStatus: PaymentStatus;
    paymentRefundedAmount: Prisma.Decimal;
    invoicePaidAmount: Prisma.Decimal;
    invoiceBalanceAmount: Prisma.Decimal;
    invoiceStatus: InvoiceStatus;
    invoiceId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const refund = await tx.paymentRefund.create({
        data: {
          paymentId: input.paymentId,
          refundNumber: input.refundNumber,
          amount: input.amount,
          reason: input.reason,
          createdBy: input.actorId,
        },
      });

      await tx.payment.update({
        where: { id: input.paymentId },
        data: {
          status: input.paymentStatus,
          refundedAmount: input.paymentRefundedAmount,
          updatedBy: input.actorId,
        },
      });

      await tx.invoice.update({
        where: { id: input.invoiceId },
        data: {
          paidAmount: input.invoicePaidAmount,
          balanceAmount: input.invoiceBalanceAmount,
          status: input.invoiceStatus,
          updatedBy: input.actorId,
        },
      });

      return refund;
    });
  }
}
