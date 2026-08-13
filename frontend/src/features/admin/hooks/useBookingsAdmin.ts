import { useQuery } from "@tanstack/react-query";
import { bookingApi } from "@/api/booking.api";

export function useBookingsAdmin() {
  return useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: async () => {
      const { data } = await bookingApi.getAllBookings();
      return data.data.bookings as Array<{
        id: string;
        bookingNumber?: string;
        customer?: { fullName?: string; name?: string; phone?: string; email?: string };
        bookingType?: string;
        table?: { tableNumber: string; capacity?: number; floor?: { name?: string } };
        room?: { roomNumber: string; roomType?: string };
        date?: string;
        bookingDate?: string;
        startTime?: string;
        timeSlot?: string;
        guests?: number;
        members?: number;
        endTime?: string;
        paymentStatus?: string;
        status: string;
      }>;
    },
  });
}
