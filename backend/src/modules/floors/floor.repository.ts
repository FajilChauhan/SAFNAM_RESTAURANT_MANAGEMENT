import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import type { QueryOptions } from "../../types/pagination.types.js";
import { buildFilterWhere } from "../../utils/filter.js";
import { createPaginationMeta } from "../../utils/pagination.js";
import { buildSearchWhere } from "../../utils/search.js";

const FLOOR_FILTER_FIELDS = ["restaurantId", "status"];
const FLOOR_SEARCH_FIELDS = ["name", "description"];

export class FloorRepository {
  create(data: Prisma.FloorUncheckedCreateInput) {
    return prisma.floor.create({ data });
  }

  findById(id: string) {
    return prisma.floor.findUnique({ where: { id } });
  }

  findByRestaurantAndName(restaurantId: string, name: string) {
    return prisma.floor.findUnique({
      where: {
        restaurantId_name: {
          restaurantId,
          name,
        },
      },
    });
  }

  async list(options: QueryOptions) {
    const where = {
      ...buildFilterWhere(options.filters, FLOOR_FILTER_FIELDS),
      ...buildSearchWhere(options.search, FLOOR_SEARCH_FIELDS),
    } satisfies Prisma.FloorWhereInput;

    const orderBy = options.sort
      ? ({ [options.sort]: options.order } as Prisma.FloorOrderByWithRelationInput)
      : ({ displayOrder: "asc" } satisfies Prisma.FloorOrderByWithRelationInput);

    const [floors, total] = await Promise.all([
      prisma.floor.findMany({
        where,
        skip: options.skip,
        take: options.limit,
        orderBy,
      }),
      prisma.floor.count({ where }),
    ]);

    return {
      data: floors,
      meta: createPaginationMeta(total, options),
    };
  }

  update(id: string, data: Prisma.FloorUpdateInput) {
    return prisma.floor.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return prisma.floor.delete({ where: { id } });
  }
}
