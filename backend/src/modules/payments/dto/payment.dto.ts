import type { PaymentMethod } from "@prisma/client";

export type CreatePaymentDto = {
  invoiceId: string;
  method: PaymentMethod;
  amount: number;
  transactionId?: string;
  referenceNumber?: string;
  remarks?: string;
};

export type RefundPaymentDto = {
  amount: number;
  reason: string;
};
