import { useQuery } from "@tanstack/react-query";
import { biApi } from "@/api/bi.api";

export function useReports() {
  return {
    revenue: useQuery({
      queryKey: ["admin", "report", "revenue"],
      queryFn: async () => (await biApi.report("revenue")).data.data,
    }),
    orders: useQuery({
      queryKey: ["admin", "report", "orders"],
      queryFn: async () => (await biApi.report("orders")).data.data,
    }),
    customers: useQuery({
      queryKey: ["admin", "report", "customers"],
      queryFn: async () => (await biApi.report("customers")).data.data,
    }),
  };
}

