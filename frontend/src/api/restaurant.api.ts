import { api } from "./axios";
export const restaurantApi = {
  get: (id: string) => api.get(`/api/restaurant/${id}`),
  create: (data: unknown) => api.post("/api/restaurant", data),
  update: (id: string, data: unknown) => api.patch(`/api/restaurant/${id}`, data),
};
