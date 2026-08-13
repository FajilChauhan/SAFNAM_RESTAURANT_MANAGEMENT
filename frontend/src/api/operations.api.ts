import api from "./axios";

export const operationsApi = {
  getDashboard: () => api.get("/api/operations/dashboard/summary"),
  getRevenue: (period?: string) => api.get("/api/operations/revenue/today", { params: { period } }),
  getOrders: (params?: { period?: string }) => api.get("/api/operations/orders/today", { params }),

  getEmployees: () => api.get("/api/admin/employees"),
  createEmployee: (data: { fullName: string; email?: string; phoneNumber: string; role: string; password: string }) =>
    api.post("/api/admin/employees", data),
  updateEmployee: (id: string, data: unknown) => api.patch(`/api/admin/employees/${id}`, data),
  deleteEmployee: (id: string) => api.delete(`/api/admin/employees/${id}`),

  getCustomers: () => api.get("/api/admin/customers"),
  getCustomerById: (id: string) => api.get(`/api/admin/customers/${id}`),

  getOffers: () => api.get("/api/admin/offers"),
  createOffer: (data: unknown) => api.post("/api/admin/offers", data),
  updateOffer: (id: string, data: unknown) => api.patch(`/api/admin/offers/${id}`, data),
  deleteOffer: (id: string) => api.delete(`/api/admin/offers/${id}`),

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
