import api from "./axios";

export const biApi = {
  dashboard: () => api.get("/api/bi/dashboard"),
  revenue: () => api.get("/api/bi/revenue"),
  bookings: () => api.get("/api/bi/bookings"),
  orders: () => api.get("/api/bi/orders"),
  customers: () => api.get("/api/bi/customers"),
  tables: () => api.get("/api/bi/tables"),
  rooms: () => api.get("/api/bi/rooms"),
  employees: () => api.get("/api/bi/employees"),
  charts: () => api.get("/api/bi/charts"),
  report: (type: string, params?: Record<string, string | number | boolean>) =>
    api.get(`/api/bi/reports/${type}`, { params }),
};
