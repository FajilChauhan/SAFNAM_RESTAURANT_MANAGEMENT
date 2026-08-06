import { useQuery } from "@tanstack/react-query";
import { tableApi } from "@/api/table.api";
import { floorApi } from "@/api/floor.api";

export function useTables() {
  return useQuery({
    queryKey: ["admin", "tables"],
    queryFn: async () => {
      const { data } = await tableApi.getTables();
      return data.data as Array<{
        id: string;
        tableNumber: string;
        capacity: number;
        status: string;
        floor?: { id: string; name: string };
      }>;
    },
  });
}

export function useFloors() {
  return useQuery({
    queryKey: ["admin", "floors"],
    queryFn: async () => {
      const { data } = await floorApi.getFloors();
      return data.data as Array<{ id: string; name: string; level: number; tableCount?: number }>;
    },
  });
}
