import type { BookingType } from "@prisma/client";
import { BookingRepository } from "../booking.repository.js";

export class ConflictDetectionService {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async hasConflict(input: {
    bookingType: BookingType;
    tableId?: string;
    roomId?: string;
    startAt: Date;
    endAt: Date;
    excludeBookingId?: string;
  }) {
    if (!input.roomId && !input.tableId) {
      return { hasConflict: false, conflictingBooking: null };
    }

    const overlappingBooking = await this.bookingRepository.findOverlappingBooking(input);

    return {
      hasConflict: Boolean(overlappingBooking),
      conflictingBooking: overlappingBooking,
    };
  }
}
