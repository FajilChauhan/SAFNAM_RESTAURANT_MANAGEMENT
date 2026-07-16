import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import type { QueryOptions } from "../../types/pagination.types.js";
import { buildFilterWhere } from "../../utils/filter.js";
import { createPaginationMeta } from "../../utils/pagination.js";
import { buildSearchWhere } from "../../utils/search.js";

const TABLE_FILTER_FIELDS = ["floorId", "status", "shape"];
const TABLE_SEARCH_FIELDS = ["tableNumber"];

export class TableRepository {
  create(data: Prisma.DiningTableUncheckedCreateInput) {
    return prisma.diningTable.create({ data });
  }

  findById(id: string) {
    return prisma.diningTable.findUnique({ where: { id } });
  }

  findByTableNumber(tableNumber: string) {
    return prisma.diningTable.findUnique({ where: { tableNumber } });
  }

  async list(options: QueryOptions) {
    const where = {
      ...buildFilterWhere(options.filters, TABLE_FILTER_FIELDS),
      ...buildSearchWhere(options.search, TABLE_SEARCH_FIELDS),
    } satisfies Prisma.DiningTableWhereInput;

    const orderBy = options.sort
      ? ({ [options.sort]: options.order } as Prisma.DiningTableOrderByWithRelationInput)
      : ({ tableNumber: "asc" } satisfies Prisma.DiningTableOrderByWithRelationInput);

    const [tables, total] = await Promise.all([
      prisma.diningTable.findMany({
        where,
        skip: options.skip,
        take: options.limit,
        orderBy,
        include: {
          floor: true,
        },
      }),
      prisma.diningTable.count({ where }),
    ]);

    return {
      data: tables,
      meta: createPaginationMeta(total, options),
    };
  }

  update(id: string, data: Prisma.DiningTableUpdateInput) {
    return prisma.diningTable.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return prisma.diningTable.delete({ where: { id } });
  }
}
