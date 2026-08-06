import { useQuery } from "@tanstack/react-query";
import { operationsApi } from "@/api/operations.api";

export function useCustomersAdmin(search: string = "") {
  return useQuery({
    queryKey: ["admin", "customers", search],
    queryFn: async () => {
      const { data } = await operationsApi.searchCustomers(search);
      return data.data as Array<{
        id: string;
        name: string;
        email?: string;
        phone?: string;
        visits?: number;
        totalSpent?: number;
        lastVisit?: string;
      }>;
    },
  });
}
