import type { OrderStatus } from "./order.types";

export type KitchenQueueStatus = "PENDING" | "ACCEPTED" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  status: KitchenQueueStatus;
  priority: "NORMAL" | "HIGH" | "VIP";
  orderStatus: OrderStatus;
}
