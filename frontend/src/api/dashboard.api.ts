import api from "./axios";
import type {
  AdminDashboard,
  CustomerDashboard,
  KitchenDashboard,
  ManagerDashboard,
  ReceptionDashboard,
} from "@/types/dashboard.types";

type ApiEnvelope<T> = {
  success: true;
  message: string;
  data: {
    dashboard: T;
  };
};

export const dashboardApi = {
  getCustomerDashboard: () => api.get<ApiEnvelope<CustomerDashboard>>("/dashboard/customer"),
  getReceptionDashboard: () => api.get<ApiEnvelope<ReceptionDashboard>>("/dashboard/reception"),
  getKitchenDashboard: () => api.get<ApiEnvelope<KitchenDashboard>>("/dashboard/kitchen"),
  getManagerDashboard: () => api.get<ApiEnvelope<ManagerDashboard>>("/dashboard/manager"),
  getAdminDashboard: () => api.get<ApiEnvelope<AdminDashboard>>("/dashboard/admin"),
};
