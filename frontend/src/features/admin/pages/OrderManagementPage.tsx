import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RefreshCw,
  X,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Calendar,
  Utensils,
  Receipt,
  User,
  Clock,
  Compass,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { orderApi } from "@/api/order.api";
import { useAuthStore } from "@/store/authStore";
import { PageHeader, StatusChip, StatsGrid } from "@/components/ui";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { toast } from "@/utils/toast";
import { cn } from "@/utils/cn";

export default function OrderManagementPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuthStore();

  const isAdmin = user?.role === "ADMIN";
  const canUpdate = isAdmin || hasPermission("operations.orders.update");
  const canViewFinancial = isAdmin || hasPermission("operations.payments.view");

  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL, TABLE, ROOM
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Queries
  const { data: ordersData, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const res = await orderApi.getAllOrders();
      return res.data?.data?.orders ?? [];
    },
    refetchInterval: 5000, // 5s Auto-refresh for live status feel
  });

  const orders = useMemo(() => {
    return Array.isArray(ordersData) ? ordersData : [];
  }, [ordersData]);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await orderApi.updateOrderStatus(orderId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Order status updated successfully");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to update order status");
    },
  });

  // Calculate stats dynamically from fetched data
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED").length;
    const preparing = orders.filter((o) => o.status === "PREPARING").length;
    const ready = orders.filter((o) => o.status === "READY").length;
    const completed = orders.filter((o) => o.status === "SERVED").length;
    const cancelled = orders.filter((o) => o.status === "CANCELLED").length;

    return { total, pending, preparing, ready, completed, cancelled };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "PENDING" && order.status !== "PENDING" && order.status !== "CONFIRMED") return false;
        if (statusFilter !== "PENDING" && order.status !== statusFilter) return false;
      }

      // Order type filter
      const bType = order.booking?.bookingType;
      if (typeFilter !== "ALL" && bType !== typeFilter) return false;

      // Search (order number, customer name, table number, room number)
      if (search.trim()) {
        const query = search.toLowerCase();
        const orderNoMatch = order.orderNumber?.toLowerCase().includes(query);
        const customerNameMatch = order.booking?.customer?.fullName?.toLowerCase().includes(query);
        const roomMatch = order.booking?.room?.roomNumber?.toLowerCase().includes(query);
        const tableMatch = order.booking?.table?.tableNumber?.toLowerCase().includes(query);
        if (!orderNoMatch && !customerNameMatch && !roomMatch && !tableMatch) return false;
      }

      return true;
    });
  }, [orders, statusFilter, typeFilter, search]);

  const getOrderStatusTimeline = (currentStatus: string) => {
    const stages = ["CONFIRMED", "PREPARING", "READY", "SERVED"];
    const cancelledIdx = currentStatus === "CANCELLED" ? 4 : -1;
    return { stages, cancelledIdx };
  };

  const getNextStatus = (currentStatus: string) => {
    if (currentStatus === "PENDING" || currentStatus === "CONFIRMED") return "PREPARING";
    if (currentStatus === "PREPARING") return "READY";
    if (currentStatus === "READY") return "SERVED";
    return null;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Orders"
        subtitle="Manage food & room service orders in real-time"
        actions={
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-gray-300 bg-white text-gray-700 font-semibold text-sm rounded-xl transition-all hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw size={16} className={cn(isFetching && "animate-spin")} />
            Refresh
          </button>
        }
      />

      {/* Stats Cards */}
      <StatsGrid
        stats={[
          { label: "Active Orders", value: stats.pending + stats.preparing + stats.ready, color: "bg-amber-50 border-amber-100", textColor: "text-amber-700" },
          { label: "Preparing", value: stats.preparing, color: "bg-blue-50 border-blue-100", textColor: "text-blue-700" },
          { label: "Ready to Serve", value: stats.ready, color: "bg-emerald-50 border-emerald-100", textColor: "text-emerald-700" },
          { label: "Completed", value: stats.completed, color: "bg-gray-50 border-gray-200", textColor: "text-slate-700" },
        ]}
      />

      {/* Main Order Workspace Card */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {/* Tab Filters */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {[
            { id: "ALL", label: `All (${stats.total})` },
            { id: "PENDING", label: `Pending/New (${stats.pending})` },
            { id: "PREPARING", label: `Preparing (${stats.preparing})` },
            { id: "READY", label: `Ready (${stats.ready})` },
            { id: "SERVED", label: `Completed (${stats.completed})` },
            { id: "CANCELLED", label: `Cancelled (${stats.cancelled})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "whitespace-nowrap px-6 py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer",
                statusFilter === tab.id
                  ? "border-emerald-600 text-emerald-600 bg-emerald-50/10"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row gap-3 p-4 border-b border-gray-100 items-stretch md:items-center bg-gray-50/50">
          {/* Search box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order #, Customer, Room, Table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm"
            />
          </div>

          {/* Selector filters */}
          <div className="flex gap-2 flex-wrap items-center">
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              <SlidersHorizontal size={14} className="text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs font-semibold text-gray-700 bg-transparent border-0 focus:ring-0 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Order Types</option>
                <option value="TABLE">Table Orders</option>
                <option value="ROOM">Room Orders</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid and Table container */}
        {isLoading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <HelpCircle className="h-12 w-12 text-gray-300 mb-2" />
            <p className="text-base font-semibold text-gray-700">No orders found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria or tabs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="text-xs font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4">Order No.</th>
                  <th className="text-xs font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4">Customer</th>
                  <th className="text-xs font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4">Order Type</th>
                  <th className="text-xs font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4">Order For / Location</th>
                  <th className="text-xs font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4">Items</th>
                  <th className="text-xs font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 text-center">Total Items</th>
                  {canViewFinancial && (
                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 text-right">Grand Total</th>
                  )}
                  <th className="text-xs font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4">Status</th>
                  <th className="text-xs font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order) => {
                  const bType = order.booking?.bookingType;
                  const isRoom = bType === "ROOM";

                  // Location Formatter
                  let locationStr = "Counter / Walkin";
                  if (isRoom) {
                    locationStr = `Room ${order.booking?.room?.roomNumber ?? "—"}`;
                  } else if (order.booking?.table) {
                    const tNo = order.booking.table.tableNumber;
                    const floorName = order.booking.table.floor?.name;
                    locationStr = floorName ? `Table ${tNo} — ${floorName}` : `Table ${tNo}`;
                  }

                  // Items summary formatter
                  const totalQty = order.items?.reduce((sum: number, it: any) => sum + it.quantity, 0) ?? 0;
                  const itemsList = order.items ?? [];
                  let itemsSummary = "No items";
                  if (itemsList.length > 0) {
                    const firstItem = itemsList[0];
                    const firstLabel = `${firstItem.itemNameSnapshot} ×${firstItem.quantity}`;
                    if (itemsList.length > 1) {
                      itemsSummary = `${firstLabel} +${itemsList.length - 1} more`;
                    } else {
                      itemsSummary = firstLabel;
                    }
                  }

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-700">
                        {order.booking?.customer?.fullName ?? "Guest"}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold",
                            isRoom ? "bg-indigo-50 text-indigo-700" : "bg-teal-50 text-teal-700"
                          )}
                        >
                          {isRoom ? "ROOM ORDER" : "TABLE ORDER"}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800">
                        {locationStr}
                      </td>
                      <td className="py-4 px-4 text-slate-600 max-w-[200px] truncate" title={itemsList.map((i: any) => `${i.itemNameSnapshot} x${i.quantity}`).join(", ")}>
                        {itemsSummary}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-900">
                        {totalQty}
                      </td>
                      {canViewFinancial && (
                        <td className="py-4 px-4 text-right font-extrabold text-slate-900">
                          {formatCurrency(Number(order.totalSnapshot ?? 0))}
                        </td>
                      )}
                      <td className="py-4 px-4">
                        <StatusChip status={order.status} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetails(true);
                            }}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:shadow-sm transition-all"
                            title="View details"
                          >
                            <Eye size={15} />
                          </button>
                          {canUpdate && getNextStatus(order.status) && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  orderId: order.id,
                                  status: getNextStatus(order.status)!,
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all disabled:opacity-50"
                            >
                              {updateStatusMutation.isPending &&
                              updateStatusMutation.variables?.orderId === order.id
                                ? "..."
                                : getNextStatus(order.status) === "PREPARING"
                                ? "Prepare"
                                : getNextStatus(order.status) === "READY"
                                ? "Ready"
                                : "Serve"}
                            </button>
                          )}
                          {canUpdate && (order.status === "PENDING" || order.status === "CONFIRMED" || order.status === "PREPARING") && (
                            <button
                              onClick={() => {
                                if (window.confirm("Are you sure you want to cancel this order?")) {
                                  updateStatusMutation.mutate({ orderId: order.id, status: "CANCELLED" });
                                }
                              }}
                              disabled={updateStatusMutation.isPending}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details drawer / modal */}
      <AnimatePresence>
        {showDetails && selectedOrder && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="fixed inset-0 z-40 bg-black"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 p-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Order Details: {selectedOrder.orderNumber}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    ID: {selectedOrder.id}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable details content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Status Indicator */}
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">Current Status:</span>
                  </div>
                  <StatusChip status={selectedOrder.status} />
                </div>

                {/* Info blocks grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Location Card */}
                  <div className="rounded-xl border border-gray-100 p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold uppercase">
                      <Compass size={13} />
                      Location
                    </div>
                    <p className="text-sm font-bold text-gray-800">
                      {selectedOrder.booking?.bookingType === "ROOM"
                        ? `Room ${selectedOrder.booking?.room?.roomNumber ?? "—"}`
                        : `Table ${selectedOrder.booking?.table?.tableNumber ?? "—"}`}
                    </p>
                    {selectedOrder.booking?.table?.floor && (
                      <p className="text-xs text-gray-500">
                        Floor: {selectedOrder.booking.table.floor.name}
                      </p>
                    )}
                  </div>

                  {/* Customer Card */}
                  <div className="rounded-xl border border-gray-100 p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold uppercase">
                      <User size={13} />
                      Customer
                    </div>
                    <p className="text-sm font-bold text-gray-800">
                      {selectedOrder.booking?.customer?.fullName ?? "Guest"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedOrder.booking?.customer?.phoneNumber ?? "No phone"}
                    </p>
                  </div>
                </div>

                {/* Items details table */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <Utensils size={15} className="text-gray-400" />
                    Ordered Items
                  </h3>
                  <div className="rounded-xl border border-gray-100 overflow-hidden bg-gray-50/20">
                    <div className="divide-y divide-gray-100">
                      {selectedOrder.items?.map((item: any, idx: number) => {
                        const itTotal = Number(item.lineTotalSnapshot ?? 0);
                        return (
                          <div key={idx} className="p-4 flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-sm text-gray-800">
                                {item.itemNameSnapshot}
                                {item.variantNameSnapshot && (
                                  <span className="text-xs text-gray-500 ml-1 font-medium">({item.variantNameSnapshot})</span>
                                )}
                              </p>
                              {item.specialNotes && (
                                <p className="text-xs text-amber-600 bg-amber-50 rounded border border-amber-100 px-2 py-1 mt-1.5 italic">
                                  Notes: {item.specialNotes}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-gray-900">
                                {formatCurrency(itTotal)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatCurrency(Number(item.unitPriceSnapshot))} ×{item.quantity}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                {canViewFinancial && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                      <Receipt size={15} className="text-gray-400" />
                      Invoice & Financials
                    </h3>
                    <div className="rounded-xl border border-gray-100 bg-gray-50/30 p-4 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(Number(selectedOrder.subtotalSnapshot ?? 0))}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Discount:</span>
                        <span>-{formatCurrency(Number(selectedOrder.discountSnapshot ?? 0))}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2 text-base">
                        <span>Order Total:</span>
                        <span>{formatCurrency(Number(selectedOrder.totalSnapshot ?? 0))}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Timeline */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Order Timeline
                  </h3>
                  <div className="relative pl-6 border-l border-gray-100 ml-3 space-y-5">
                    {getOrderStatusTimeline(selectedOrder.status).stages.map((stage, idx) => {
                      const stages = getOrderStatusTimeline(selectedOrder.status).stages;
                      const currentIdx = stages.indexOf(selectedOrder.status);
                      const isDone = currentIdx >= idx && selectedOrder.status !== "CANCELLED";

                      return (
                        <div key={idx} className="relative">
                          <span
                            className={cn(
                              "absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white transition-all",
                              isDone ? "border-emerald-500 bg-emerald-500" : "border-gray-200"
                            )}
                          />
                          <div>
                            <p className={cn("text-xs font-bold", isDone ? "text-emerald-700" : "text-gray-400")}>
                              {stage}
                            </p>
                            {isDone && idx === 0 && (
                              <p className="text-[10px] text-gray-400">
                                {formatDate(selectedOrder.createdAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {selectedOrder.status === "CANCELLED" && (
                      <div className="relative">
                        <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-red-500 border-red-500" />
                        <div>
                          <p className="text-xs font-bold text-red-600">CANCELLED</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action footer inside drawer */}
              {canUpdate && getNextStatus(selectedOrder.status) && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 flex gap-2">
                  <button
                    onClick={() => {
                      updateStatusMutation.mutate({
                        orderId: selectedOrder.id,
                        status: getNextStatus(selectedOrder.status)!,
                      });
                      setShowDetails(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-center transition-all cursor-pointer shadow-sm shadow-emerald-600/20"
                  >
                    Advance to {getNextStatus(selectedOrder.status)}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
