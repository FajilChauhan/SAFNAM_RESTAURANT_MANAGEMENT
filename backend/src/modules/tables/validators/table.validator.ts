import { TableShape, TableStatus } from "@prisma/client";
import { z } from "zod";

export const createTableSchema = z.object({
  floorId: z.string().uuid(),
  tableNumber: z.string().trim().min(1).max(30),
  capacity: z.coerce.number().int().positive(),
  shape: z.nativeEnum(TableShape),
  status: z.nativeEnum(TableStatus).optional(),
  qrCodeUrl: z.string().trim().url().max(500).optional(),
});

export const updateTableSchema = createTableSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");
