import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChefHat,
  Clock,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  UtensilsCrossed,
} from "lucide-react";
import { kitchenApi } from "@/api/kitchen.api";
import type { KitchenDashboard, KitchenOrder } from "@/types/dashboard.types";
import { DashboardError, DashboardSkeleton, StatusPill } from "@/features/dashboard/DashboardShared";
import { PageHeader, StatsGrid } from "@/components/ui";
import { cn } from "@/utils/cn";
import { toast } from "@/utils/toast";
import { getErrorMessage } from "@/utils/formatters";

type KitchenAction = "ACCEPT" | "PREPARING" | "READY" | "SERVED" | "CANCEL";
type StatusFilter = "ALL" | "PENDING" | "ACCEPTED" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";
type ViewMode = "KANBAN" | "LIST";

const statusTabs: Array<{ id: StatusFilter; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "ACCEPTED", label: "Accepted" },
  { id: "PREPARING", label: "Preparing" },
  { id: "READY", label: "Ready" },
  { id: "SERVED", label: "Served" },
  { id: "CANCELLED", label: "Cancelled" },
];

const kanbanColumns: Array<{ id: StatusFilter; label: string; tone: string }> = [
  { id: "PENDING", label: "Pending", tone: "amber" },
  { id: "ACCEPTED", label: "Accepted", tone: "slate" },
  { id: "PREPARING", label: "Preparing", tone: "blue" },
  { id: "READY", label: "Ready", tone: "emerald" },
];

export default function KitchenDashboardPage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const isOrdersPage = location.pathname.endsWith("/orders");
  const isHistoryPage = location.pathname.endsWith("/history");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(isOrdersPage || isHistoryPage ? "ALL" : "PENDING");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(isHistoryPage ? "LIST" : "KANBAN");
  const [timeTrigger, setTimeTrigger] = useState(0);

  useEffect(() => {
    if (isHistoryPage) {
      setStatusFilter("ALL");
      setViewMode("LIST");
    } else if (isOrdersPage) {
      setStatusFilter("ALL");
      setViewMode("KANBAN");
    }
  }, [isHistoryPage, isOrdersPage]);

  useEffect(() => {
    const timer = window.setInterval(() => setTimeTrigger((value) => value + 1), 10_000);
    return () => window.clearInterval(timer);
  }, []);

  const query = useQuery({
    queryKey: ["kitchen-dashboard"],
    queryFn: async () => (await kitchenApi.getDashboard()).data.data.dashboard as KitchenDashboard,
    refetchInterval: 5000,
  });

  const dashboard = query.data;
  const allOrders = useMemo(() => collectOrders(dashboard), [dashboard]);
  const pageOrders = isHistoryPage ? dashboard?.kitchenHistory ?? [] : allOrders;
  const statusCounts = useMemo(() => countByStatus(pageOrders), [pageOrders]);
  const filteredOrders = useMemo(() => {
    const queryText = search.trim().toLowerCase();
    return pageOrders.filter((order) => {
      const status = normalizeKitchenStatus(order);
      if (statusFilter !== "ALL" && status !== statusFilter) return false;
      if (!queryText) return true;

      return [
        order.orderNumber,
        order.customerName,
        order.tableNumber,
        order.roomNumber,
        order.bookingNumber,
        getLocationLabel(order),
      ].some((value) => String(value ?? "").toLowerCase().includes(queryText));
    });
  }, [pageOrders, search, statusFilter]);

  const historyOrders = useMemo(
    () => allOrders.filter((order) => ["SERVED", "CANCELLED"].includes(normalizeKitchenStatus(order))),
    [allOrders],
  );
  const activeOrders = useMemo(
    () => allOrders.filter((order) => !["SERVED", "CANCELLED"].includes(normalizeKitchenStatus(order))),
    [allOrders],
  );

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, action }: { orderId: string; action: KitchenAction }) => {
      if (action === "ACCEPT") return kitchenApi.acceptOrder(orderId);
      if (action === "PREPARING") return kitchenApi.startPreparing(orderId);
      if (action === "READY") return kitchenApi.markReady(orderId);
      if (action === "CANCEL") return kitchenApi.rejectOrder(orderId);
      return kitchenApi.markServed(orderId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["kitchen-dashboard"] });
      toast.success("Kitchen order updated.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (query.isLoading) return <DashboardSkeleton columns={4} />;
  if (query.isError || !dashboard) return <DashboardError onRetry={() => void query.refetch()} />;

  const lastUpdated = dashboard.generatedAt ? new Date(dashboard.generatedAt).toLocaleTimeString("en-IN") : "-";
  const visibleOrders = isHistoryPage ? filteredOrders : isOrdersPage ? filteredOrders : activeOrders.slice(0, 8);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={isHistoryPage ? "Kitchen Order History" : isOrdersPage ? "Kitchen Orders" : "Kitchen Dashboard"}
        subtitle={isHistoryPage ? "Review recently served and cancelled kitchen orders" : isOrdersPage ? "Manage and track food preparation in real time" : "Live SAFNAM kitchen performance and active queue"}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="hidden items-center gap-2 text-xs font-medium text-gray-500 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Live updates
            </div>
            <span className="text-xs text-gray-400">Last updated: {lastUpdated}</span>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <RefreshCw size={16} className={cn(query.isFetching && "animate-spin")} />
              Refresh
            </button>
          </div>
        }
      />

      <StatsGrid
        cols={4}
        stats={[
          { label: "Pending Orders", value: dashboard.stats.pendingOrders, color: "bg-amber-50 border-amber-100", textColor: "text-amber-700", icon: <ChefHat size={18} /> },
          { label: "Preparing Orders", value: dashboard.stats.preparingOrders, color: "bg-blue-50 border-blue-100", textColor: "text-blue-700", icon: <Clock size={18} /> },
          { label: "Ready Orders", value: dashboard.stats.readyOrders, color: "bg-emerald-50 border-emerald-100", textColor: "text-emerald-700", icon: <UtensilsCrossed size={18} /> },
          { label: "Served Today", value: dashboard.stats.servedOrders, color: "bg-gray-50 border-gray-200", textColor: "text-gray-700", icon: <List size={18} /> },
        ]}
      />

      <StatsGrid
        cols={4}
        stats={[
          { label: "Today's Orders", value: dashboard.stats.todayOrders, color: "bg-white border-gray-100", textColor: "text-gray-900" },
          { label: "Average Preparation", value: `${Math.round(dashboard.stats.avgPreparationTime)}m`, color: "bg-white border-gray-100", textColor: "text-gray-900" },
          { label: "Priority Orders", value: dashboard.stats.priorityOrders, color: "bg-red-50 border-red-100", textColor: "text-red-700" },
          { label: "Active Queue", value: activeOrders.length, color: "bg-white border-gray-100", textColor: "text-gray-900" },
        ]}
      />

      <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isHistoryPage ? "Completed Orders" : isOrdersPage ? "Orders Workspace" : "Active Queue"}</h2>
            <p className="text-sm text-gray-500">
              {isHistoryPage ? "Served and cancelled orders from the kitchen history." : isOrdersPage ? "Filter active and completed kitchen orders from real backend data." : "Newest checked-in food orders appear here automatically."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order, customer, room..."
                className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 sm:w-72"
              />
            </div>
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode("KANBAN")}
                className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition", viewMode === "KANBAN" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500")}
              >
                <LayoutGrid size={14} />
                Kanban
              </button>
              <button
                type="button"
                onClick={() => setViewMode("LIST")}
                className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition", viewMode === "LIST" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500")}
              >
                <List size={14} />
                List
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-gray-100 px-4 py-3">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition",
                statusFilter === tab.id ? "bg-emerald-600 text-white shadow-sm" : "bg-gray-50 text-gray-600 hover:bg-gray-100",
              )}
            >
              {tab.label} {tab.id === "ALL" ? allOrders.length : statusCounts[tab.id] ?? 0}
            </button>
          ))}
        </div>

        <div className="p-4">
          {visibleOrders.length === 0 ? (
            <EmptyKitchenState />
          ) : viewMode === "KANBAN" && !isHistoryPage ? (
            <div className="grid gap-4 xl:grid-cols-4">
              {kanbanColumns.map((column) => {
                const columnOrders = visibleOrders.filter((order) => normalizeKitchenStatus(order) === column.id);
                return (
                  <div key={column.id} className="min-h-72 rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
                    <div className={cn("mb-3 flex items-center justify-between rounded-xl border px-3 py-2", columnTone(column.tone))}>
                      <span className="text-sm font-bold">{column.label}</span>
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold">{columnOrders.length}</span>
                    </div>
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {columnOrders.map((order) => (
                          <KitchenOrderCard
                            key={order.id}
                            order={order}
                            timeTrigger={timeTrigger}
                            onAction={(action) => updateStatusMutation.mutate({ orderId: getOrderId(order), action })}
                            isUpdating={updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === getOrderId(order)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-gray-400">
                    <th className="px-3 py-3">Order</th>
                    <th className="px-3 py-3">Location</th>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-3 py-3">Items</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Elapsed</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {visibleOrders.map((order) => (
                    <KitchenOrderRow
                      key={order.id}
                      order={order}
                      timeTrigger={timeTrigger}
                      onAction={(action) => updateStatusMutation.mutate({ orderId: getOrderId(order), action })}
                      isUpdating={updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === getOrderId(order)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {!isOrdersPage && (
        <section className="grid gap-4 lg:grid-cols-2">
          <CompactPanel title="Order History" description="Recently completed or cancelled kitchen orders">
            {historyOrders.length === 0 ? (
              <p className="text-sm text-gray-400">No completed kitchen orders yet.</p>
            ) : (
              historyOrders.slice(0, 6).map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{getLocationLabel(order)} · {order.customerName ?? "Guest"}</p>
                  </div>
                  <StatusPill status={normalizeKitchenStatus(order)} />
                </div>
              ))
            )}
          </CompactPanel>

          <CompactPanel title="Performance" description="Calculated from backend kitchen dashboard aggregation">
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Completed" value={historyOrders.length} />
              <Metric label="Most Active Hour" value={dashboard.kitchenStatistics.byHour?.[0]?.label ?? "-"} />
              <Metric label="Category Avg" value={dashboard.kitchenStatistics.avgTimeByCategory?.[0]?.label ?? "-"} />
              <Metric label="Priority Active" value={dashboard.stats.priorityOrders} />
            </div>
          </CompactPanel>
        </section>
      )}
    </div>
  );
}

function collectOrders(dashboard?: KitchenDashboard): KitchenOrder[] {
  if (!dashboard) return [];
  const byId = new Map<string, KitchenOrder>();
  [
    ...dashboard.pendingOrders,
    ...dashboard.acceptedOrders,
    ...dashboard.preparingOrders,
    ...dashboard.readyOrders,
    ...dashboard.servedOrders,
    ...dashboard.kitchenQueue,
    ...dashboard.priorityOrders,
    ...dashboard.recentlyServed,
  ].forEach((order) => {
    byId.set(getOrderId(order), order);
  });

  return Array.from(byId.values()).sort((a, b) => {
    const priorityDiff = priorityRank(b.priority) - priorityRank(a.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.queuedAt ?? a.confirmedAt ?? 0).getTime() - new Date(b.queuedAt ?? b.confirmedAt ?? 0).getTime();
  });
}

function countByStatus(orders: KitchenOrder[]) {
  return orders.reduce<Record<string, number>>((acc, order) => {
    const status = normalizeKitchenStatus(order);
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
}

function getOrderId(order: KitchenOrder) {
  return order.orderId ?? order.id;
}

function normalizeKitchenStatus(order: KitchenOrder) {
  return (order.status ?? order.kitchenStatus ?? "PENDING").toUpperCase();
}

function nextAction(status: string): { label: string; action: KitchenAction } | null {
  if (status === "PENDING") return { label: "Accept Order", action: "ACCEPT" };
  if (status === "ACCEPTED") return { label: "Start Preparing", action: "PREPARING" };
  if (status === "PREPARING") return { label: "Mark Ready", action: "READY" };
  if (status === "READY") return { label: "Mark Served", action: "SERVED" };
  return null;
}

function canCancel(status: string) {
  return !["SERVED", "CANCELLED"].includes(status);
}

function confirmCancelOrder() {
  return window.confirm("Cancel this kitchen order? Cancelled food items will be removed from billing if the invoice is still editable.");
}

function getLocationLabel(order: KitchenOrder) {
  if (order.roomNumber) return `Room ${order.roomNumber}`;
  if (order.tableNumber) return `Table ${order.tableNumber}`;
  return "Walk-in";
}

function getElapsedTime(order: KitchenOrder, _trigger: number) {
  const timestamp = order.startedAt ?? order.acceptedAt ?? order.queuedAt ?? order.confirmedAt;
  if (!timestamp) return "-";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function priorityRank(priority?: string) {
  if (priority === "VIP") return 3;
  if (priority === "HIGH") return 2;
  if (priority === "NORMAL") return 1;
  return 0;
}

function KitchenOrderCard({
  order,
  timeTrigger,
  onAction,
  isUpdating,
}: {
  order: KitchenOrder;
  timeTrigger: number;
  onAction: (action: KitchenAction) => void;
  isUpdating: boolean;
}) {
  const status = normalizeKitchenStatus(order);
  const action = nextAction(status);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <OrderHeader order={order} timeTrigger={timeTrigger} />
      <OrderItems order={order} />
      {action && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onAction(action.action)}
            className="rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUpdating ? "Updating..." : action.label}
          </button>
          {canCancel(status) && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => {
                if (confirmCancelOrder()) onAction("CANCEL");
              }}
              className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel Order
            </button>
          )}
        </div>
      )}
      {!action && canCancel(status) && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => {
            if (confirmCancelOrder()) onAction("CANCEL");
          }}
          className="mt-4 w-full rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel Order
        </button>
      )}
    </motion.article>
  );
}

function KitchenOrderRow({
  order,
  timeTrigger,
  onAction,
  isUpdating,
}: {
  order: KitchenOrder;
  timeTrigger: number;
  onAction: (action: KitchenAction) => void;
  isUpdating: boolean;
}) {
  const status = normalizeKitchenStatus(order);
  const action = nextAction(status);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-3 font-bold text-gray-900">{order.orderNumber ?? getOrderId(order)}</td>
      <td className="px-3 py-3 text-gray-700">{getLocationLabel(order)}</td>
      <td className="px-3 py-3 text-gray-700">{order.customerName ?? "Guest"}</td>
      <td className="px-3 py-3 text-gray-600">{order.items?.map((item) => `${item.quantity}x ${item.name}`).join(", ") || "-"}</td>
      <td className="px-3 py-3"><StatusPill status={status} /></td>
      <td className="px-3 py-3 text-gray-600">{getElapsedTime(order, timeTrigger)}</td>
      <td className="px-3 py-3 text-right">
        <div className="flex justify-end gap-2">
          {action && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onAction(action.action)}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {isUpdating ? "Updating..." : action.label}
            </button>
          )}
          {canCancel(status) && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => {
                if (confirmCancelOrder()) onAction("CANCEL");
              }}
              className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
            >
              Cancel
            </button>
          )}
          {!action && !canCancel(status) && <span className="text-xs font-semibold text-gray-400">No action</span>}
        </div>
      </td>
    </tr>
  );
}

function OrderHeader({ order, timeTrigger }: { order: KitchenOrder; timeTrigger: number }) {
  const status = normalizeKitchenStatus(order);
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-base font-bold text-gray-900">{order.orderNumber ?? getOrderId(order)}</p>
          <StatusPill status={status} />
          {order.priority && order.priority !== "NORMAL" && (
            <span className="rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
              {order.priority === "VIP" ? "VIP Priority" : "High Priority"}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm font-semibold text-emerald-700">{getLocationLabel(order)}</p>
        <p className="text-xs text-gray-500">{order.customerName ?? "Guest"}</p>
      </div>
      <span className="shrink-0 rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-600">
        {getElapsedTime(order, timeTrigger)}
      </span>
    </div>
  );
}

function OrderItems({ order }: { order: KitchenOrder }) {
  if (!order.items?.length) {
    return <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-400">No item details available.</p>;
  }

  return (
    <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
      {order.items.map((item, idx) => (
        <div key={`${item.name}-${idx}`} className="flex items-start justify-between gap-3 text-sm">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">
              {item.quantity}x {item.name}
              {item.variant && <span className="ml-1 text-xs font-medium text-gray-500">({item.variant})</span>}
            </p>
            {item.notes && <p className="mt-1 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-700">Note: {item.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyKitchenState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
      <UtensilsCrossed className="h-10 w-10 text-gray-300" />
      <p className="mt-3 text-base font-bold text-gray-800">No active kitchen orders</p>
      <p className="mt-1 max-w-md text-sm text-gray-500">New food orders will appear here automatically as bookings send items to the kitchen.</p>
    </div>
  );
}

function CompactPanel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

function columnTone(tone: string) {
  if (tone === "amber") return "border-amber-100 bg-amber-50 text-amber-700";
  if (tone === "blue") return "border-blue-100 bg-blue-50 text-blue-700";
  if (tone === "emerald") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  return "border-gray-200 bg-white text-gray-700";
}
