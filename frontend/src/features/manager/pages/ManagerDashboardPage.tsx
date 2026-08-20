import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BedDouble, CalendarDays, ChefHat, CreditCard, Grid3X3, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardApi } from "@/api/dashboard.api";
import type { ManagerDashboard } from "@/types/dashboard.types";
import { DashboardError, DashboardSkeleton, formatMoney, RefreshLine, StatCard, StatusPill } from "@/features/dashboard/DashboardShared";
import { useAuthStore } from "@/store/authStore";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } };

export default function ManagerDashboardPage() {
  const { user } = useAuthStore();
  const { settings } = useRestaurantSettings();
  const userPermissions = user?.permissions ?? [];

  const query = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: async () => (await dashboardApi.getManagerDashboard()).data.data.dashboard,
    refetchInterval: 30000,
  });

  if (query.isLoading) return <DashboardSkeleton />;
  if (query.isError || !query.data) return <DashboardError onRetry={() => void query.refetch()} />;

  const dashboard: ManagerDashboard = query.data;
  const stats = dashboard.stats;

  // Permission Checks
  const hasReports = userPermissions.includes("operations.reports.view");
  const hasOrders = userPermissions.includes("operations.orders.view");
  const hasBookings = userPermissions.includes("operations.bookings.view");
  const hasCustomers = userPermissions.includes("operations.customers.view");
  const hasTables = userPermissions.includes("operations.tables.view");
  const hasRooms = userPermissions.includes("operations.rooms.view");
  const hasMenu = userPermissions.includes("operations.menu.view");
  const hasOffers = userPermissions.includes("operations.offers.view");

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <RefreshLine generatedAt={dashboard.generatedAt} isFetching={query.isFetching} onRefresh={() => void query.refetch()} />
        <motion.div variants={item}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manager Dashboard</h1>
          <p className="text-sm text-gray-500">Here's what's happening at {settings.name} today.</p>
        </motion.div>

        {/* Dynamic Cards View */}
        <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hasReports && (
            <StatCard label="Today's Revenue" value={formatMoney(stats.todayRevenue)} sub={`${stats.revenueChange}% vs yesterday`} icon={<TrendingUp className="h-5 w-5" />} />
          )}
          {hasOrders && (
            <StatCard label="Today's Orders" value={stats.todayOrders} sub={`${stats.ordersChange}% vs yesterday`} icon={<ShoppingBag className="h-5 w-5" />} tone="amber" />
          )}
          {hasBookings && (
            <StatCard label="Today's Bookings" value={stats.todayBookings} sub={`${stats.todayCustomers} customers`} icon={<CalendarDays className="h-5 w-5" />} tone="blue" />
          )}
          {hasCustomers && (
            <StatCard label="Today's Customers" value={stats.todayCustomers} sub={`${stats.customersChange}% vs yesterday`} icon={<Users className="h-5 w-5" />} tone="purple" />
          )}
          {hasTables && (
            <StatCard label="Occupied Tables" value={`${stats.occupiedTables}/${stats.totalTables ?? 0}`} sub={`${dashboard.tableUtilization}% utilization`} icon={<Grid3X3 className="h-5 w-5" />} />
          )}
          {hasRooms && (
            <StatCard label="Occupied Rooms" value={`${stats.occupiedRooms}/${stats.totalRooms ?? 0}`} sub={`${dashboard.roomUtilization}% utilization`} icon={<BedDouble className="h-5 w-5" />} tone="blue" />
          )}
          {hasMenu && (
            <StatCard label="Kitchen Queue" value={stats.kitchenQueueCount} sub="orders waiting" icon={<ChefHat className="h-5 w-5" />} tone="amber" />
          )}
          {hasReports && (
            <StatCard label="Pending Payments" value={stats.pendingPayments} sub={`${stats.pendingInvoices ?? 0} invoices`} icon={<CreditCard className="h-5 w-5" />} tone="red" />
          )}
        </motion.div>

        {/* Revenue Chart Section */}
        {hasReports && (
          <motion.div variants={item} className="grid gap-6 xl:grid-cols-3">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 xl:col-span-2">
              <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Revenue Chart</h2>
              <div className="flex h-64 items-end gap-2">
                {dashboard.revenueChart.map((point) => (
                  <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t-xl bg-emerald-500" style={{ height: `${Math.max(8, Math.min(100, PointHeight(point.value)))}%` }} />
                    <span className="text-[10px] text-gray-400">{point.label.slice(5)}</span>
                  </div>
                ))}
              </div>
            </section>
            {hasOrders && (
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Orders</h2>
                <div className="space-y-3">
                  {(dashboard.orderBreakdown ?? []).map((point) => (
                    <div key={point.label} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-gray-800">
                      <span>{point.label}</span>
                      <span className="font-bold">{point.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}

        {/* Dynamic Lists */}
        <motion.div variants={item} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hasReports && (
            <List title="Top Selling Foods" items={dashboard.topSellingFoods.map((food, index) => `${index + 1}. ${food.name} - ${food.quantity ?? 0} orders - ${formatMoney(food.revenue)}`)} />
          )}
          {hasBookings && (
            <List title="Recent Bookings" items={dashboard.recentBookings.slice(0, 5).map((booking) => `${booking.customerName ?? "Guest"} - ${booking.tableNumber ?? booking.roomNumber ?? "-"} - ${booking.status ?? "-"}`)} />
          )}
          {hasOrders && (
            <List title="Recent Orders" items={dashboard.recentOrders.slice(0, 5).map((order) => `${order.orderNumber ?? order.id} - ${formatMoney(order.total ?? order.totalSnapshot)} - ${order.status ?? "-"}`)} />
          )}
        </motion.div>

        {/* Quick Actions (only show allowed paths) */}
        <motion.section variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {quickAction("+ Table", "/manager/tables", userPermissions.includes("operations.tables.create"))}
            {quickAction("+ Room", "/manager/rooms", userPermissions.includes("operations.rooms.create"))}
            {quickAction("+ Offer", "/manager/offers", userPermissions.includes("operations.offers.create"))}
            {quickAction("Orders", "/manager/orders", userPermissions.includes("operations.orders.view"))}
          </div>
        </motion.section>

        {/* Additional Lists & Feedbacks */}
        <motion.div variants={item} className="grid gap-6 md:grid-cols-2">
          {hasReports && (
            <List title="Recent Payments" items={dashboard.recentPayments.map((payment) => `${payment.paymentNumber ?? payment.id} - ${formatMoney(payment.amount)} - ${payment.status ?? "-"}`)} />
          )}
          {hasReports && (
            <List title="Recent Guest Feedback" items={dashboard.recentFeedback.map((feedback) => `${feedback.customerName ?? "Guest"} - Food ${feedback.foodRating ?? "-"} / Service ${feedback.serviceRating ?? "-"} - ${feedback.comments ?? ""}`)} />
          )}
        </motion.div>

        {/* Dynamic Offers list */}
        {hasOffers && (
          <motion.section variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Current Offers</h2>
            <div className="flex flex-wrap gap-3">
              {dashboard.currentOffers.length ? dashboard.currentOffers.map((offer) => (
                <div key={offer.id} className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {offer.title} <StatusPill status={offer.code ?? offer.type} />
                </div>
              )) : <p className="text-sm text-gray-500">No active offers.</p>}
            </div>
          </motion.section>
        )}
      </div>
    </motion.div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        <div className="space-y-3">
          {items.length ? items.map((entry) => <div key={entry} className="rounded-xl bg-gray-55 px-4 py-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">{entry}</div>) : <p className="text-sm text-gray-500">No records.</p>}
        </div>
      </div>
    </section>
  );
}

function PointHeight(value: string | number): number {
  return Number(value) / 1000;
}

function quickAction(label: string, path: string, allowed: boolean) {
  if (!allowed) return null;
  return (
    <Link to={path} className="rounded-2xl bg-emerald-50 px-4 py-4 text-center text-sm font-semibold text-emerald-800 transition hover:scale-[1.02] dark:bg-emerald-500/10 dark:text-emerald-300">
      {label}
    </Link>
  );
}
