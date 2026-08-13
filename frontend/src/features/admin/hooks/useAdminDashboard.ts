import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard.api";

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await dashboardApi.getAdminDashboard();
      return res.data.data.dashboard;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
};
