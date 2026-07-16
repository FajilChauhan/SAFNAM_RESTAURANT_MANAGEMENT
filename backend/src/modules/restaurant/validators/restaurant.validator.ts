import { z } from "zod";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:mm");
const optionalUrlSchema = z.string().trim().url().max(500).optional();

export const createRestaurantSchema = z.object({
  name: z.string().trim().min(2).max(150),
  logoUrl: optionalUrlSchema,
  description: z.string().trim().max(2000).optional(),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(255).optional(),
  address: z.string().trim().min(3).max(2000),
  openingTime: timeSchema,
  closingTime: timeSchema,
  gstNumber: z.string().trim().max(30).optional(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  timezone: z.string().trim().min(3).max(80),
});

export const updateRestaurantSchema = createRestaurantSchema.partial();
