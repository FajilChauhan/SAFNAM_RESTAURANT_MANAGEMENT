import api from "./axios";

export const operationsApi = {
  getDashboard: () => api.get("/api/operations/dashboard/summary"),
  getRevenue: (period?: string) => api.get("/api/operations/revenue/today", { params: { period } }),
  getOrders: (params?: { period?: string }) => api.get("/api/operations/orders/today", { params }),

  getEmployees: () => api.get("/api/bi/employees"),
  createEmployee: (data: { name: string; email: string; phone: string; role: string; password: string }) =>
    api.post("/api/operations/employees", data),
  updateEmployee: (id: string, data: unknown) => api.put(`/api/operations/employees/${id}`, data),
  deleteEmployee: (id: string) => api.delete(`/api/operations/employees/${id}`),

  getCustomers: () => api.get("/api/bi/customers"),
  getCustomerById: (id: string) => api.get(`/api/operations/customers/${id}`),

  getOffers: () => api.get("/api/operations/offers"),
  createOffer: (data: unknown) => api.post("/api/operations/offers", data),
  updateOffer: (id: string, data: unknown) => api.put(`/api/operations/offers/${id}`, data),
  deleteOffer: (id: string) => api.delete(`/api/operations/offers/${id}`),

  getLeaderboard: () => api.get("/api/operations/leaderboard"),

  getRevenueReport: (params?: { period?: string; from?: string; to?: string }) =>
    api.get("/api/bi/reports/revenue", { params }),
  getOrdersReport: (params?: { period?: string }) => api.get("/api/bi/reports/orders", { params }),
  getCustomersReport: (params?: { period?: string }) => api.get("/api/bi/reports/customers", { params }),

  getReceptionDashboard: () => api.get("/api/operations/reception/dashboard"),
  getKitchenDashboard: () => api.get("/api/operations/kitchen/dashboard"),
  getManagerDashboard: () => api.get("/api/operations/manager/dashboard"),
  getAdminDashboard: () => api.get("/api/operations/admin/dashboard"),
  getTodayBookings: () => api.get("/api/operations/bookings/today"),
  getTodayOccupancy: () => api.get("/api/operations/occupancy/today"),
  getPendingBills: () => api.get("/api/operations/bills/pending"),
  getKitchenQueueCount: () => api.get("/api/operations/kitchen/queue-count"),
  searchCustomers: (search: string) => api.get("/api/operations/customers/search", { params: { search } }),
};

