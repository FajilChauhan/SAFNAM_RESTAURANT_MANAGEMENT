import type { Addon, Variant } from "./menu.types";

export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: Variant;
  addons?: Addon[];
  totalPrice: number;
}

export interface OrderItem extends CartItem {}

export interface Order {
  id: string;
  bookingId: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
}
