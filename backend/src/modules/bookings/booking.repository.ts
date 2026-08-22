import { BookingStatus, BookingType, RoomStatus, TableStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import type { QueryOptions } from "../../types/pagination.types.js";
import { buildFilterWhere } from "../../utils/filter.js";
import { createPaginationMeta } from "../../utils/pagination.js";
import { buildSearchWhere } from "../../utils/search.js";

const BOOKING_FILTER_FIELDS = ["customerId", "bookingType", "status", "source", "tableId", "roomId"];
const BOOKING_SEARCH_FIELDS = ["bookingNumber", "notes"];
const CONFLICT_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN"];

export class BookingRepository {
  create(data: Prisma.BookingUncheckedCreateInput) {
    return prisma.booking.create({
      data,
      include: this.defaultInclude(),
    });
  }

  findById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: this.defaultInclude(),
    });
  }

  findByBookingNumber(bookingNumber: string) {
    return prisma.booking.findUnique({ where: { bookingNumber } });
  }

  async list(options: QueryOptions) {
    const where = {
      ...buildFilterWhere(options.filters, BOOKING_FILTER_FIELDS),
      ...buildSearchWhere(options.search, BOOKING_SEARCH_FIELDS),
    } satisfies Prisma.BookingWhereInput;

    const orderBy = options.sort
      ? ({ [options.sort]: options.order } as Prisma.BookingOrderByWithRelationInput)
      : ({ startAt: "desc" } satisfies Prisma.BookingOrderByWithRelationInput);

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: options.skip,
        take: options.limit,
        orderBy,
        include: this.defaultInclude(),
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: createPaginationMeta(total, options),
    };
  }

  checkIn(id: string) {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id } });

      if (!booking) {
        throw new Error("Booking not found");
      }

      const checkedInAt = new Date();

      await tx.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CHECKED_IN,
          checkedInAt,
        },
      });

      if (booking.bookingType === BookingType.TABLE && booking.tableId) {
        await tx.diningTable.update({
          where: { id: booking.tableId },
          data: { status: TableStatus.OCCUPIED },
        });
      }

      if (booking.bookingType === BookingType.ROOM && booking.roomId) {
        await tx.room.update({
          where: { id: booking.roomId },
          data: { status: RoomStatus.OCCUPIED },
        });
      }

      return tx.booking.findUniqueOrThrow({
        where: { id },
        include: this.defaultInclude(),
      });
    });
  }

  update(id: string, data: Prisma.BookingUncheckedUpdateInput) {
    return prisma.booking.update({
      where: { id },
      data,
      include: this.defaultInclude(),
    });
  }

  findOverlappingBooking(input: {
    bookingType: BookingType;
    tableId?: string;
    roomId?: string;
    startAt: Date;
    endAt: Date;
    excludeBookingId?: string;
  }) {
    const hasResource = Boolean(input.roomId || input.tableId);
    if (!hasResource) {
      return null;
    }

    const resourceFilter: Prisma.BookingWhereInput = input.roomId
      ? { roomId: input.roomId }
      : { tableId: input.tableId };

    return prisma.booking.findFirst({
      where: {
        ...resourceFilter,
        id: input.excludeBookingId ? { not: input.excludeBookingId } : undefined,
        status: { in: CONFLICT_STATUSES },
        startAt: { lt: input.endAt },
        endAt: { gt: input.startAt },
      },
    });
  }

  findTableById(id: string) {
    return prisma.diningTable.findUnique({
      where: { id },
      include: {
        floor: {
          include: {
            restaurant: true,
          },
        },
      },
    });
  }

  findRoomById(id: string) {
    return prisma.room.findUnique({
      where: { id },
      include: {
        restaurant: true,
      },
    });
  }

  listTablesForAvailability(input: { restaurantId: string; floorId?: string; members: number }) {
    return prisma.diningTable.findMany({
      where: {
        capacity: { gte: input.members },
        floorId: input.floorId,
        floor: {
          restaurantId: input.restaurantId,
        },
      },
      include: {
        floor: {
          include: {
            restaurant: true,
          },
        },
      },
      orderBy: [{ capacity: "asc" }, { tableNumber: "asc" }],
    });
  }

  listRoomsForAvailability(input: { restaurantId: string; members: number }) {
    return prisma.room.findMany({
      where: {
        restaurantId: input.restaurantId,
        capacity: { gte: input.members },
      },
      include: {
        restaurant: true,
      },
      orderBy: [{ capacity: "asc" }, { roomNumber: "asc" }],
    });
  }

  /** All non-terminal bookings for a specific table on a given calendar date (UTC). */
  findTableBookingsForDate(tableId: string, date: Date) {
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    return prisma.booking.findMany({
      where: {
        tableId,
        status: { in: CONFLICT_STATUSES },
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
      include: {
        customer: {
          select: { id: true, fullName: true, phoneNumber: true, email: true },
        },
      },
      orderBy: { startAt: "asc" },
    });
  }

  /** All non-terminal bookings for a specific room that overlap the given period. */
  findRoomBookingsForPeriod(roomId: string, checkIn: Date, checkOut: Date) {
    return prisma.booking.findMany({
      where: {
        roomId,
        status: { in: CONFLICT_STATUSES },
        startAt: { lt: checkOut },
        endAt: { gt: checkIn },
      },
      include: {
        customer: {
          select: { id: true, fullName: true, phoneNumber: true, email: true },
        },
      },
      orderBy: { startAt: "asc" },
    });
  }

  /** Currently CHECKED_IN booking for a table (active occupancy). */
  findActiveTableOccupancy(tableId: string) {
    return prisma.booking.findFirst({
      where: { tableId, status: "CHECKED_IN" },
      include: {
        customer: {
          select: { id: true, fullName: true, phoneNumber: true, email: true },
        },
      },
      orderBy: { checkedInAt: "desc" },
    });
  }

  /** Currently CHECKED_IN booking for a room (active occupancy). */
  findActiveRoomOccupancy(roomId: string) {
    return prisma.booking.findFirst({
      where: { roomId, status: "CHECKED_IN" },
      include: {
        customer: {
          select: { id: true, fullName: true, phoneNumber: true, email: true },
        },
        invoice: {
          select: { status: true },
        },
      },
      orderBy: { checkedInAt: "desc" },
    });
  }

  markNoShows(now: Date) {
    return prisma.booking.updateMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        endAt: { lt: now },
      },
      data: {
        status: "NO_SHOW",
        noShowAt: now,
      },
    });
  }

  private defaultInclude() {
    return {
      customer: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          email: true,
        },
      },
      table: {
        include: {
          floor: true,
        },
      },
      room: true,
      guests: {
        where: { deletedAt: null },
      },
      appliedOffer: true,
      invoice: {
        include: {
          payments: {
            where: { deletedAt: null },
            orderBy: { paidAt: "desc" },
          },
        },
      },
      orders: {
        where: { deletedAt: null },
        include: {
          items: true,
        },
      },
    } satisfies Prisma.BookingInclude;
  }
}
