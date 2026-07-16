import { ApiError } from "../../../utils/ApiError.js";
import type { TimeWindow } from "../types/booking.types.js";

const DEFAULT_DURATION_MINUTES = 60;

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const fromMinutes = (minutes: number) => {
  const normalizedMinutes = minutes % (24 * 60);
  const hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const createTimeWindow = (input: {
  date: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
}): TimeWindow => {
  const duration = input.durationMinutes ?? DEFAULT_DURATION_MINUTES;
  const endTime = input.endTime ?? fromMinutes(toMinutes(input.startTime) + duration);
  const startAt = new Date(`${input.date}T${input.startTime}:00.000Z`);
  const endAt = new Date(`${input.date}T${endTime}:00.000Z`);

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw new ApiError(400, "Invalid booking date or time");
  }

  if (endAt <= startAt) {
    throw new ApiError(400, "End time must be after start time");
  }

  if (startAt <= new Date()) {
    throw new ApiError(400, "Booking cannot be created for a past time");
  }

  return {
    bookingDate: new Date(`${input.date}T00:00:00.000Z`),
    startTime: input.startTime,
    endTime,
    startAt,
    endAt,
  };
};

export const isWithinBusinessHours = (window: TimeWindow, openingTime: string, closingTime: string) => {
  const start = toMinutes(window.startTime);
  const end = toMinutes(window.endTime);
  const opening = toMinutes(openingTime);
  const closing = toMinutes(closingTime);

  return start >= opening && end <= closing;
};
