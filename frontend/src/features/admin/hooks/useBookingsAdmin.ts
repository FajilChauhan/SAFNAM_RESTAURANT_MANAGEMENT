import { useQuery } from "@tanstack/react-query";
import { bookingApi, type Booking, type BookingListParams, type BookingType } from "@/api/booking.api";

/** Hook to fetch all bookings for the admin panel, with optional filters. */
export function useBookingsAdmin(params?: BookingListParams) {
  return useQuery({
    queryKey: ["admin", "bookings", params],
    queryFn: async () => {
      const { data } = await bookingApi.listBookings({ limit: 200, ...params });
      return data.data.bookings as Booking[];
    },
    staleTime: 30_000,
  });
}

/** Narrow helper: filter bookings by type client-side */
export function filterBookingsByType(bookings: Booking[], type: BookingType) {
  return bookings.filter((b) => b.bookingType === type);
}
