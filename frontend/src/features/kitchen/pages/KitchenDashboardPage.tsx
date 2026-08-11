import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChefHat } from "lucide-react";
import { dashboardApi } from "@/api/dashboard.api";
import type { KitchenDashboard, KitchenOrder } from "@/types/dashboard.types";
import { DashboardError, DashboardSkeleton, RefreshLine } from "@/features/dashboard/DashboardShared";
import { cn } from "@/utils/cn";

const columns: Array<{ key: keyof Pick<KitchenDashboard, "pendingOrders" | "preparingOrders" | "readyOrders" | "servedOrders">; label: string; tone: string }> = [
  { key: "pendingOrders", label: "PENDING", tone: "amber" },
  { key: "preparingOrders", label: "PREPARING", tone: "blue" },
  { key: "readyOrders", label: "READY", tone: "emerald" },
  { key: "servedOrders", label: "SERVED", tone: "gray" },
];

export default function KitchenDashboardPage() {
  const query = useQuery({
    queryKey: ["kitchen-dashboard"],
    queryFn: async () => (await dashboardApi.getKitchenDashboard()).data.data.dashboard,
    refetchInterval: 10000,
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
              <p className="text-sm text-gray-400"><span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />Live, refreshing every 10s</p>
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
            <section key={column.key}>
              <div className={cn("mb-3 rounded-xl border px-4 py-3", columnTone(column.tone))}>
                <span className="font-bold">{column.label}</span>
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">{orders.length}</span>
              </div>
              <AnimatePresence>
                {orders.map((order) => <OrderCard key={order.id} order={order} />)}
              </AnimatePresence>
            </section>
          );
        })}
      </main>

      <footer className="grid gap-4 border-t border-gray-800 bg-gray-900 p-4 md:grid-cols-4">
        <MiniStat label="Today's Orders" value={dashboard.stats.todayOrders} tone="text-orange-400" />
        <MiniStat label="Avg Time" value={`${Math.round(dashboard.stats.avgPreparationTime)}m`} tone="text-blue-400" />
        <MiniStat label="Priority" value={dashboard.stats.priorityOrders} tone="text-red-400" />
        <MiniStat label="Queue" value={dashboard.kitchenQueue.length} tone="text-emerald-400" />
      </footer>
    </div>
  );
}

function OrderCard({ order }: { order: KitchenOrder }) {
  return (
    <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-3 rounded-2xl border border-gray-700 bg-gray-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">{order.orderNumber ?? `Order ${order.id.slice(-6)}`}</p>
          <p className="mt-1 text-sm text-gray-400">{order.tableNumber ?? order.roomNumber ?? "Counter"} - {order.customerName ?? "Guest"}</p>
        </div>
        {order.priority && order.priority !== "NORMAL" ? <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs font-bold text-red-300">{order.priority}</span> : null}
      </div>
      <button type="button" className="mt-4 w-full rounded-xl bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-100 hover:bg-gray-600">
        {nextAction(order.status)}
      </button>
    </motion.article>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className="rounded-xl bg-gray-800 px-4 py-3">
      <p className={cn("text-2xl font-bold", tone)}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function columnTone(tone: string) {
  if (tone === "amber") return "border-amber-500/30 bg-amber-500/20 text-amber-300";
  if (tone === "blue") return "border-blue-500/30 bg-blue-500/20 text-blue-300";
  if (tone === "emerald") return "border-emerald-500/30 bg-emerald-500/20 text-emerald-300";
  return "border-gray-600 bg-gray-800 text-gray-300";
}

function nextAction(status?: string) {
  if (status === "PENDING") return "Accept";
  if (status === "PREPARING") return "Mark Ready";
  if (status === "READY") return "Mark Served";
  return "Completed";
}
