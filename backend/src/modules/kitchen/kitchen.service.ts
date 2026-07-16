import type { KitchenQueueStatus, OrderStatus } from "@prisma/client";
import { BaseService } from "../../lib/BaseService.js";
import type { AuthenticatedUser } from "../../types/request.types.js";
import { ApiError } from "../../utils/ApiError.js";
import type { UpdateKitchenPriorityDto } from "./dto/kitchen.dto.js";
import { KitchenRepository } from "./kitchen.repository.js";

const TRANSITIONS: Record<KitchenQueueStatus, KitchenQueueStatus[]> = {
  PENDING: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED"],
  SERVED: [],
  CANCELLED: [],
};

const ORDER_STATUS_BY_QUEUE_STATUS: Record<KitchenQueueStatus, OrderStatus> = {
  PENDING: "CONFIRMED",
  ACCEPTED: "CONFIRMED",
  PREPARING: "PREPARING",
  READY: "READY",
  SERVED: "SERVED",
  CANCELLED: "CANCELLED",
};

export class KitchenService extends BaseService {
  constructor(private readonly kitchenRepository: KitchenRepository) {
    super();
  }

  getQueue() {
    return this.kitchenRepository.listQueue();
  }

  getSummary() {
    return this.kitchenRepository.summary();
  }

  updatePriority(orderId: string, dto: UpdateKitchenPriorityDto, actor: AuthenticatedUser) {
    return this.kitchenRepository.updatePriority(orderId, dto.priority, actor.id);
  }

  acceptOrder(orderId: string, actor: AuthenticatedUser) {
    return this.transition(orderId, "ACCEPTED", actor);
  }

  rejectOrder(orderId: string, actor: AuthenticatedUser) {
    return this.transition(orderId, "CANCELLED", actor);
  }

  startPreparing(orderId: string, actor: AuthenticatedUser) {
    return this.transition(orderId, "PREPARING", actor);
  }

  markReady(orderId: string, actor: AuthenticatedUser) {
    return this.transition(orderId, "READY", actor);
  }

  markServed(orderId: string, actor: AuthenticatedUser) {
    return this.transition(orderId, "SERVED", actor);
  }

  private async transition(orderId: string, nextStatus: KitchenQueueStatus, actor: AuthenticatedUser) {
    const queueItem = this.ensureExists(await this.kitchenRepository.findByOrderId(orderId), "Kitchen queue item not found");
    const allowedStatuses = TRANSITIONS[queueItem.status];

    if (!allowedStatuses.includes(nextStatus)) {
      throw new ApiError(400, `Cannot move kitchen order from ${queueItem.status} to ${nextStatus}`);
    }

    return this.kitchenRepository.updateStatus({
      orderId,
      queueStatus: nextStatus,
      orderStatus: ORDER_STATUS_BY_QUEUE_STATUS[nextStatus],
      actorId: actor.id,
    });
  }
}

export const kitchenService = new KitchenService(new KitchenRepository());
