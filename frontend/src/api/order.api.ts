import api from "./axios";
export const orderApi = {
  cart: (bookingId: string) => api.get(`/api/orders/cart/${bookingId}`),
  confirm: (data: unknown) => api.post("/api/orders/confirm", data),
  list: () => api.get("/api/orders"),
  details: (id: string) => api.get(`/api/orders/${id}`),
  status: (id: string, data: unknown) => api.patch(`/api/orders/${id}/status`, data),
  kitchenQueue: () => api.get("/api/orders/kitchen-queue"),
};
