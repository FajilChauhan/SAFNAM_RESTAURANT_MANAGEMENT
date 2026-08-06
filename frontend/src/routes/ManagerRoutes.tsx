import { useQuery } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { operationsApi } from "@/api/operations.api";
import ProtectedRoute from "./ProtectedRoute";
import { EmptyState, Skeleton } from "@/components/ui";

function ManagerDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: async () => (await operationsApi.getDashboard()).data.data,
    refetchInterval: 30000,
  });

  const stats = [
    { label: "Today's Revenue", value: `₹${data?.todayRevenue ?? 0}`, icon: "💰" },
    { label: "Today's Orders", value: data?.todayOrders ?? 0, icon: "🛍️" },
    { label: "Active Bookings", value: data?.activeBookings ?? 0, icon: "📅" },
    { label: "Tables Occupied", value: data?.tablesOccupied ?? 0, icon: "🪑" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Manager Dashboard</h1>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">Unable to load dashboard stats.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
              <div className="mb-2 text-3xl">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ManagerRoutes = () => (
  <ProtectedRoute allowedRoles={["MANAGER"]}>
    <Routes>
      <Route path="/" element={<ManagerDashboard />} />
      <Route path="/*" element={<ManagerDashboard />} />
    </Routes>
  </ProtectedRoute>
);

export default ManagerRoutes;

