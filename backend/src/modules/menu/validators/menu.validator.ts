import {
  FoodType,
  MenuAvailabilityType,
  MenuEntityStatus,
  SpicyLevel,
} from "@prisma/client";
import { z } from "zod";

const uuidSchema = z.string().uuid();
const optionalUrlSchema = z.string().trim().url().max(500).optional();
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:mm");

export const createCategorySchema = z.object({
  restaurantId: uuidSchema,
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  status: z.nativeEnum(MenuEntityStatus).optional(),
  imageUrl: optionalUrlSchema,
});

export const updateCategorySchema = createCategorySchema
  .omit({ restaurantId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const createMenuItemSchema = z.object({
  categoryId: uuidSchema,
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).optional(),
  price: z.coerce.number().positive(),
  preparationTimeMin: z.coerce.number().int().positive(),
  imageUrl: optionalUrlSchema,
  foodType: z.nativeEnum(FoodType),
  spicyLevel: z.nativeEnum(SpicyLevel).optional(),
  status: z.nativeEnum(MenuEntityStatus).optional(),
  isTodaySpecial: z.coerce.boolean().optional(),
  isAvailable: z.coerce.boolean().optional(),
});

export const updateMenuItemSchema = createMenuItemSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const createVariantSchema = z.object({
  menuItemId: uuidSchema,
  name: z.string().trim().min(1).max(80),
  priceDifference: z.coerce.number().default(0),
  status: z.nativeEnum(MenuEntityStatus).optional(),
});

export const updateVariantSchema = createVariantSchema
  .omit({ menuItemId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const createAddOnSchema = z.object({
  menuItemId: uuidSchema,
  name: z.string().trim().min(1).max(80),
  additionalPrice: z.coerce.number().positive(),
  status: z.nativeEnum(MenuEntityStatus).optional(),
});

export const updateAddOnSchema = createAddOnSchema
  .omit({ menuItemId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

const availabilityBaseSchema = z.object({
  menuItemId: uuidSchema,
  type: z.nativeEnum(MenuAvailabilityType),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
});

export const availabilitySchema = availabilityBaseSchema
  .refine((data) => data.type !== MenuAvailabilityType.CUSTOM_TIME || Boolean(data.startTime && data.endTime), {
    message: "startTime and endTime are required for custom availability",
    path: ["startTime"],
  });

export const updateAvailabilitySchema = availabilityBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");
