import api from "./axios";

export const operationsApi = {
  dashboardSummary: () => api.get("/api/operations/dashboard/summary"),
  receptionDashboard: () => api.get("/api/operations/reception/dashboard"),
  kitchenDashboard: () => api.get("/api/operations/kitchen/dashboard"),
  managerDashboard: () => api.get("/api/operations/manager/dashboard"),
  adminDashboard: () => api.get("/api/operations/admin/dashboard"),
  todayOrders: () => api.get("/api/operations/orders/today"),
  todayRevenue: () => api.get("/api/operations/revenue/today"),
  todayBookings: () => api.get("/api/operations/bookings/today"),
  todayOccupancy: () => api.get("/api/operations/occupancy/today"),
  pendingBills: () => api.get("/api/operations/bills/pending"),
  kitchenQueueCount: () => api.get("/api/operations/kitchen/queue-count"),
  customerSearch: (search: string) => api.get("/api/operations/customers/search", { params: { search } }),
  getOffers: () => api.get("/api/operations/offers"),
  getLeaderboard: () => api.get("/api/operations/leaderboard"),
};
