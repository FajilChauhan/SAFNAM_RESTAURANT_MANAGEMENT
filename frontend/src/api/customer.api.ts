import { api } from "./axios";
export const customerApi = {
  home: () => api.get("/api/customer/home"),
  menu: () => api.get("/api/customer/menu"),
  restaurant: () => api.get("/api/customer/restaurant"),
  bookings: {
    list: () => api.get("/api/customer/bookings/history"),
    current: () => api.get("/api/customer/bookings/current"),
  },
  cart: (bookingId: string) => api.get(`/api/customer/bookings/${bookingId}/cart`),
  orders: {
    list: () => api.get("/api/customer/orders/history"),
    track: (id: string) => api.get(`/api/customer/orders/${id}/tracking`),
  },
  invoices: () => api.get("/api/customer/invoices/history"),
  payments: () => api.get("/api/customer/payments/history"),
  profile: () => api.get("/api/customer/profile"),
  offers: () => api.get("/api/customer/offers"),
  notifications: () => api.get("/api/customer/notifications"),
  feedback: (bookingId: string, data: unknown) => api.post(`/api/customer/bookings/${bookingId}/feedback`, data),
};
