import api from "./axios";
export const bookingApi = {
  list: () => api.get("/api/bookings"),
  get: (id: string) => api.get(`/api/bookings/${id}`),
  create: (data: unknown) => api.post("/api/bookings", data),
  update: (id: string, data: unknown) => api.patch(`/api/bookings/${id}`, data),
  cancel: (id: string) => api.patch(`/api/bookings/${id}/cancel`),
  checkIn: (id: string) => api.patch(`/api/bookings/${id}/check-in`),
  checkOut: (id: string) => api.patch(`/api/bookings/${id}/check-out`),
  availability: () => api.get("/api/bookings/availability"),
};
