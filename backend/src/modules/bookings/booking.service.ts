import { BookingStatus, BookingType, RoomStatus, TableStatus, UserRole, DiscountSource, RewardStatus, OfferApplicableTo } from "@prisma/client";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { BaseService } from "../../lib/BaseService.js";
import type { QueryOptions } from "../../types/pagination.types.js";
import type { AuthenticatedUser } from "../../types/request.types.js";
import { ApiError } from "../../utils/ApiError.js";
import { restaurantService } from "../restaurant/restaurant.service.js";
import type { AvailabilityQueryDto, CreateBookingDto, UpdateBookingDto } from "./dto/booking.dto.js";
import { BookingRepository } from "./booking.repository.js";
import { AvailabilityService } from "./services/availability.service.js";
import { createTimeWindow, isWithinBusinessHours } from "./services/bookingTime.service.js";
import { ConflictDetectionService } from "./services/conflictDetection.service.js";
import type { TimeWindow } from "./types/booking.types.js";
import { prisma } from "../../database/prisma.js";

const TERMINAL_STATUSES: BookingStatus[] = ["COMPLETED", "CANCELLED", "NO_SHOW"];

// ─── Slot computation helper ──────────────────────────────────────────────────
const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const fromMinutes = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/**
 * Given opening/closing times and a list of blocked slots (sorted by startTime),
 * compute the list of free time windows within business hours.
 */
function computeAvailableSlots(
  openingTime: string,
  closingTime: string,
  blockedSlots: Array<{ startTime: string; endTime: string }>,
): Array<{ startTime: string; endTime: string }> {
  const open = toMinutes(openingTime);
  const close = toMinutes(closingTime);
  const available: Array<{ startTime: string; endTime: string }> = [];

  // Sort blocked slots by start
  const sorted = [...blockedSlots].sort(
    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime),
  );

  let cursor = open;

  for (const slot of sorted) {
    const slotStart = toMinutes(slot.startTime);
    const slotEnd = toMinutes(slot.endTime);

    if (slotStart > cursor) {
      available.push({ startTime: fromMinutes(cursor), endTime: fromMinutes(slotStart) });
    }

    cursor = Math.max(cursor, slotEnd);
  }

  if (cursor < close) {
    available.push({ startTime: fromMinutes(cursor), endTime: fromMinutes(close) });
  }

  return available;
}

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
    const window = createTimeWindow({
      date: dto.date,
      endDate: dto.endDate,     // check-out date for room bookings
      startTime: dto.startTime,
      endTime: dto.endTime,
      durationMinutes: dto.durationMinutes,
    });

    await this.validateResource(dto, window);
    await this.ensureNoConflict(dto.bookingType, dto.tableId, dto.roomId, window);

    // ─── Guest Validation for Room Booking ──────────────────────────────────
    if (dto.bookingType === BookingType.ROOM) {
      if (!dto.guests || dto.guests.length !== dto.members) {
        throw new ApiError(400, `Room booking requires guest details (Name & Aadhaar) for all ${dto.members} guests.`);
      }
    }

    // ─── Discount / Offer Application ───────────────────────────────────────
    let discountSource: DiscountSource = DiscountSource.NONE;
    let discountPercentage = 0;
    let appliedOfferId: string | undefined = undefined;
    let gameRewardId: string | undefined = undefined;

    if (dto.appliedOfferId && dto.useGameDiscount) {
      throw new ApiError(400, "Cannot apply both offer and game discount. Please select only one.");
    }

    if (dto.appliedOfferId) {
      const offer = await prisma.offer.findUnique({
        where: { id: dto.appliedOfferId, deletedAt: null },
        include: { floors: true, roomTypes: true },
      });

      if (!offer || offer.status !== "ACTIVE") {
        throw new ApiError(400, "Selected offer is not active or available.");
      }

      const now = new Date();
      if (now < offer.startsAt || now > offer.endsAt) {
        throw new ApiError(400, "Selected offer is outside its validity period.");
      }

      // Check offer applicability
      if (dto.bookingType === BookingType.ROOM && offer.applicableTo === "TABLE") {
        throw new ApiError(400, "Selected offer is only valid for table bookings.");
      }
      if (dto.bookingType === BookingType.TABLE && offer.applicableTo === "ROOM") {
        throw new ApiError(400, "Selected offer is only valid for room bookings.");
      }

      // Check level 2 applicability: Floor for Table booking
      if (dto.bookingType === BookingType.TABLE && dto.tableId) {
        const table = await prisma.diningTable.findUnique({
          where: { id: dto.tableId },
          select: { floorId: true },
        });
        if (!table) {
          throw new ApiError(400, "Dining table not found.");
        }
        if (!offer.allFloors && !offer.floors.some((f) => f.floorId === table.floorId)) {
          throw new ApiError(400, "Selected offer is not applicable to the floor where the table is located.");
        }
      }

      // Check level 2 applicability: Room Category/Type for Room booking
      if (dto.bookingType === BookingType.ROOM && dto.roomId) {
        const room = await prisma.room.findUnique({
          where: { id: dto.roomId },
          select: { roomType: true },
        });
        if (!room) {
          throw new ApiError(400, "Room not found.");
        }
        if (!offer.allRoomTypes && !offer.roomTypes.some((rt) => rt.roomType === room.roomType)) {
          throw new ApiError(400, "Selected offer is not applicable to the room's category/type.");
        }
      }

      discountSource = DiscountSource.OFFER;
      discountPercentage = Number(offer.discountValue);
      appliedOfferId = offer.id;
    } else if (dto.useGameDiscount) {
      const reward = await prisma.gameReward.findFirst({
        where: {
          customerId,
          status: RewardStatus.ACTIVE,
          expiresAt: { gte: new Date() },
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!reward) {
        throw new ApiError(400, "No active game discount found for this customer.");
      }

      const value = Number(reward.discountValue);
      if (value > 15) {
        throw new ApiError(400, "Game discount exceeds maximum allowed limit of 15%.");
      }

      discountSource = DiscountSource.GAME;
      discountPercentage = value;
      gameRewardId = reward.id;
    }

    // Create the booking
    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
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
          discountSource,
          discountPercentage,
          appliedOfferId,
          guests: dto.bookingType === BookingType.ROOM && dto.guests ? {
            create: dto.guests.map((g) => ({
              fullName: g.fullName,
              aadhaarNumber: g.aadhaarNumber,
            })),
          } : undefined,
        },
        include: {
          customer: {
            select: { id: true, fullName: true, phoneNumber: true, email: true },
          },
          table: { include: { floor: true } },
          room: true,
          appliedOffer: true,
          guests: { where: { deletedAt: null } },
        },
      });

      // Consume game reward if used
      if (gameRewardId) {
        await tx.gameReward.update({
          where: { id: gameRewardId },
          data: {
            bookingId: created.id,
            status: RewardStatus.USED,
            usedAt: new Date(),
          },
        });
      }

      return created;
    });

    return booking;
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

    const finalMembers = dto.members ?? booking.members;

    await this.validateResource(
      {
        bookingType,
        tableId,
        roomId,
        members: finalMembers,
      },
      window,
    );
    await this.ensureNoConflict(bookingType, tableId, roomId, window, booking.id);

    // ─── Guest List Validation and Update ───────────────────────────────────
    if (bookingType === BookingType.ROOM && dto.guests) {
      if (dto.guests.length !== finalMembers) {
        throw new ApiError(400, `Guest details count (${dto.guests.length}) must match guest count (${finalMembers}).`);
      }
    }

    // ─── Discount / Offer Application ───────────────────────────────────────
    let discountSource: DiscountSource = booking.discountSource;
    let discountPercentage = Number(booking.discountPercentage);
    let appliedOfferId: string | null = booking.appliedOfferId ?? null;

    if (dto.appliedOfferId !== undefined || dto.useGameDiscount !== undefined) {
      if (dto.appliedOfferId && dto.useGameDiscount) {
        throw new ApiError(400, "Cannot apply both offer and game discount.");
      }

      if (dto.appliedOfferId === null) {
        discountSource = DiscountSource.NONE;
        discountPercentage = 0;
        appliedOfferId = null;
      } else if (dto.appliedOfferId) {
        const offer = await prisma.offer.findUnique({
          where: { id: dto.appliedOfferId, deletedAt: null },
          include: { floors: true, roomTypes: true },
        });

        if (!offer || offer.status !== "ACTIVE") {
          throw new ApiError(400, "Selected offer is not active.");
        }

        if (bookingType === BookingType.ROOM && offer.applicableTo === "TABLE") {
          throw new ApiError(400, "Offer only applicable to table bookings.");
        }
        if (bookingType === BookingType.TABLE && offer.applicableTo === "ROOM") {
          throw new ApiError(400, "Offer only applicable to room bookings.");
        }

        // Check level 2 applicability on update
        if (bookingType === BookingType.TABLE && tableId) {
          const table = await prisma.diningTable.findUnique({
            where: { id: tableId },
            select: { floorId: true },
          });
          if (!table) {
            throw new ApiError(400, "Dining table not found.");
          }
          if (!offer.allFloors && !offer.floors.some((f) => f.floorId === table.floorId)) {
            throw new ApiError(400, "Selected offer is not applicable to the floor where the table is located.");
          }
        }

        if (bookingType === BookingType.ROOM && roomId) {
          const room = await prisma.room.findUnique({
            where: { id: roomId },
            select: { roomType: true },
          });
          if (!room) {
            throw new ApiError(400, "Room not found.");
          }
          if (!offer.allRoomTypes && !offer.roomTypes.some((rt) => rt.roomType === room.roomType)) {
            throw new ApiError(400, "Selected offer is not applicable to the room's category/type.");
          }
        }

        discountSource = DiscountSource.OFFER;
        discountPercentage = Number(offer.discountValue);
        appliedOfferId = offer.id;
      } else if (dto.useGameDiscount) {
        const reward = await prisma.gameReward.findFirst({
          where: {
            customerId: booking.customerId,
            status: RewardStatus.ACTIVE,
            expiresAt: { gte: new Date() },
            deletedAt: null,
          },
          orderBy: { createdAt: "desc" },
        });

        if (!reward) {
          throw new ApiError(400, "No active game discount found.");
        }

        const value = Number(reward.discountValue);
        if (value > 15) {
          throw new ApiError(400, "Game discount exceeds maximum limit of 15%.");
        }

        discountSource = DiscountSource.GAME;
        discountPercentage = value;
        appliedOfferId = null;

        await prisma.gameReward.update({
          where: { id: reward.id },
          data: {
            bookingId: booking.id,
            status: RewardStatus.USED,
            usedAt: new Date(),
          },
        });
      }
    }

    return prisma.$transaction(async (tx) => {
      // Re-link or create guests list if provided
      if (bookingType === BookingType.ROOM && dto.guests) {
        await tx.bookingGuest.deleteMany({
          where: { bookingId: booking.id },
        });

        await tx.bookingGuest.createMany({
          data: dto.guests.map((g) => ({
            bookingId: booking.id,
            fullName: g.fullName,
            aadhaarNumber: g.aadhaarNumber,
          })),
        });
      }

      const updated = await tx.booking.update({
        where: { id },
        data: {
          tableId,
          roomId,
          bookingDate: window.bookingDate,
          startTime: window.startTime,
          endTime: window.endTime,
          startAt: window.startAt,
          endAt: window.endAt,
          members: finalMembers,
          notes: dto.notes,
          status: dto.status,
          discountSource,
          discountPercentage,
          appliedOfferId,
        },
        include: {
          customer: { select: { id: true, fullName: true, phoneNumber: true, email: true } },
          table: { include: { floor: true } },
          room: true,
          appliedOffer: true,
          guests: { where: { deletedAt: null } },
        },
      });

      return updated;
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

    return this.bookingRepository.checkIn(id);
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

  async getAvailableTables(dto: AvailabilityQueryDto) {
    const restaurant = await restaurantService.ensureSingle();
    const window = createTimeWindow(dto);
    return this.availabilityService.getTableAvailability({
      restaurantId: dto.restaurantId ?? restaurant.id,
      floorId: dto.floorId,
      members: dto.members,
      window,
    });
  }

  async getAvailableRooms(dto: AvailabilityQueryDto) {
    const restaurant = await restaurantService.ensureSingle();
    const window = createTimeWindow(dto);
    return this.availabilityService.getRoomAvailability({
      restaurantId: dto.restaurantId ?? restaurant.id,
      members: dto.members,
      window,
    });
  }

  /**
   * Returns slot-level availability for a specific table on a given date.
   * Opening/closing times come from restaurant settings — never hardcoded.
   */
  async getTableSlotAvailability(tableId: string, date: string) {
    const table = await this.bookingRepository.findTableById(tableId);
    if (!table) {
      throw new ApiError(404, "Table not found", ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const restaurant = table.floor.restaurant;
    const { openingTime, closingTime } = restaurant;

    // Parse the requested date as UTC midnight
    const dateUtc = new Date(`${date}T00:00:00.000Z`);

    const [bookings, activeOccupancy] = await Promise.all([
      this.bookingRepository.findTableBookingsForDate(tableId, dateUtc),
      this.bookingRepository.findActiveTableOccupancy(tableId),
    ]);

    // Build blocked slots from bookings
    const blockedSlots = bookings.map((b) => ({
      startTime: b.startTime,
      endTime: b.endTime,
      bookingId: b.id,
      bookingNumber: b.bookingNumber,
      status: b.status,
      customerName: b.customer.fullName,
    }));

    // Compute available slots as gaps between blocked slots within business hours
    const availableSlots = computeAvailableSlots(openingTime, closingTime, blockedSlots);

    return {
      table: {
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        status: table.status,
        floor: { id: table.floor.id, name: table.floor.name },
      },
      date,
      openingTime,
      closingTime,
      bookings: blockedSlots,
      blockedSlots: blockedSlots.map(({ startTime, endTime }) => ({ startTime, endTime })),
      availableSlots,
      activeOccupancy: activeOccupancy
        ? {
            bookingNumber: activeOccupancy.bookingNumber,
            customerName: activeOccupancy.customer.fullName,
            occupiedAt: activeOccupancy.checkedInAt?.toISOString() ?? null,
            expectedEndTime: activeOccupancy.endTime,
          }
        : null,
    };
  }

  /**
   * Returns date-range availability for a specific room given check-in and check-out dates.
   * Actual checkout (not time calculation) is the source of truth for OCCUPIED status.
   */
  async getRoomDateAvailability(roomId: string, checkIn: string, checkOut: string) {
    const room = await this.bookingRepository.findRoomById(roomId);
    if (!room) {
      throw new ApiError(404, "Room not found", ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const checkInDate = new Date(`${checkIn}T00:00:00.000Z`);
    const checkOutDate = new Date(`${checkOut}T00:00:00.000Z`);

    if (checkOutDate <= checkInDate) {
      throw new ApiError(400, "Check-out date must be after check-in date");
    }

    const [conflictingBookings, activeOccupancy] = await Promise.all([
      this.bookingRepository.findRoomBookingsForPeriod(roomId, checkInDate, checkOutDate),
      this.bookingRepository.findActiveRoomOccupancy(roomId),
    ]);

    const available = conflictingBookings.length === 0 && !activeOccupancy;

    return {
      room: {
        id: room.id,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        capacity: room.capacity,
        pricePerDay: room.pricePerDay.toString(),
        status: room.status,
      },
      requestedPeriod: { checkIn, checkOut },
      conflictingBookings: conflictingBookings.map((b) => ({
        bookingId: b.id,
        bookingNumber: b.bookingNumber,
        checkIn: b.bookingDate.toISOString().slice(0, 10),
        checkOut: b.endAt.toISOString().slice(0, 10),
        status: b.status,
        customerName: b.customer.fullName,
      })),
      available,
      activeOccupancy: activeOccupancy
        ? {
            bookingNumber: activeOccupancy.bookingNumber,
            guestName: activeOccupancy.customer.fullName,
            checkedInAt: activeOccupancy.checkedInAt?.toISOString() ?? null,
            expectedCheckoutAt: activeOccupancy.endAt.toISOString(),
            paymentStatus: (activeOccupancy as any).invoice?.status ?? "PENDING",
          }
        : null,
    };
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
      throw new ApiError(409, "Selected resource is already booked during this time", ERROR_CODES.RESOURCE_CONFLICT);
    }
  }

  async getEligibleOffers(query: { bookingType: BookingType; tableId?: string; roomId?: string }) {
    const normalizeRoomType = (value?: string | null) => value?.trim().toLowerCase() ?? "";

    const now = new Date();
    const offers = await prisma.offer.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: {
        floors: {
          select: { floorId: true },
        },
        roomTypes: {
          select: { roomType: true },
        },
      },
    });

    if (query.bookingType === BookingType.TABLE) {
      let floorId: string | null = null;
      if (query.tableId) {
        const table = await prisma.diningTable.findUnique({
          where: { id: query.tableId },
          select: { floorId: true },
        });
        if (table) {
          floorId = table.floorId;
        }
      }

      return offers.filter((o) => {
        if (o.applicableTo !== OfferApplicableTo.TABLE && o.applicableTo !== OfferApplicableTo.BOTH) return false;
        if (o.allFloors) return true;
        if (!floorId) return true;
        return o.floors.some((f) => f.floorId === floorId);
      });
    }

    let roomType: string | null = null;
    if (query.roomId) {
      const room = await prisma.room.findUnique({
        where: { id: query.roomId },
        select: { roomType: true },
      });
      if (room) {
        roomType = room.roomType;
      }
    }

    const normalizedRoomType = normalizeRoomType(roomType);

    return offers.filter((o) => {
      if (o.applicableTo !== OfferApplicableTo.ROOM && o.applicableTo !== OfferApplicableTo.BOTH) return false;
      if (o.allRoomTypes) return true;
      if (!normalizedRoomType) return true;
      return o.roomTypes.some((rt) => normalizeRoomType(rt.roomType) === normalizedRoomType);
    });
  }

  private async generateBookingNumber() {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const bookingNumber = `BK-${datePart}-${Math.floor(100000 + Math.random() * 900000)}`;
      if (!(await this.bookingRepository.findByBookingNumber(bookingNumber))) return bookingNumber;
    }
    throw new ApiError(500, "Could not generate booking number");
  }

  private async markNoShows() {
    const now = new Date();
    await this.bookingRepository.markNoShows(now);
  }
}

export const bookingService = new BookingService(
  new BookingRepository(),
  new ConflictDetectionService(new BookingRepository()),
  new AvailabilityService(new BookingRepository(), new ConflictDetectionService(new BookingRepository())),
);
