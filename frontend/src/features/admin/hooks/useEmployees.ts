import { useQuery } from "@tanstack/react-query";
import { biApi } from "@/api/bi.api";

export function useEmployees() {
  return useQuery({
    queryKey: ["admin", "employees"],
    queryFn: async () => {
      const { data } = await biApi.employees();
      return data.data as Array<{
        id: string;
        name: string;
        email: string;
        phone?: string;
        role: string;
        status?: string;
      }>;
    },
  });
}

