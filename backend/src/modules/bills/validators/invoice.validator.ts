import { DiscountType, InvoiceItemType } from "@prisma/client";
import { z } from "zod";

export const generateInvoiceSchema = z.object({
  bookingId: z.string().uuid(),
  cgstRate: z.coerce.number().min(0).max(100).optional(),
  sgstRate: z.coerce.number().min(0).max(100).optional(),
  igstRate: z.coerce.number().min(0).max(100).optional(),
});

export const updateDiscountSchema = z.object({
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.coerce.number().min(0),
});

export const addInvoiceChargeSchema = z.object({
  type: z.nativeEnum(InvoiceItemType),
  description: z.string().trim().min(2).max(255),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().positive(),
});
