import type { KitchenPriority } from "@prisma/client";

export type UpdateKitchenPriorityDto = {
  priority: KitchenPriority;
};
