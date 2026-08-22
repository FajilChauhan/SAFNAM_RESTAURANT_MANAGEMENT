import api from "./axios";

export const kitchenApi = {
  getDashboard: () => api.get("/api/kitchen/dashboard"),
  getQueue: () => api.get("/api/kitchen/queue"),
  getSummary: () => api.get("/api/kitchen/summary"),
  getPriorityOrders: () => api.get("/api/kitchen/queue", { params: { priority: true } }),
  acceptOrder: (orderId: string) => api.patch(`/api/kitchen/orders/${orderId}/accept`),
  rejectOrder: (orderId: string) => api.patch(`/api/kitchen/orders/${orderId}/reject`),
  startPreparing: (orderId: string) => api.patch(`/api/kitchen/orders/${orderId}/preparing`),
  markReady: (orderId: string) => api.patch(`/api/kitchen/orders/${orderId}/ready`),
  markServed: (orderId: string) => api.patch(`/api/kitchen/orders/${orderId}/served`),
};

