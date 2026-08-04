import { create } from "zustand";
import type { CartItem } from "@/types/order.types";

interface CartState {
  items: CartItem[];
  bookingId: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  setBookingId: (bookingId: string | null) => void;
  totalItems: () => number;
  totalAmount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  bookingId: null,
  addItem: (item) => set({ items: [...get().items.filter((cartItem) => cartItem.menuItemId !== item.menuItemId), item] }),
  removeItem: (menuItemId) => set({ items: get().items.filter((item) => item.menuItemId !== menuItemId) }),
  updateQuantity: (menuItemId, quantity) =>
    set({
      items: get().items.map((item) => (item.menuItemId === menuItemId ? { ...item, quantity, totalPrice: item.price * quantity } : item)),
    }),
  clearCart: () => set({ items: [] }),
  setBookingId: (bookingId) => set({ bookingId }),
  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  totalAmount: () => get().items.reduce((sum, item) => sum + item.totalPrice, 0),
}));
