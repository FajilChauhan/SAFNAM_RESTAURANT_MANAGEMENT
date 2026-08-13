import api from "./axios";

export const bookingApi = {
  getAvailability: (params: { date: string; startTime: string; endTime?: string; durationMinutes?: number; members: number; floorId?: string }) =>
    api.get("/api/bookings/available-tables", { params }),
  getAvailableRooms: (params: { date: string; startTime: string; endTime?: string; durationMinutes?: number; members: number }) =>
    api.get("/api/bookings/available-rooms", { params }),
  createBooking: (data: {
    customerId?: string;
    bookingType: "TABLE" | "ROOM";
    tableId?: string;
    roomId?: string;
    date: string;
    startTime: string;
    endTime?: string;
    durationMinutes?: number;
    members: number;
    notes?: string;
    source: "CUSTOMER_APP" | "RECEPTION" | "ADMIN";
  }) =>
    api.post("/api/bookings", data),
  getMyBookings: () => api.get("/api/bookings"),
  getAllBookings: (params?: { date?: string; status?: string; type?: string }) => api.get("/api/bookings", { params }),
  getBookingById: (id: string) => api.get(`/api/bookings/${id}`),
  updateBooking: (id: string, data: unknown) => api.patch(`/api/bookings/${id}`, data),
  cancelBooking: (id: string) => api.patch(`/api/bookings/${id}/cancel`),
  checkIn: (id: string) => api.patch(`/api/bookings/${id}/check-in`),
  checkOut: (id: string) => api.patch(`/api/bookings/${id}/check-out`),
};
