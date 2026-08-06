import { useQuery } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { bookingApi } from "@/api/booking.api";
import ProtectedRoute from "./ProtectedRoute";
import { EmptyState, Skeleton, StatusChip } from "@/components/ui";

function ReceptionDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reception-bookings", today],
    queryFn: async () => (await bookingApi.getAllBookings({ date: today })).data.data,
    refetchInterval: 15000,
  });

  const bookings = Array.isArray(data) ? data : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Reception — Today's Bookings</h1>
      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-2xl" />)}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">Unable to load bookings.</div>
      ) : !bookings.length ? (
        <EmptyState title="No bookings for today" description="New reservations will appear here automatically." />
      ) : (
        <div className="grid gap-3">
          {bookings.map((booking: { id: string; customer?: { name?: string }; timeSlot?: string; guests?: number; status: string }) => (
            <div key={booking.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div>
                <p className="font-semibold text-gray-900">{booking.customer?.name ?? "Guest"}</p>
                <p className="text-sm text-gray-500">{booking.timeSlot ?? "-"} — {booking.guests ?? 0} guests</p>
              </div>
              <StatusChip status={booking.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ReceptionRoutes = () => (
  <ProtectedRoute allowedRoles={["RECEPTION"]}>
    <Routes>
      <Route path="/" element={<ReceptionDashboard />} />
      <Route path="/*" element={<ReceptionDashboard />} />
    </Routes>
  </ProtectedRoute>
);

export default ReceptionRoutes;

