import type { BookingType } from "@prisma/client";

export type BookingResource = {
  type: BookingType;
  tableId?: string;
  roomId?: string;
};

export type TimeWindow = {
  bookingDate: Date;
  startTime: string;
  endTime: string;
  startAt: Date;
  endAt: Date;
};

export type AvailabilityStatus = "AVAILABLE" | "RESERVED" | "OCCUPIED" | "BLOCKED";

export type AvailabilityResult<TResource = unknown> = {
  resource: TResource;
  status: AvailabilityStatus;
  available: boolean;
  reason?: string;
};
