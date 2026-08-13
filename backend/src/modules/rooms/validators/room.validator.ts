import { RoomStatus } from "@prisma/client";
import { z } from "zod";

const priceSchema = z.coerce.number().positive();
const optionalUrlSchema = z.string().trim().url().max(500).optional();

export const createRoomSchema = z.object({
  restaurantId: z.string().uuid().optional(),
  roomNumber: z.string().trim().min(1).max(30),
  roomType: z.string().trim().min(2).max(80),
  capacity: z.coerce.number().int().positive(),
  pricePerDay: priceSchema,
  description: z.string().trim().max(1000).optional(),
  imageUrl: optionalUrlSchema,
  status: z.nativeEnum(RoomStatus).optional(),
});

export const updateRoomSchema = createRoomSchema
  .omit({ restaurantId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");
