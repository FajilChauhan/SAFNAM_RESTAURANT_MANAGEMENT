import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BedDouble, CalendarDays, CreditCard, Gift, ShoppingBag, Star, Trophy, Users, UtensilsCrossed } from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardApi } from "@/api/dashboard.api";
import type { CustomerDashboard } from "@/types/dashboard.types";
import { cn } from "@/utils/cn";
import {
  DashboardError,
  DashboardSkeleton,
  formatDateTime,
  formatMoney,
  RefreshLine,
  StatCard,
  StatusPill,
} from "@/features/dashboard/DashboardShared";

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } };

export default function CustomerDashboardPage() {
  const query = useQuery({
    queryKey: ["customer-dashboard"],
    queryFn: async () => (await dashboardApi.getCustomerDashboard()).data.data.dashboard,
    refetchInterval: 30000,
  });

  if (query.isLoading) return <DashboardSkeleton columns={3} />;
  if (query.isError || !query.data) return <DashboardError onRetry={() => void query.refetch()} />;

  const dashboard: CustomerDashboard = query.data;
  const cart = dashboard.currentCart;
  const currentBooking = dashboard.currentBooking;
  const activeSession = currentBooking?.status === "CHECKED_IN";

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <RefreshLine generatedAt={dashboard.generatedAt} isFetching={query.isFetching} onRefresh={() => void query.refetch()} />

        <motion.section variants={item} className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-800 p-6 text-white">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {dashboard.user.name}</h1>
              <p className="mt-1 text-sm text-emerald-100">Ready for your next SAFNAM experience?</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs">Rank #{dashboard.user.leaderboardPosition || "-"}</span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs">{dashboard.user.rewardPoints} Points</span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs">{dashboard.user.visitCount} Visits</span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs">{formatMoney(dashboard.user.totalSpending)} Spent</span>
              </div>
            </div>
            <div className="rounded-2xl bg-white px-5 py-3 text-center text-emerald-700 shadow-lg">
              <Trophy className="mx-auto mb-1 h-6 w-6 text-amber-500" />
              <p className="text-xs font-semibold uppercase tracking-wide">Loyalty</p>
              <p className="text-xl font-bold">{dashboard.user.loyaltyStatus}</p>
            </div>
          </div>
        </motion.section>

        <motion.section variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Book Table", "/customer/book-table", <CalendarDays className="h-6 w-6" />, "bg-amber-500 text-white shadow-amber-500/30"],
            ["Book Room", "/customer/book-room", <BedDouble className="h-6 w-6" />, "bg-emerald-700 text-white shadow-emerald-700/20"],
            ["View Menu", "/customer/menu", <UtensilsCrossed className="h-6 w-6" />, "bg-white text-gray-900"],
            ["View Orders", "/customer/orders", <ShoppingBag className="h-6 w-6" />, "bg-white text-gray-900"],
            ["View Bookings", "/customer/bookings", <Star className="h-6 w-6" />, "bg-white text-gray-900"],
          ].map(([label, to, icon, className]) => (
            <Link key={label as string} to={to as string} className={cn("flex min-h-28 flex-col justify-between rounded-2xl border border-gray-100 p-5 font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md", className as string)}>
              {icon}
              <span>{label}</span>
            </Link>
          ))}
        </motion.section>

        {activeSession ? (
          <motion.section variants={item} className="relative rounded-2xl border-2 border-emerald-500 bg-white p-5 shadow-sm dark:bg-gray-900">
            <span className="absolute -top-3 left-5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">ACTIVE SESSION</span>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Table" value={currentBooking?.tableNumber ?? "-"} icon={<ShoppingBag className="h-5 w-5" />} />
              <StatCard label="Room" value={currentBooking?.roomNumber ?? "-"} icon={<CalendarDays className="h-5 w-5" />} tone="blue" />
              <StatCard label="Time" value={formatDateTime(currentBooking?.checkedInAt)} icon={<Star className="h-5 w-5" />} tone="amber" />
              <StatCard label="Guests" value={currentBooking?.members ?? currentBooking?.guests ?? 0} icon={<Users className="h-5 w-5" />} tone="purple" />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {[
                ["View Menu", "/customer/menu", "bg-emerald-600 text-white"],
                ["Track Orders", "/customer/orders", "bg-amber-500 text-white"],
                ["View Cart", "/customer/cart", "border border-emerald-200 text-emerald-700"],
                ["Need Bill", currentBooking ? `/customer/invoice/${currentBooking.id}` : "/customer/orders", "border border-gray-200 text-gray-700"],
              ].map(([label, to, className]) => (
                <Link key={label} to={to} className={cn("rounded-xl px-4 py-2 text-sm font-semibold", className)}>
                  {label}
                </Link>
              ))}
            </div>
          </motion.section>
        ) : (
          <motion.section variants={item} className="rounded-2xl border border-dashed border-amber-200 bg-white p-6 text-center shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">No active booking</h2>
            <p className="mt-2 text-sm text-gray-500">Reserve your next SAFNAM experience and your active session will appear here.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link to="/customer/book-table" className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600">Book a Table</Link>
              <Link to="/customer/book-room" className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Book a Room</Link>
            </div>
          </motion.section>
        )}

        <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
          <StatCard label="Cart" value={cart ? `${cart.itemCount ?? cart.totalItems ?? cart.items.length} items` : "Empty"} sub={formatMoney(cart?.total ?? cart?.totalAmount)} icon={<ShoppingBag className="h-5 w-5" />} />
          <StatCard label="Invoice" value={dashboard.currentInvoice ? formatMoney(dashboard.currentInvoice.grandTotal) : "No invoice"} sub={<StatusPill status={dashboard.currentInvoice?.status} />} icon={<CreditCard className="h-5 w-5" />} tone="amber" />
          <StatCard label="Rewards" value={`${dashboard.rewards.length} available`} sub={`${dashboard.user.rewardPoints} points`} icon={<Gift className="h-5 w-5" />} tone="purple" />
        </motion.div>

        <motion.section variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-orange-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Active Orders</h2>
          </div>
          {dashboard.activeOrders.length ? (
            <div className="grid gap-3">
              {dashboard.activeOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{order.orderNumber ?? `Order ${order.id.slice(-6)}`}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(order.confirmedAt)}</p>
                    </div>
                    <StatusPill status={order.kitchenStatus ?? order.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active orders right now.</p>
          )}
        </motion.section>

        <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
          <List title="Today's Offers" items={dashboard.availableOffers.map((offer) => `${offer.title}${offer.code ? ` - ${offer.code}` : ""}`)} />
          <List title="Recent Orders" items={dashboard.recentOrders.slice(0, 5).map((order) => `${order.orderNumber ?? order.id} - ${formatMoney(order.total ?? order.totalSnapshot)} - ${order.status ?? "-"}`)} />
          <List title="Booking History" items={dashboard.bookingHistory.slice(0, 5).map((booking) => `${booking.bookingType ?? booking.type} - ${booking.bookingDate ?? "-"} - ${booking.status ?? "-"}`)} />
          <List title="Favourite Foods" items={dashboard.favouriteFoods.map((food) => `${food.name} - ${food.quantity ?? 0} ordered`)} />
        </motion.div>
      </div>
    </motion.div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
      {items.length ? (
        <div className="space-y-3">
          {items.map((entry) => (
            <div key={entry} className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">{entry}</div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Nothing to show yet.</p>
      )}
    </section>
  );
}
