import { PageHeader, StatusChip } from "@/components/ui";
import { useBookingsAdmin } from "../hooks/useBookingsAdmin";
import { Button, EmptyState } from "@/components/ui";
import { bookingApi } from "@/api/booking.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/formatters";

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const { data, isError, error, refetch, isLoading } = useBookingsAdmin();
  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "cancel" | "check-in" | "check-out" }) => {
      if (action === "cancel") return bookingApi.cancelBooking(id);
      if (action === "check-in") return bookingApi.checkIn(id);
      return bookingApi.checkOut(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] }),
  });

  const rows = data ?? [];
  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" subtitle="Review and manage table and room bookings" />
      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {isError ? (
          <EmptyState title="Unable to load bookings" description={getErrorMessage(error)} action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>} />
        ) : !rows.length && !isLoading ? (
          <EmptyState title="No bookings found" description="Table and room bookings will appear here once customers reserve or staff create bookings." />
        ) : <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-2">Customer</th>
              <th>Type</th>
              <th>Table/Room</th>
              <th>Date</th>
              <th>Guests</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((booking) => (
              <tr key={booking.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-3">{booking.customer?.fullName ?? booking.customer?.name ?? "-"}</td>
                <td>{booking.bookingType ?? "-"}</td>
                <td>{booking.table?.tableNumber ?? booking.room?.roomNumber ?? "-"}</td>
                <td>{booking.bookingDate ?? booking.date ?? "-"} {booking.startTime ?? booking.timeSlot ?? ""}</td>
                <td>{booking.members ?? booking.guests ?? "-"}</td>
                <td><StatusChip status={booking.status} /></td>
                <td>
                  <div className="flex justify-end gap-2">
                    {["PENDING", "CONFIRMED"].includes(booking.status) ? <Button size="sm" variant="ghost" onClick={() => actionMutation.mutate({ id: booking.id, action: "check-in" })}>Check In</Button> : null}
                    {booking.status === "CHECKED_IN" ? <Button size="sm" variant="ghost" onClick={() => actionMutation.mutate({ id: booking.id, action: "check-out" })}>Checkout</Button> : null}
                    {!["CANCELLED", "COMPLETED"].includes(booking.status) ? <Button size="sm" variant="danger" onClick={() => window.confirm("Cancel this booking?") && actionMutation.mutate({ id: booking.id, action: "cancel" })}>Cancel</Button> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>
    </div>
  );
}
