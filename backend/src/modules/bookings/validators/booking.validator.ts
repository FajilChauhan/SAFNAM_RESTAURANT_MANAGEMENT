import { BookingSource, BookingStatus, BookingType } from "@prisma/client";
import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:mm");
const durationSchema = z.coerce.number().int().min(15).max(1440).optional();

export const createBookingSchema = z
  .object({
    customerId: z.string().uuid().optional(),
    bookingType: z.nativeEnum(BookingType),
    tableId: z.string().uuid().optional(),
    roomId: z.string().uuid().optional(),
    date: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema.optional(),
    durationMinutes: durationSchema,
    members: z.coerce.number().int().positive(),
    notes: z.string().trim().max(2000).optional(),
    source: z.nativeEnum(BookingSource),
  })
  .refine((data) => Boolean(data.endTime) || Boolean(data.durationMinutes), {
    message: "Either endTime or durationMinutes is required",
    path: ["endTime"],
  })
  .refine((data) => data.bookingType !== BookingType.TABLE || Boolean(data.tableId), {
    message: "tableId is required for table bookings",
    path: ["tableId"],
  })
  .refine((data) => data.bookingType !== BookingType.ROOM || Boolean(data.roomId), {
    message: "roomId is required for room bookings",
    path: ["roomId"],
  });

export const updateBookingSchema = z
  .object({
    tableId: z.string().uuid().optional(),
    roomId: z.string().uuid().optional(),
    date: dateSchema.optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    durationMinutes: durationSchema,
    members: z.coerce.number().int().positive().optional(),
    notes: z.string().trim().max(2000).optional(),
    status: z.nativeEnum(BookingStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const availabilityQuerySchema = z
  .object({
    restaurantId: z.string().uuid(),
    date: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema.optional(),
    durationMinutes: durationSchema,
    members: z.coerce.number().int().positive(),
    floorId: z.string().uuid().optional(),
  })
  .refine((data) => Boolean(data.endTime) || Boolean(data.durationMinutes), {
    message: "Either endTime or durationMinutes is required",
    path: ["endTime"],
  });
