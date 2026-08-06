import { useQuery } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { kitchenApi } from "@/api/kitchen.api";
import ProtectedRoute from "./ProtectedRoute";
import { StatusChip, EmptyState, Skeleton } from "@/components/ui";

function KitchenDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["kitchen-queue"],
    queryFn: async () => (await kitchenApi.getQueue()).data.data,
    refetchInterval: 10000,
  });

  const orders = Array.isArray(data) ? data : [];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Kitchen Queue</h1>
      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl bg-gray-800" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">Unable to load kitchen queue.</div>
      ) : !orders.length ? (
        <EmptyState
          title="No orders in queue"
          description="New confirmed orders will appear here automatically."
        />
      ) : (
        <div className="grid gap-4">
          {orders.map((order: { id: string; items?: Array<unknown>; status?: string }) => (
            <div key={order.id} className="rounded-2xl border border-gray-700 bg-gray-800 p-4">
              <p className="font-bold text-white">Order #{order.id.slice(-6).toUpperCase()}</p>
              <p className="text-sm text-gray-400">{order.items?.length ?? 0} items</p>
              {order.status ? <div className="mt-2"><StatusChip status={order.status} /></div> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const KitchenRoutes = () => (
  <ProtectedRoute allowedRoles={["KITCHEN"]}>
    <Routes>
      <Route path="/" element={<KitchenDashboard />} />
      <Route path="/*" element={<KitchenDashboard />} />
    </Routes>
  </ProtectedRoute>
);

export default KitchenRoutes;

