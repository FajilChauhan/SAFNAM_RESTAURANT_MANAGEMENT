import { FloorStatus } from "@prisma/client";
import { z } from "zod";

export const createFloorSchema = z.object({
  restaurantId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  displayOrder: z.coerce.number().int().min(0).optional(),
  description: z.string().trim().max(1000).optional(),
  status: z.nativeEnum(FloorStatus).optional(),
});

export const updateFloorSchema = createFloorSchema
  .omit({ restaurantId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");
