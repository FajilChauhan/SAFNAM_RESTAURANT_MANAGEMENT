import type { Prisma, RoomStatus } from "@prisma/client";

export type CreateRoomDto = {
  restaurantId?: string;
  roomNumber: string;
  roomType: string;
  capacity: number;
  pricePerDay: Prisma.Decimal | number | string;
  description?: string;
  imageUrl?: string | null;
  status?: RoomStatus;
};

export type UpdateRoomDto = Partial<Omit<CreateRoomDto, "restaurantId">>;
