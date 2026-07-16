import type { KitchenQueueStatus, OrderStatus } from "@prisma/client";

export type BillReadyOrderLine = {
  itemName: string;
  variantName?: string;
  quantity: number;
  unitPrice: string;
  addOnsTotal: string;
  discount: string;
  lineTotal: string;
};

export type BillReadyOrder = {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: string;
  discount: string;
  total: string;
  lines: BillReadyOrderLine[];
};

export type KitchenQueueEvent = {
  orderId: string;
  orderNumber: string;
  status: KitchenQueueStatus;
};
