import type { DiscountType, InvoiceItemType } from "@prisma/client";

export type GenerateInvoiceDto = {
  bookingId: string;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
};

export type UpdateDiscountDto = {
  discountType: DiscountType;
  discountValue: number;
};

export type AddInvoiceChargeDto = {
  type: InvoiceItemType;
  description: string;
  quantity: number;
  unitPrice: number;
};
