import { BookingType, RoomStatus, TableStatus } from "@prisma/client";
import { BookingRepository } from "../booking.repository.js";
import { isWithinBusinessHours } from "./bookingTime.service.js";
import { ConflictDetectionService } from "./conflictDetection.service.js";
import type { AvailabilityResult, TimeWindow } from "../types/booking.types.js";

export class AvailabilityService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly conflictDetectionService: ConflictDetectionService,
  ) {}

  async getTableAvailability(input: {
    restaurantId: string;
    floorId?: string;
    members: number;
    window: TimeWindow;
  }) {
    const tables = await this.bookingRepository.listTablesForAvailability(input);

    return Promise.all(
      tables.map(async (table): Promise<AvailabilityResult<typeof table>> => {
        if (table.status === TableStatus.OUT_OF_SERVICE || table.status === TableStatus.CLEANING) {
          return { resource: table, status: "BLOCKED", available: false, reason: `Table is ${table.status}` };
        }

        if (!isWithinBusinessHours(input.window, table.floor.restaurant.openingTime, table.floor.restaurant.closingTime)) {
          return { resource: table, status: "BLOCKED", available: false, reason: "Restaurant is closed" };
        }

        const conflict = await this.conflictDetectionService.hasConflict({
          bookingType: BookingType.TABLE,
          tableId: table.id,
          startAt: input.window.startAt,
          endAt: input.window.endAt,
        });

        if (conflict.hasConflict) {
          return { resource: table, status: "RESERVED", available: false, reason: "Overlapping booking exists" };
        }

        return { resource: table, status: "AVAILABLE", available: true };
      }),
    );
  }

  async getRoomAvailability(input: { restaurantId: string; members: number; window: TimeWindow }) {
    const rooms = await this.bookingRepository.listRoomsForAvailability(input);

    return Promise.all(
      rooms.map(async (room): Promise<AvailabilityResult<typeof room>> => {
        if (room.status === RoomStatus.OUT_OF_SERVICE || room.status === RoomStatus.CLEANING) {
          return { resource: room, status: "BLOCKED", available: false, reason: `Room is ${room.status}` };
        }

        if (!isWithinBusinessHours(input.window, room.restaurant.openingTime, room.restaurant.closingTime)) {
          return { resource: room, status: "BLOCKED", available: false, reason: "Restaurant is closed" };
        }

        const conflict = await this.conflictDetectionService.hasConflict({
          bookingType: BookingType.ROOM,
          roomId: room.id,
          startAt: input.window.startAt,
          endAt: input.window.endAt,
        });

        if (conflict.hasConflict) {
          return { resource: room, status: "RESERVED", available: false, reason: "Overlapping booking exists" };
        }

        return { resource: room, status: "AVAILABLE", available: true };
      }),
    );
  }
}
