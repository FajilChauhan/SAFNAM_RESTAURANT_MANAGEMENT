import { BookingStatus, BookingType, RoomStatus, TableStatus, UserRole } from "@prisma/client";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { BaseService } from "../../lib/BaseService.js";
import type { QueryOptions } from "../../types/pagination.types.js";
import type { AuthenticatedUser } from "../../types/request.types.js";
import { ApiError } from "../../utils/ApiError.js";
import type { AvailabilityQueryDto, CreateBookingDto, UpdateBookingDto } from "./dto/booking.dto.js";
import { BookingRepository } from "./booking.repository.js";
import { AvailabilityService } from "./services/availability.service.js";
import { createTimeWindow, isWithinBusinessHours } from "./services/bookingTime.service.js";
import { ConflictDetectionService } from "./services/conflictDetection.service.js";
import type { TimeWindow } from "./types/booking.types.js";

const TERMINAL_STATUSES: BookingStatus[] = ["COMPLETED", "CANCELLED", "NO_SHOW"];

export class BookingService extends BaseService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly conflictDetectionService: ConflictDetectionService,
    private readonly availabilityService: AvailabilityService,
  ) {
    super();
  }

  async create(dto: CreateBookingDto, actor: AuthenticatedUser) {
    const customerId = this.resolveCustomerId(dto.customerId, actor);
    const window = createTimeWindow(dto);

    await this.validateResource(dto, window);
    await this.ensureNoConflict(dto.bookingType, dto.tableId, dto.roomId, window);

    return this.bookingRepository.create({
      bookingNumber: await this.generateBookingNumber(),
      customerId,
      bookingType: dto.bookingType,
      tableId: dto.bookingType === BookingType.TABLE ? dto.tableId : undefined,
      roomId: dto.bookingType === BookingType.ROOM ? dto.roomId : undefined,
      bookingDate: window.bookingDate,
      startTime: window.startTime,
      endTime: window.endTime,
      startAt: window.startAt,
      endAt: window.endAt,
      members: dto.members,
      notes: dto.notes,
      source: dto.source,
      status: BookingStatus.PENDING,
    });
  }

  async update(id: string, dto: UpdateBookingDto) {
    const booking = await this.getExistingBooking(id);

    if (TERMINAL_STATUSES.includes(booking.status)) {
      throw new ApiError(400, "Terminal bookings cannot be updated");
    }

    const bookingType = booking.bookingType;
    const tableId = bookingType === BookingType.TABLE ? dto.tableId ?? booking.tableId ?? undefined : undefined;
    const roomId = bookingType === BookingType.ROOM ? dto.roomId ?? booking.roomId ?? undefined : undefined;
    const hasTimeChange = Boolean(dto.date || dto.startTime || dto.endTime || dto.durationMinutes);
    const window = hasTimeChange
      ? createTimeWindow({
          date: dto.date ?? booking.bookingDate.toISOString().slice(0, 10),
          startTime: dto.startTime ?? booking.startTime,
          endTime: dto.endTime ?? booking.endTime,
          durationMinutes: dto.durationMinutes,
        })
      : {
          bookingDate: booking.bookingDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          startAt: booking.startAt,
          endAt: booking.endAt,
        };

    await this.validateResource(
      {
        bookingType,
        tableId,
        roomId,
        members: dto.members ?? booking.members,
      },
      window,
    );
    await this.ensureNoConflict(bookingType, tableId, roomId, window, booking.id);

    return this.bookingRepository.update(id, {
      tableId,
      roomId,
      bookingDate: window.bookingDate,
      startTime: window.startTime,
      endTime: window.endTime,
      startAt: window.startAt,
      endAt: window.endAt,
      members: dto.members,
      notes: dto.notes,
      status: dto.status,
    });
  }

  async cancel(id: string) {
    const booking = await this.getExistingBooking(id);

    if (TERMINAL_STATUSES.includes(booking.status)) {
      throw new ApiError(400, "Booking cannot be cancelled");
    }

    return this.bookingRepository.update(id, {
      status: BookingStatus.CANCELLED,
      cancelledAt: new Date(),
    });
  }

  async checkIn(id: string) {
    const booking = await this.getExistingBooking(id);

    const checkInAllowedStatuses: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

    if (!checkInAllowedStatuses.includes(booking.status)) {
      throw new ApiError(400, "Only pending or confirmed bookings can be checked in");
    }

    return this.bookingRepository.update(id, {
      status: BookingStatus.CHECKED_IN,
      checkedInAt: new Date(),
    });
  }

  async checkOut(id: string) {
    const booking = await this.getExistingBooking(id);

    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new ApiError(400, "Only checked-in bookings can be checked out");
    }

    return this.bookingRepository.update(id, {
      status: BookingStatus.COMPLETED,
      checkedOutAt: new Date(),
    });
  }

  async getById(id: string) {
    await this.markNoShows();
    return this.getExistingBooking(id);
  }

  async list(options: QueryOptions) {
    await this.markNoShows();
    return this.bookingRepository.list(options);
  }

  getAvailableTables(dto: AvailabilityQueryDto) {
    const window = createTimeWindow(dto);
    return this.availabilityService.getTableAvailability({
      restaurantId: dto.restaurantId,
      floorId: dto.floorId,
      members: dto.members,
      window,
    });
  }

  getAvailableRooms(dto: AvailabilityQueryDto) {
    const window = createTimeWindow(dto);
    return this.availabilityService.getRoomAvailability({
      restaurantId: dto.restaurantId,
      members: dto.members,
      window,
    });
  }

  private async getExistingBooking(id: string) {
    const booking = await this.bookingRepository.findById(id);
    return this.ensureExists(booking, "Booking not found");
  }

  private resolveCustomerId(customerId: string | undefined, actor: AuthenticatedUser) {
    if (actor.role === UserRole.CUSTOMER) {
      return actor.id;
    }

    if (!customerId) {
      throw new ApiError(400, "customerId is required for staff-created bookings");
    }

    return customerId;
  }

  private async validateResource(
    dto: Pick<CreateBookingDto, "bookingType" | "tableId" | "roomId" | "members">,
    window: TimeWindow,
  ) {
    if (dto.bookingType === BookingType.TABLE) {
      const table = await this.bookingRepository.findTableById(dto.tableId ?? "");

      if (!table) {
        throw new ApiError(404, "Table not found", ERROR_CODES.RESOURCE_NOT_FOUND);
      }

      if (table.capacity < dto.members) {
        throw new ApiError(400, "Table capacity is lower than booking members");
      }

      if (table.status === TableStatus.OUT_OF_SERVICE || table.status === TableStatus.CLEANING) {
        throw new ApiError(400, `Table is ${table.status}`);
      }

      if (!isWithinBusinessHours(window, table.floor.restaurant.openingTime, table.floor.restaurant.closingTime)) {
        throw new ApiError(400, "Restaurant is closed during selected time");
      }
    }

    if (dto.bookingType === BookingType.ROOM) {
      const room = await this.bookingRepository.findRoomById(dto.roomId ?? "");

      if (!room) {
        throw new ApiError(404, "Room not found", ERROR_CODES.RESOURCE_NOT_FOUND);
      }

      if (room.capacity < dto.members) {
        throw new ApiError(400, "Room capacity is lower than booking members");
      }

      if (room.status === RoomStatus.OUT_OF_SERVICE || room.status === RoomStatus.CLEANING) {
        throw new ApiError(400, `Room is ${room.status}`);
      }

      if (!isWithinBusinessHours(window, room.restaurant.openingTime, room.restaurant.closingTime)) {
        throw new ApiError(400, "Restaurant is closed during selected time");
      }
    }
  }

  private async ensureNoConflict(
    bookingType: BookingType,
    tableId: string | undefined,
    roomId: string | undefined,
    window: TimeWindow,
    excludeBookingId?: string,
  ) {
    const conflict = await this.conflictDetectionService.hasConflict({
      bookingType,
      tableId,
      roomId,
      startAt: window.startAt,
      endAt: window.endAt,
      excludeBookingId,
    });

    if (conflict.hasConflict) {
      throw new ApiError(409, "Selected resource already has an overlapping booking", ERROR_CODES.RESOURCE_CONFLICT);
    }
  }

  private async generateBookingNumber() {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const randomPart = Math.floor(100000 + Math.random() * 900000);
      const bookingNumber = `BK-${datePart}-${randomPart}`;
      const existingBooking = await this.bookingRepository.findByBookingNumber(bookingNumber);

      if (!existingBooking) {
        return bookingNumber;
      }
    }

    throw new ApiError(500, "Could not generate booking number");
  }

  private markNoShows() {
    return this.bookingRepository.markNoShows(new Date());
  }
}

const bookingRepository = new BookingRepository();
const conflictDetectionService = new ConflictDetectionService(bookingRepository);
const availabilityService = new AvailabilityService(bookingRepository, conflictDetectionService);

export const bookingService = new BookingService(
  bookingRepository,
  conflictDetectionService,
  availabilityService,
);
