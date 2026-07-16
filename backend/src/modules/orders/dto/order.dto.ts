import type { OrderSource, OrderStatus } from "@prisma/client";

export type AddCartItemDto = {
  bookingId: string;
  menuItemId: string;
  variantId?: string;
  addOnIds?: string[];
  quantity: number;
  specialNotes?: string;
};

export type UpdateCartItemQuantityDto = {
  quantity: number;
};

export type UpdateCartItemNotesDto = {
  specialNotes?: string;
};

export type ConfirmOrderDto = {
  bookingId: string;
  source: OrderSource;
};

export type UpdateOrderStatusDto = {
  status: OrderStatus;
};
