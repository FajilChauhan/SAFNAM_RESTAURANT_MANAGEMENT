import type { BookingStatus, BookingType, Prisma } from "@prisma/client";
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
    return prisma.booking.findFirst({
      where: {
        id: input.excludeBookingId ? { not: input.excludeBookingId } : undefined,
        bookingType: input.bookingType,
        tableId: input.tableId,
        roomId: input.roomId,
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
      table: true,
      room: true,
    } satisfies Prisma.BookingInclude;
  }
}
