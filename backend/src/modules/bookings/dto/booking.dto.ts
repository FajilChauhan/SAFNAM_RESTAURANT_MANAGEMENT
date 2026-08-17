import type { BookingSource, BookingStatus, BookingType } from "@prisma/client";

export type BookingGuestDto = {
  fullName: string;
  aadhaarNumber: string;
};

export type CreateBookingDto = {
  customerId?: string;
  bookingType: BookingType;
  tableId?: string;
  roomId?: string;
  date: string;
  endDate?: string;     // for room bookings: check-out date
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  members: number;
  notes?: string;
  source: BookingSource;
  appliedOfferId?: string;
  useGameDiscount?: boolean;
  guests?: BookingGuestDto[];
};

export type UpdateBookingDto = Partial<
  Pick<CreateBookingDto, "tableId" | "roomId" | "date" | "startTime" | "endTime" | "durationMinutes" | "members" | "notes" | "useGameDiscount" | "guests">
> & {
  appliedOfferId?: string | null;
  status?: BookingStatus;
};

export type AvailabilityQueryDto = {
  restaurantId?: string;
  date: string;
  endDate?: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  members: number;
  floorId?: string;
};
