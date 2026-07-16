// Checkout validators protect the module boundary from invalid request input.
import { z } from "zod";

export const checkoutBookingSchema = z.object({
  bookingId: z.string().uuid(),
});

export const checkoutHistoryQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
});
