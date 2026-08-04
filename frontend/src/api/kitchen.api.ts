import { api } from "./axios";
export const kitchenApi = {
  queue: () => api.get("/api/kitchen/queue"),
  summary: () => api.get("/api/kitchen/summary"),
  priority: (id: string, data: unknown) => api.patch(`/api/kitchen/${id}/priority`, data),
  accept: (id: string) => api.patch(`/api/kitchen/orders/${id}/accept`),
  reject: (id: string) => api.patch(`/api/kitchen/orders/${id}/reject`),
  preparing: (id: string) => api.patch(`/api/kitchen/orders/${id}/preparing`),
  ready: (id: string) => api.patch(`/api/kitchen/orders/${id}/ready`),
  served: (id: string) => api.patch(`/api/kitchen/orders/${id}/served`),
};
