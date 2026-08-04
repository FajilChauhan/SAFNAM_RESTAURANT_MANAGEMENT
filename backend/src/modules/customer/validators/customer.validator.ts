// Validators keep customer platform input strict before it reaches ERP services.
import { BookingType, OrderSource, PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const customerBookingSchema = z.object({
  bookingType: z.nativeEnum(BookingType),
  tableId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  durationMinutes: z.coerce.number().int().positive().optional(),
  members: z.coerce.number().int().positive(),
  notes: z.string().trim().max(1000).optional(),
});

export const customerRescheduleSchema = customerBookingSchema.partial().omit({ bookingType: true });

export const customerAddCartItemSchema = z.object({
  bookingId: z.string().uuid(),
  menuItemId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  addOnIds: z.array(z.string().uuid()).optional(),
  quantity: z.coerce.number().int().positive(),
  specialNotes: z.string().trim().max(500).optional(),
});

export const customerUpdateQuantitySchema = z.object({
  quantity: z.coerce.number().int().positive(),
});

export const customerUpdateNotesSchema = z.object({
  specialNotes: z.string().trim().max(500).optional(),
});

export const customerConfirmOrderSchema = z.object({
  bookingId: z.string().uuid(),
  source: z.nativeEnum(OrderSource).default(OrderSource.CUSTOMER_APP),
});

export const customerPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  method: z.nativeEnum(PaymentMethod),
  amount: z.coerce.number().positive(),
  transactionId: z.string().trim().max(120).optional(),
  referenceNumber: z.string().trim().max(120).optional(),
  remarks: z.string().trim().max(1000).optional(),
});

export const customerFeedbackSchema = z.object({
  foodRating: z.coerce.number().int().min(1).max(5),
  serviceRating: z.coerce.number().int().min(1).max(5),
  imageUrls: z.array(z.string().url()).max(5).optional(),
  comments: z.string().trim().max(2000).optional(),
});
