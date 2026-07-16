import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import type { QueryOptions } from "../../types/pagination.types.js";
import { buildFilterWhere } from "../../utils/filter.js";
import { createPaginationMeta } from "../../utils/pagination.js";
import { buildSearchWhere } from "../../utils/search.js";

const ROOM_FILTER_FIELDS = ["restaurantId", "status", "roomType"];
const ROOM_SEARCH_FIELDS = ["roomNumber", "roomType", "description"];

export class RoomRepository {
  create(data: Prisma.RoomUncheckedCreateInput) {
    return prisma.room.create({ data });
  }

  findById(id: string) {
    return prisma.room.findUnique({ where: { id } });
  }

  findByRoomNumber(roomNumber: string) {
    return prisma.room.findUnique({ where: { roomNumber } });
  }

  async list(options: QueryOptions) {
    const where = {
      ...buildFilterWhere(options.filters, ROOM_FILTER_FIELDS),
      ...buildSearchWhere(options.search, ROOM_SEARCH_FIELDS),
    } satisfies Prisma.RoomWhereInput;

    const orderBy = options.sort
      ? ({ [options.sort]: options.order } as Prisma.RoomOrderByWithRelationInput)
      : ({ roomNumber: "asc" } satisfies Prisma.RoomOrderByWithRelationInput);

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        skip: options.skip,
        take: options.limit,
        orderBy,
      }),
      prisma.room.count({ where }),
    ]);

    return {
      data: rooms,
      meta: createPaginationMeta(total, options),
    };
  }

  update(id: string, data: Prisma.RoomUpdateInput) {
    return prisma.room.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return prisma.room.delete({ where: { id } });
  }
}
