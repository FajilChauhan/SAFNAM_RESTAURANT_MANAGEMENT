import { useQuery } from "@tanstack/react-query";
import { roomApi } from "@/api/room.api";

export function useRooms() {
  return useQuery({
    queryKey: ["admin", "rooms"],
    queryFn: async () => {
      const { data } = await roomApi.getRooms();
      return data.data as Array<{
        id: string;
        roomNumber: string;
        roomType: string;
        capacity: number;
        pricePerDay: number;
        status: string;
        image?: string;
      }>;
    },
  });
}
