import { OrderSource, OrderStatus } from "@prisma/client";
import { z } from "zod";

const uuidSchema = z.string().uuid();

export const bookingParamSchema = z.object({
  bookingId: uuidSchema,
});

export const addCartItemSchema = z.object({
  bookingId: uuidSchema,
  menuItemId: uuidSchema,
  variantId: uuidSchema.optional(),
  addOnIds: z.array(uuidSchema).optional(),
  quantity: z.coerce.number().int().positive(),
  specialNotes: z.string().trim().max(1000).optional(),
});

export const updateCartItemQuantitySchema = z.object({
  quantity: z.coerce.number().int().positive(),
});

export const updateCartItemNotesSchema = z.object({
  specialNotes: z.string().trim().max(1000).optional(),
});

export const confirmOrderSchema = z.object({
  bookingId: uuidSchema,
  source: z.nativeEnum(OrderSource),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});
