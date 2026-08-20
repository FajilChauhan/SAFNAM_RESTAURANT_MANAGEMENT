import api from "./axios";

export const orderApi = {
  getCart: (bookingId: string) => api.get(`/api/orders/cart/${bookingId}`),
  addToCart: (data: {
    bookingId: string;
    menuItemId: string;
    quantity: number;
    variantId?: string;
    addOnIds?: string[];
    specialNotes?: string;
  }) => api.post("/api/orders/cart/items", data),
  updateCartItem: (itemId: string, quantity: number) => api.patch(`/api/orders/cart/items/${itemId}/quantity`, { quantity }),
  updateCartNotes: (itemId: string, notes: string) => api.patch(`/api/orders/cart/items/${itemId}/notes`, { notes }),
  removeFromCart: (itemId: string) => api.delete(`/api/orders/cart/items/${itemId}`),
  clearCart: (bookingId: string) => api.delete(`/api/orders/cart/${bookingId}`),
  confirmOrder: (bookingId: string, source: "CUSTOMER_APP" | "MANAGER" | "RECEPTION" = "CUSTOMER_APP") =>
    api.post("/api/orders/confirm", { bookingId, source }),
  getMyOrders: () => api.get("/api/orders"),
  getAllOrders: (params?: { status?: string }) => api.get("/api/orders", { params }),
  getOrderById: (id: string) => api.get(`/api/orders/${id}`),
  updateOrderStatus: (id: string, status: string) => api.patch(`/api/orders/${id}/status`, { status }),
  getKitchenQueue: () => api.get("/api/orders/kitchen-queue"),
};
