import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";

export class RestaurantRepository {
  create(data: Prisma.RestaurantCreateInput) {
    return prisma.restaurant.create({ data });
  }

  findPublic() {
    return prisma.restaurant.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        floors: {
          orderBy: { displayOrder: "asc" },
        },
        rooms: true,
      },
    });
  }

  findById(id: string) {
    return prisma.restaurant.findUnique({
      where: { id },
      include: {
        floors: {
          orderBy: { displayOrder: "asc" },
        },
        rooms: true,
      },
    });
  }

  update(id: string, data: Prisma.RestaurantUpdateInput) {
    return prisma.restaurant.update({
      where: { id },
      data,
    });
  }
}
