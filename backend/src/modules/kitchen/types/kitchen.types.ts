import type { KitchenPriority, KitchenQueueStatus } from "@prisma/client";

export type KitchenDashboardSummary = {
  pending: number;
  accepted: number;
  preparing: number;
  ready: number;
  highPriority: number;
  vip: number;
};

export type KitchenRealtimePayload = {
  queueId: string;
  orderId: string;
  status: KitchenQueueStatus;
  priority: KitchenPriority;
};
