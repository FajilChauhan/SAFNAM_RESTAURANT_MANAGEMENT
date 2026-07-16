import type { BookingSource, BookingStatus, BookingType } from "@prisma/client";

export type CreateBookingDto = {
  customerId?: string;
  bookingType: BookingType;
  tableId?: string;
  roomId?: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  members: number;
  notes?: string;
  source: BookingSource;
};

export type UpdateBookingDto = Partial<
  Pick<CreateBookingDto, "tableId" | "roomId" | "date" | "startTime" | "endTime" | "durationMinutes" | "members" | "notes">
> & {
  status?: BookingStatus;
};

export type AvailabilityQueryDto = {
  restaurantId: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  members: number;
  floorId?: string;
};
