import { PageHeader, StatusChip } from "@/components/ui";
import { useBookingsAdmin } from "../hooks/useBookingsAdmin";

export default function BookingsPage() {
  const { data } = useBookingsAdmin();
  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" subtitle="Review and manage table and room bookings" />
      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-2">Customer</th>
              <th>Type</th>
              <th>Table/Room</th>
              <th>Date</th>
              <th>Guests</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((booking) => (
              <tr key={booking.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-3">{booking.customer?.name ?? "-"}</td>
                <td>{booking.bookingType ?? "-"}</td>
                <td>{booking.table?.tableNumber ?? booking.room?.roomNumber ?? "-"}</td>
                <td>{booking.date}</td>
                <td>{booking.guests ?? "-"}</td>
                <td><StatusChip status={booking.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

