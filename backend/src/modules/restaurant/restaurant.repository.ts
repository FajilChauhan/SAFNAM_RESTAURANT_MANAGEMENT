import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { SINGLE_RESTAURANT_DEFAULTS, SINGLE_RESTAURANT_ID } from "./singleRestaurant.config.js";

export class RestaurantRepository {
  ensureSingle(data: Partial<Prisma.RestaurantUncheckedCreateInput> = {}) {
    return prisma.$transaction(async (tx) => {
      await tx.restaurant.updateMany({
        where: {
          id: { not: SINGLE_RESTAURANT_ID },
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });

      return tx.restaurant.upsert({
        where: { id: SINGLE_RESTAURANT_ID },
        update: {
          deletedAt: null,
        },
        create: {
          ...SINGLE_RESTAURANT_DEFAULTS,
          ...data,
        },
        include: {
          floors: {
            orderBy: { displayOrder: "asc" },
          },
          rooms: true,
        },
      });
    });
  }

  findPublic() {
    return prisma.restaurant.findUnique({
      where: { id: SINGLE_RESTAURANT_ID },
      include: {
        floors: {
          orderBy: { displayOrder: "asc" },
        },
        rooms: true,
      },
    });
  }

  countActive() {
    return prisma.restaurant.count({ where: { deletedAt: null } });
  }

  updateSingle(data: Prisma.RestaurantUpdateInput) {
    return prisma.restaurant.update({
      where: { id: SINGLE_RESTAURANT_ID },
      data,
      include: {
        floors: {
          orderBy: { displayOrder: "asc" },
        },
        rooms: true,
      },
    });
  }
}
