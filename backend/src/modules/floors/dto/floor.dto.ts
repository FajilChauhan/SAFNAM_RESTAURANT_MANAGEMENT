import type { FloorStatus } from "@prisma/client";

export type CreateFloorDto = {
  restaurantId?: string;
  name: string;
  displayOrder?: number;
  description?: string;
  imageUrl?: string | null;
  status?: FloorStatus;
};

export type UpdateFloorDto = Partial<Omit<CreateFloorDto, "restaurantId">>;
