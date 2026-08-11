import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/admin.api";

export function useCustomersAdmin(search: string = "") {
  return useQuery({
    queryKey: ["admin", "customers", search],
    queryFn: async () => {
      const { data } = await adminApi.customers.list({ search, limit: 100 });
      return data.data.customers;
    },
  });
}
