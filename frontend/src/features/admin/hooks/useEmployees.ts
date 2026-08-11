import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/admin.api";

export function useEmployees() {
  return useQuery({
    queryKey: ["admin", "employees"],
    queryFn: async () => {
      const { data } = await adminApi.employees.list({ limit: 100 });
      return data.data.employees;
    },
  });
}
