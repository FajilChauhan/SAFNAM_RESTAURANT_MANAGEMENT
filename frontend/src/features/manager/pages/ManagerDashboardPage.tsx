import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BedDouble, CalendarDays, ChefHat, CreditCard, Grid3X3,
  ShoppingBag, TrendingUp, Users, RefreshCw, BarChart3,
  ArrowUpRight, ArrowDownRight, Plus, Link2
} from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardApi } from "@/api/dashboard.api";
import type { ManagerDashboard, TopFood, Booking, Order, Payment, Offer } from "@/types/dashboard.types";
import { DashboardError, DashboardSkeleton, formatMoney, StatusPill } from "@/features/dashboard/DashboardShared";
import { useAuthStore } from "@/store/authStore";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/formatters";

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } };

function PointHeight(value: string | number): number {
  return Number(value) / 1000;
}

function quickAction(label: string, path: string, allowed: boolean, icon: React.ReactNode) {
  if (!allowed) return null;
  return (
    <Link
      key={path}
      to={path}
      className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-700 transition-all hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 hover:scale-[1.01]"
    >
      <span className="text-gray-400 group-hover:text-emerald-600">{icon}</span>
      {label}
    </Link>
  );
}

export default function ManagerDashboardPage() {
  const { user } = useAuthStore();
  const { settings } = useRestaurantSettings();
  const userPermissions = user?.permissions ?? [];
  const isAdmin = user?.role === "ADMIN";

  const has = (perm: string) => isAdmin || userPermissions.includes(perm);

  const query = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: async () => (await dashboardApi.getManagerDashboard()).data.data.dashboard,
    refetchInterval: 30000,
  });

  if (query.isLoading) return <DashboardSkeleton />;
  if (query.isError || !query.data) return <DashboardError onRetry={() => void query.refetch()} />;

  const dashboard: ManagerDashboard = query.data;
  const stats = dashboard.stats;

  const hasReports = has("operations.reports.view");
  const hasOrders = has("operations.orders.view");
  const hasBookings = has("operations.bookings.view");
  const hasCustomers = has("operations.customers.view");
  const hasTables = has("operations.tables.view");
  const hasRooms = has("operations.rooms.view");
  const hasMenu = has("operations.menu.view");
  const hasOffers = has("operations.offers.view");

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {settings.name} · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <button
          onClick={() => void query.refetch()}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-50"
        >
          <RefreshCw size={15} className={cn(query.isFetching && "animate-spin")} />
          Refresh
        </button>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {hasReports && (
          <StatCard
            label="Today's Revenue"
            value={formatMoney(stats.todayRevenue)}
            icon={<TrendingUp size={20} />}
            tone="emerald"
            trend={stats.revenueChange}
            sub={`Month: ${formatMoney(stats.monthlyRevenue)}`}
          />
        )}
        {hasOrders && (
          <StatCard
            label="Today's Orders"
            value={stats.todayOrders}
            icon={<ShoppingBag size={20} />}
            tone="amber"
            trend={stats.ordersChange}
            sub="Active in kitchen"
          />
        )}
        {hasBookings && (
          <StatCard
            label="Today's Bookings"
            value={stats.todayBookings}
            icon={<CalendarDays size={20} />}
            tone="blue"
            sub={`${stats.todayCustomers} guests`}
          />
        )}
        {hasCustomers && (
          <StatCard
            label="Customers"
            value={stats.todayCustomers}
            icon={<Users size={20} />}
            tone="purple"
            trend={stats.customersChange}
            sub="Today"
          />
        )}
        {hasTables && (
          <StatCard
            label="Occupied Tables"
            value={`${stats.occupiedTables}/${stats.totalTables ?? 0}`}
            icon={<Grid3X3 size={20} />}
            tone="emerald"
            sub={`${dashboard.tableUtilization}% utilization`}
          />
        )}
        {hasRooms && (
          <StatCard
            label="Occupied Rooms"
            value={`${stats.occupiedRooms}/${stats.totalRooms ?? 0}`}
            icon={<BedDouble size={20} />}
            tone="blue"
            sub={`${dashboard.roomUtilization}% utilization`}
          />
        )}
        {hasMenu && (
          <StatCard
            label="Kitchen Queue"
            value={stats.kitchenQueueCount}
            icon={<ChefHat size={20} />}
            tone="amber"
            sub="Orders waiting"
          />
        )}
        {hasReports && (
          <StatCard
            label="Pending Payments"
            value={stats.pendingPayments}
            icon={<CreditCard size={20} />}
            tone="red"
            sub={`${stats.pendingInvoices ?? 0} invoices`}
          />
        )}
      </motion.div>

      {/* Revenue Chart + Orders Breakdown */}
      {hasReports && (
        <motion.div variants={item} className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Revenue Chart</h2>
            {dashboard.revenueChart.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center">
                <BarChart3 size={40} className="mb-3 text-gray-200" />
                <p className="font-medium text-gray-400">No revenue data yet</p>
              </div>
            ) : (
              <div className="flex h-52 items-end gap-1.5">
                {dashboard.revenueChart.map((point) => {
                  const maxVal = Math.max(...dashboard.revenueChart.map((p) => Number(p.value)));
                  const height = maxVal > 0 ? Math.max(6, (Number(point.value) / maxVal) * 100) : 6;
                  return (
                    <div key={point.label} className="group flex flex-1 flex-col items-center gap-1.5">
                      <div
                        title={`${point.label}: ${formatMoney(Number(point.value))}`}
                        className="w-full rounded-t-lg bg-emerald-500 transition-all group-hover:bg-emerald-600"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[9px] text-gray-400">{String(point.label).slice(-5)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {hasOrders && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Orders by Status</h2>
              <div className="space-y-2">
                {(dashboard.orderBreakdown ?? []).map((point) => (
                  <div key={point.label} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
                    <span className="text-gray-700">{point.label}</span>
                    <span className="font-bold text-gray-900">{point.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Lists: Top Foods + Recent Bookings + Recent Orders */}
      <motion.div variants={item} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hasReports && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Top Selling Foods</h2>
            <div className="space-y-3">
              {dashboard.topSellingFoods.length === 0 ? (
                <p className="text-sm text-gray-400">No sales data yet.</p>
              ) : (
                dashboard.topSellingFoods.slice(0, 6).map((food: TopFood, idx) => (
                  <div key={food.menuItemId ?? idx} className="flex items-center gap-3">
                    <span className={cn(
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-gray-100 text-gray-600" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-400"
                    )}>{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{food.name}</p>
                      <p className="text-xs text-gray-400">{food.quantity ?? 0} orders</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 flex-shrink-0">{formatMoney(food.revenue)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {hasBookings && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
              <Link to="/manager/bookings" className="text-xs font-medium text-emerald-600 hover:underline">View all</Link>
            </div>
            <div className="space-y-2">
              {dashboard.recentBookings.length === 0 ? (
                <p className="text-sm text-gray-400">No bookings today.</p>
              ) : (
                dashboard.recentBookings.slice(0, 5).map((b: Booking) => (
                  <div key={b.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{b.customerName ?? "Guest"}</p>
                      <p className="text-xs text-gray-400">{b.tableNumber ?? b.roomNumber ?? "-"} · {b.members ?? b.guests ?? "-"} guests</p>
                    </div>
                    <StatusPill status={b.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {hasOrders && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <Link to="/manager/orders" className="text-xs font-medium text-emerald-600 hover:underline">View all</Link>
            </div>
            <div className="space-y-2">
              {dashboard.recentOrders.length === 0 ? (
                <p className="text-sm text-gray-400">No orders yet.</p>
              ) : (
                dashboard.recentOrders.slice(0, 5).map((o: Order) => (
                  <div key={o.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">#{(o.orderNumber ?? o.id).slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400">{formatMoney(o.total ?? o.totalSnapshot)}</p>
                    </div>
                    <StatusPill status={o.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.section variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickAction("Tables", "/manager/tables", userPermissions.includes("operations.tables.create") || isAdmin, <Grid3X3 size={16} />)}
          {quickAction("Rooms", "/manager/rooms", userPermissions.includes("operations.rooms.create") || isAdmin, <BedDouble size={16} />)}
          {quickAction("Offers", "/manager/offers", userPermissions.includes("operations.offers.create") || isAdmin, <TrendingUp size={16} />)}
          {quickAction("Orders", "/manager/orders", hasOrders, <ShoppingBag size={16} />)}
          {quickAction("Reports", "/manager/reports", hasReports, <BarChart3 size={16} />)}
          {quickAction("Bookings", "/manager/bookings", hasBookings, <CalendarDays size={16} />)}
        </div>
      </motion.section>

      {/* Payments + Feedback */}
      {hasReports && (
        <motion.div variants={item} className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Payments</h2>
            <div className="space-y-2">
              {dashboard.recentPayments.length === 0 ? (
                <p className="text-sm text-gray-400">No payments yet.</p>
              ) : (
                dashboard.recentPayments.slice(0, 5).map((p: Payment) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.paymentNumber ?? p.id.slice(-8)}</p>
                      <p className="text-xs text-gray-400">{p.method ?? "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatMoney(p.amount)}</p>
                      <StatusPill status={p.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Guest Feedback</h2>
            <div className="space-y-2">
              {dashboard.recentFeedback.length === 0 ? (
                <p className="text-sm text-gray-400">No feedback yet.</p>
              ) : (
                dashboard.recentFeedback.slice(0, 5).map((f) => (
                  <div key={f.id} className="rounded-xl bg-gray-50 px-3 py-2.5">
                    <p className="text-sm font-medium text-gray-900">{f.customerName ?? "Guest"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Food: {f.foodRating ?? "—"}/5 · Service: {f.serviceRating ?? "—"}/5
                    </p>
                    {f.comments && <p className="text-xs text-gray-400 mt-1 italic">&ldquo;{f.comments}&rdquo;</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Offers */}
      {hasOffers && dashboard.currentOffers.length > 0 && (
        <motion.section variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Active Offers</h2>
          <div className="flex flex-wrap gap-3">
            {dashboard.currentOffers.map((offer: Offer) => (
              <div key={offer.id} className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm">
                <p className="font-semibold text-emerald-800">{offer.title}</p>
                {offer.code && <p className="mt-0.5 font-mono text-xs text-emerald-600">Code: {offer.code}</p>}
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}

// Local StatCard (with icon support, matching design system)
function StatCard({
  label, value, icon, tone = "emerald", trend, sub
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: "emerald" | "amber" | "blue" | "purple" | "red" | "gray";
  trend?: number;
  sub?: string;
}) {
  const iconTones: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", iconTones[tone])}>
          {icon}
        </div>
        {trend !== undefined && trend !== null && (
          <span className={cn("flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium", trend >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </motion.div>
  );
}
