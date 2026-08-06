import { useQuery } from "@tanstack/react-query";
import { bookingApi } from "@/api/booking.api";

export function useBookingsAdmin() {
  return useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: async () => {
      const { data } = await bookingApi.getAllBookings();
      return data.data as Array<{
        id: string;
        bookingNumber?: string;
        customer?: { name: string; phone?: string; email?: string };
        bookingType?: string;
        table?: { tableNumber: string };
        room?: { roomNumber: string };
        date: string;
        timeSlot?: string;
        guests?: number;
        status: string;
      }>;
    },
  });
}
