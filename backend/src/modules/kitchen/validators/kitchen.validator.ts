import { KitchenPriority } from "@prisma/client";
import { z } from "zod";

export const updateKitchenPrioritySchema = z.object({
  priority: z.nativeEnum(KitchenPriority),
});
