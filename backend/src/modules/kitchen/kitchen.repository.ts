import type { KitchenPriority, KitchenQueueStatus, OrderStatus } from "@prisma/client";
import { prisma } from "../../database/prisma.js";

const ACTIVE_KITCHEN_STATUSES: KitchenQueueStatus[] = ["PENDING", "ACCEPTED", "PREPARING", "READY"];

export class KitchenRepository {
  listQueue() {
    return prisma.kitchenQueue.findMany({
      where: {
        deletedAt: null,
        status: { in: ACTIVE_KITCHEN_STATUSES },
        order: {
          deletedAt: null,
          status: { notIn: ["CANCELLED", "SERVED"] },
        },
      },
      include: this.queueInclude(),
      orderBy: [{ priority: "desc" }, { queuedAt: "asc" }],
    });
  }

  findByOrderId(orderId: string) {
    return prisma.kitchenQueue.findUnique({
      where: { orderId },
      include: this.queueInclude(),
    });
  }

  updatePriority(orderId: string, priority: KitchenPriority, actorId: string) {
    return prisma.kitchenQueue.update({
      where: { orderId },
      data: { priority, updatedBy: actorId },
      include: this.queueInclude(),
    });
  }

  updateStatus(input: {
    orderId: string;
    queueStatus: KitchenQueueStatus;
    orderStatus: OrderStatus;
    actorId: string;
  }) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: input.orderId },
        data: { status: input.orderStatus, updatedBy: input.actorId },
      });

      return tx.kitchenQueue.update({
        where: { orderId: input.orderId },
        data: {
          status: input.queueStatus,
          acceptedAt: input.queueStatus === "ACCEPTED" ? now : undefined,
          startedAt: input.queueStatus === "PREPARING" ? now : undefined,
          readyAt: input.queueStatus === "READY" ? now : undefined,
          servedAt: input.queueStatus === "SERVED" ? now : undefined,
          cancelledAt: input.queueStatus === "CANCELLED" ? now : undefined,
          updatedBy: input.actorId,
        },
        include: this.queueInclude(),
      });
    });
  }

  async summary() {
    const [pending, accepted, preparing, ready, highPriority, vip] = await Promise.all([
      prisma.kitchenQueue.count({ where: { deletedAt: null, status: "PENDING" } }),
      prisma.kitchenQueue.count({ where: { deletedAt: null, status: "ACCEPTED" } }),
      prisma.kitchenQueue.count({ where: { deletedAt: null, status: "PREPARING" } }),
      prisma.kitchenQueue.count({ where: { deletedAt: null, status: "READY" } }),
      prisma.kitchenQueue.count({ where: { deletedAt: null, priority: "HIGH", status: { in: ACTIVE_KITCHEN_STATUSES } } }),
      prisma.kitchenQueue.count({ where: { deletedAt: null, priority: "VIP", status: { in: ACTIVE_KITCHEN_STATUSES } } }),
    ]);

    return { pending, accepted, preparing, ready, highPriority, vip };
  }

  private queueInclude() {
    return {
      order: {
        include: {
          booking: {
            include: {
              customer: { select: { id: true, fullName: true, phoneNumber: true } },
              table: true,
              room: true,
            },
          },
          items: { include: { addOns: true } },
        },
      },
    };
  }
}
