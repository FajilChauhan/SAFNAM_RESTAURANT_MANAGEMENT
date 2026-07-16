import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  method: z.nativeEnum(PaymentMethod),
  amount: z.coerce.number().positive(),
  transactionId: z.string().trim().max(120).optional(),
  referenceNumber: z.string().trim().max(120).optional(),
  remarks: z.string().trim().max(1000).optional(),
});

export const refundPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  reason: z.string().trim().min(2).max(1000),
});
