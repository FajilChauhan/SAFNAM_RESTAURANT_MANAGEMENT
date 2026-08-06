import api from "./axios";

export const restaurantApi = {
  getInfo: () => api.get("/api/restaurant"),
  updateInfo: (id: string, data: unknown) => api.patch(`/api/restaurant/${id}`, data),
};

