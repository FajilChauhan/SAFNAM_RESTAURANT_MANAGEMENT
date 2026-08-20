import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChefHat, RefreshCw } from "lucide-react";
import { dashboardApi } from "@/api/dashboard.api";
import { orderApi } from "@/api/order.api";
import type { KitchenDashboard, KitchenOrder } from "@/types/dashboard.types";
import { DashboardError, DashboardSkeleton, RefreshLine } from "@/features/dashboard/DashboardShared";
import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";

const columns: Array<{ key: keyof Pick<KitchenDashboard, "pendingOrders" | "preparingOrders" | "readyOrders" | "servedOrders">; label: string; tone: string }> = [
  { key: "pendingOrders", label: "PENDING", tone: "amber" },
  { key: "preparingOrders", label: "PREPARING", tone: "blue" },
  { key: "readyOrders", label: "READY", tone: "emerald" },
  { key: "servedOrders", label: "SERVED", tone: "gray" },
];

function getElapsedTime(timestamp: string) {
  if (!timestamp) return "";
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  return `${minutes}m`;
}

function getNextOrderStatus(queueStatus: string): string | null {
  if (queueStatus === "PENDING" || queueStatus === "ACCEPTED") return "PREPARING";
  if (queueStatus === "PREPARING") return "READY";
  if (queueStatus === "READY") return "SERVED";
  return null;
}

export default function KitchenDashboardPage() {
  const queryClient = useQueryClient();
  const [timeTrigger, setTimeTrigger] = useState(0);

  // Poll elapsed time display every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTrigger((prev) => prev + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const query = useQuery({
    queryKey: ["kitchen-dashboard"],
    queryFn: async () => (await dashboardApi.getKitchenDashboard()).data.data.dashboard,
    refetchInterval: 5000, // Real-time feel via 5s polling
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, nextStatus }: { orderId: string; nextStatus: string }) => {
      await orderApi.updateOrderStatus(orderId, nextStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-dashboard"] });
      void query.refetch();
    },
  });

  if (query.isLoading) return <DashboardSkeleton dark />;
  if (query.isError || !query.data) return <DashboardError onRetry={() => void query.refetch()} />;

  const dashboard: KitchenDashboard = query.data;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="h-7 w-7 text-orange-400" />
            <div>
              <h1 className="text-xl font-bold">Kitchen Queue</h1>
              <p className="text-sm text-gray-400">
                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Live operational board · 5s auto-refresh
              </p>
            </div>
          </div>
          <RefreshLine generatedAt={dashboard.generatedAt} isFetching={query.isFetching} onRefresh={() => void query.refetch()} dark />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat label="Pending" value={dashboard.stats.pendingOrders} tone="text-amber-400" />
          <MiniStat label="Preparing" value={dashboard.stats.preparingOrders} tone="text-blue-400" />
          <MiniStat label="Ready" value={dashboard.stats.readyOrders} tone="text-emerald-400" />
          <MiniStat label="Served" value={dashboard.stats.servedOrders} tone="text-gray-300" />
        </div>
      </header>

      <main className="grid gap-4 p-4 xl:grid-cols-4">
        {columns.map((column) => {
          const orders = dashboard[column.key] as KitchenOrder[];
          return (
            <section key={column.key} className="flex flex-col gap-2">
              <div className={cn("mb-1 rounded-xl border px-4 py-3", columnTone(column.tone))}>
                <span className="font-bold">{column.label}</span>
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">{orders.length}</span>
              </div>
              <AnimatePresence mode="popLayout">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAction={() => {
                      const nextStatus = getNextOrderStatus(order.status);
                      if (nextStatus && order.orderId) {
                        updateStatusMutation.mutate({ orderId: order.orderId, nextStatus });
                      }
                    }}
                    isPending={updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.orderId}
                  />
                ))}
              </AnimatePresence>
            </section>
          );
        })}
      </main>

      <footer className="grid gap-4 border-t border-gray-800 bg-gray-900 p-4 md:grid-cols-4">
        <MiniStat label="Today's Orders" value={dashboard.stats.todayOrders} tone="text-orange-400" />
        <MiniStat label="Avg Prep Time" value={`${Math.round(dashboard.stats.avgPreparationTime)}m`} tone="text-blue-400" />
        <MiniStat label="Priority Active" value={dashboard.stats.priorityOrders} tone="text-red-400" />
        <MiniStat label="Active Queue Size" value={dashboard.kitchenQueue.length} tone="text-emerald-400" />
      </footer>
    </div>
  );
}

function OrderCard({
  order,
  onAction,
  isPending,
}: {
  order: KitchenOrder;
  onAction: () => void;
  isPending: boolean;
}) {
  const elapsed = order.queuedAt ? getElapsedTime(order.queuedAt) : "";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="mb-3 rounded-2xl border border-gray-700 bg-gray-900 p-4 shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-white text-lg">
              {order.orderNumber ?? `Order ${order.id.slice(-6)}`}
            </span>
            {order.priority && order.priority !== "NORMAL" ? (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300 border border-red-500/30 uppercase tracking-wider">
                {order.priority}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm font-bold text-amber-400">
            {order.roomNumber ? `ROOM ${order.roomNumber}` : order.tableNumber ? `TABLE ${order.tableNumber}` : "Counter"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{order.customerName ?? "Guest"}</p>
        </div>
        {elapsed && (
          <span className="text-[11px] text-gray-300 font-semibold bg-gray-800 border border-gray-700 px-2 py-1 rounded-lg shrink-0">
            Wait: {elapsed}
          </span>
        )}
      </div>

      {/* Ordered items list */}
      {order.items && order.items.length > 0 && (
        <div className="mt-3 border-t border-gray-800 pt-3 space-y-1.5">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-white">
                  {item.name}
                  {item.variant ? <span className="text-xs text-gray-400 ml-1">({item.variant})</span> : null}
                </p>
                {item.notes ? (
                  <p className="text-[11px] text-amber-300 italic mt-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Note: {item.notes}
                  </p>
                ) : null}
              </div>
              <span className="font-bold text-emerald-400 shrink-0 ml-2">×{item.quantity}</span>
            </div>
          ))}
        </div>
      )}

      {getNextOrderStatus(order.status) && (
        <button
          type="button"
          onClick={onAction}
          disabled={isPending}
          className="mt-4 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? "Updating..." : nextAction(order.status)}
        </button>
      )}
    </motion.article>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className="rounded-xl bg-gray-800 px-4 py-3 shadow-md border border-gray-800">
      <p className={cn("text-2xl font-bold", tone)}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function columnTone(tone: string) {
  if (tone === "amber") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (tone === "blue") return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  if (tone === "emerald") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  return "border-gray-800 bg-gray-900 text-gray-400";
}

function nextAction(status?: string) {
  if (status === "PENDING" || status === "ACCEPTED") return "Start Preparing";
  if (status === "PREPARING") return "Mark Ready";
  if (status === "READY") return "Mark Served";
  return "Completed";
}
