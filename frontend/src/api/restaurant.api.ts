import api from "./axios";

export const restaurantApi = {
  getInfo: () => api.get("/api/restaurant"),
  updateInfo: (data: unknown) => api.patch("/api/restaurant", data, data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined),
};
