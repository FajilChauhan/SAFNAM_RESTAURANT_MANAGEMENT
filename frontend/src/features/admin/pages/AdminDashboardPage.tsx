import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp,
  ShoppingBag,
  CalendarDays,
  Users,
  Grid3X3,
  BedDouble,
  ChefHat,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  UtensilsCrossed,
  Tag,
  Layers,
  Percent,
  Settings,
  ClipboardList,
  Shield,
  Activity,
  Database,
  BarChart3,
  CheckCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { dashboardApi } from "@/api/dashboard.api";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import type { Booking, TopFood, Employee } from "@/types/dashboard.types";

const AdminDashboardPage = () => {
  const [revenuePeriod, setRevenuePeriod] = useState<"today" | "week" | "month" | "year">("week");

  const { data, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await dashboardApi.getAdminDashboard();
      return res.data.data.dashboard;
    },
    refetchInterval: 30000,
  });

  // Map API data safely using any casting to bypass partial dashboard schema boundaries
  const stats = (data?.stats ?? {}) as any;
  const orderBreakdown = data?.orderBreakdown ?? [];

  // Extract statuses from orderBreakdown if not directly in stats to keep Donut data populated
  const pendingOrders = stats.pendingOrders ?? orderBreakdown.find((item: any) => item.label === "PENDING")?.value ?? 0;
  const preparingOrders = stats.preparingOrders ?? orderBreakdown.find((item: any) => item.label === "PREPARING" || item.label === "ACCEPTED" || item.label === "CONFIRMED")?.value ?? 0;
  const readyOrders = stats.readyOrders ?? orderBreakdown.find((item: any) => item.label === "READY")?.value ?? 0;
  const servedOrders = stats.servedOrders ?? orderBreakdown.find((item: any) => item.label === "SERVED" || item.label === "COMPLETED" || item.label === "CHECKED_OUT")?.value ?? 0;

  const revenueChart = useMemo(() => {
    return (data?.revenueChart ?? []).map((item: any) => ({
      ...item,
      revenue: item.revenue ?? item.value ?? 0,
      label: item.label,
    }));
  }, [data?.revenueChart]);

  const recentBookings = data?.recentBookings ?? [];
  const topFoods = data?.topSellingFoods ?? [];
  const employeeStats = (data?.employeeStats ?? {}) as any;
  const systemHealth = (data?.systemHealth ?? {}) as any;

  if (isLoading) return <AdminDashboardSkeleton />;

  if (isError)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Failed to load dashboard</h2>
          <p className="mb-4 text-gray-500">Could not connect to server</p>
          <button
            onClick={() => refetch()}
            className="mx-auto flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-white transition-all hover:bg-emerald-700"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );

  // Stat cards config
  const statCards = [
    {
      label: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue ?? 0),
      icon: TrendingUp,
      color: "emerald",
      change: stats.revenueChange ?? 0,
      sub: "vs yesterday",
    },
    {
      label: "Today's Orders",
      value: stats.todayOrders ?? 0,
      icon: ShoppingBag,
      color: "amber",
      change: stats.ordersChange ?? 0,
      sub: "vs yesterday",
    },
    {
      label: "Today's Bookings",
      value: stats.todayBookings ?? 0,
      icon: CalendarDays,
      color: "blue",
      change: null,
      sub: `${stats.activeBookings ?? 0} active`,
    },
    {
      label: "Total Customers",
      value: stats.totalCustomers ?? 0,
      icon: Users,
      color: "purple",
      change: null,
      sub: `${stats.todayCustomers ?? 0} today`,
    },
  ];

  // Color map
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    gray: "bg-gray-100 text-gray-600",
  };

  // Orders donut data
  const donutData = [
    {
      name: "Pending",
      value: pendingOrders,
      color: "#f59e0b",
    },
    {
      name: "Preparing",
      value: preparingOrders,
      color: "#3b82f6",
    },
    {
      name: "Ready",
      value: readyOrders,
      color: "#10b981",
    },
    {
      name: "Served",
      value: servedOrders,
      color: "#6b7280",
    },
  ].filter((d) => d.value > 0);

  const totalOrdersToday = donutData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">Restaurant wide performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Updated {new Date(dataUpdatedAt).toLocaleTimeString()}</span>
          <button
            onClick={() => refetch()}
            className="rounded-xl border border-gray-200 p-2 text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", colorMap[card.color])}>
                <card.icon size={20} />
              </div>

              {card.change !== null && (
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                    card.change >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600",
                  )}
                >
                  {card.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(card.change)}%
                </div>
              )}
            </div>

            <p className="mb-1 text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-1 text-xs text-gray-400">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* SECONDARY STATS ROW */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Occupied Tables",
            value: `${stats.occupiedTables ?? 0}`,
            sub: `of ${stats.totalTables ?? 0} tables`,
            icon: Grid3X3,
            color: "blue",
            pct: stats.totalTables ? Math.round((stats.occupiedTables / stats.totalTables) * 100) : 0,
          },
          {
            label: "Occupied Rooms",
            value: `${stats.occupiedRooms ?? 0}`,
            sub: `of ${stats.totalRooms ?? 0} rooms`,
            icon: BedDouble,
            color: "purple",
            pct: stats.totalRooms ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0,
          },
          {
            label: "Kitchen Queue",
            value: stats.kitchenQueueCount ?? 0,
            sub: "orders waiting",
            icon: ChefHat,
            color: "orange",
            pct: null,
          },
          {
            label: "Pending Payments",
            value: formatCurrency(stats.pendingPayments ?? 0),
            sub: `${stats.pendingInvoices ?? 0} invoices`,
            icon: CreditCard,
            color: "red",
            pct: null,
          },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", colorMap[item.color])}>
                <item.icon size={16} />
              </div>
              <p className="text-sm font-medium text-gray-500">{item.label}</p>
            </div>

            <p className="mb-1 text-xl font-bold text-gray-900">{item.value}</p>
            <p className="text-xs text-gray-400">{item.sub}</p>

            {item.pct !== null && (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      item.color === "blue" ? "bg-blue-500" : "bg-purple-500",
                    )}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">{item.pct}% utilization</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Revenue Overview</h3>
              <p className="text-sm text-gray-400">
                {stats.monthlyRevenue ? `Monthly: ${formatCurrency(stats.monthlyRevenue)}` : "Revenue trends"}
              </p>
            </div>
            <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
              {(["today", "week", "month", "year"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setRevenuePeriod(p)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all capitalize",
                    revenuePeriod === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {revenueChart.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <BarChart3 size={40} className="mb-3 text-gray-200" />
              <p className="font-medium text-gray-400">No revenue data yet</p>
              <p className="mt-1 text-sm text-gray-300">Revenue will appear as orders are completed</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChart} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 11,
                    fill: "#9ca3af",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: "#9ca3af",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: any) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                  }}
                  formatter={(v: any) => [formatCurrency(Number(v) || 0), "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2.5} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Orders Donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-4">
            <h3 className="font-bold text-gray-900">Orders Status</h3>
            <p className="text-sm text-gray-400">Today's breakdown</p>
          </div>

          {totalOrdersToday === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <ShoppingBag size={40} className="mb-3 text-gray-200" />
              <p className="font-medium text-gray-400">No orders today</p>
              <p className="mt-1 text-sm text-gray-300">Order data will appear here</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{totalOrdersToday}</span>
                  <span className="text-xs text-gray-400">orders</span>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-sm text-gray-600">{d.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* DATA ROWS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Recent Bookings</h3>
            <Link to="/admin/bookings" className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline">
              View All
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CalendarDays size={36} className="mb-3 text-gray-200" />
              <p className="font-medium text-gray-400">No recent bookings</p>
              <p className="mt-1 text-sm text-gray-300">Bookings will appear here once guests start reserving tables or rooms</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.slice(0, 5).map((b: Booking) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3 transition-all hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                      <CalendarDays size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{(b as any).customer?.name ?? b.customerName ?? "Guest"}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(b.startAt ?? b.bookingDate ?? (b as any).date ?? new Date().toISOString())} • {b.timeSlot ?? "Evening"} •{" "}
                        {b.guests ?? b.members ?? 0} guests
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      b.status === "CONFIRMED"
                        ? "bg-blue-100 text-blue-700"
                        : b.status === "CHECKED_IN"
                          ? "bg-green-100 text-green-700"
                          : b.status === "CHECKED_OUT"
                            ? "bg-gray-100 text-gray-600"
                            : b.status === "CANCELLED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Top Selling Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Top Selling Items</h3>
            <Link to="/admin/menu" className="text-sm font-medium text-emerald-600 hover:underline">
              View Menu
            </Link>
          </div>

          {topFoods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <UtensilsCrossed size={36} className="mb-3 text-gray-200" />
              <p className="font-medium text-gray-400">No order data yet</p>
              <p className="mt-1 text-sm text-gray-300">Top selling foods will appear after orders are completed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topFoods.slice(0, 6).map((food: TopFood, i: number) => {
                const orders = (food as any).orders ?? food.quantity ?? 0;
                const maxOrders = (topFoods[0] as any)?.orders ?? topFoods[0]?.quantity ?? 0;
                return (
                  <div key={food.menuItemId ?? (food as any).id ?? food.name ?? i} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                        i === 0
                          ? "bg-amber-100 text-amber-700"
                          : i === 1
                            ? "bg-gray-100 text-gray-600"
                            : i === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-50 text-gray-400",
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{food.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-grow overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${maxOrders ? (orders / maxOrders) * 100 : 0}%` }} />
                        </div>
                        <span className="shrink-0 text-xs text-gray-400">{orders} orders</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-gray-900">{formatCurrency(food.revenue ?? 0)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* EMPLOYEE STATS + SYSTEM HEALTH */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Employee Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <Shield size={16} className="text-emerald-600" />
            </div>
            <h3 className="font-bold text-gray-900">Employee Stats</h3>
          </div>

          <div className="mb-4 grid grid-cols-4 gap-3">
            {[
              {
                label: "Total Staff",
                value: employeeStats.total ?? 0,
                color: "bg-gray-50",
              },
              {
                label: "Managers",
                value: employeeStats.managers ?? 0,
                color: "bg-emerald-50",
              },
              {
                label: "Reception",
                value: employeeStats.reception ?? 0,
                color: "bg-blue-50",
              },
              {
                label: "Kitchen",
                value: employeeStats.kitchen ?? 0,
                color: "bg-amber-50",
              },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-xl p-3 text-center", item.color)}>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <p className="mt-1 text-xs text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>

          {employeeStats.recentlyAdded?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Recently Added</p>
              {employeeStats.recentlyAdded.slice(0, 3).map((emp: Employee) => (
                <div key={emp.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                      <span className="text-xs font-bold text-emerald-700">{emp.fullName?.charAt(0) ?? emp.role?.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{emp.fullName}</span>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      emp.role === "MANAGER"
                        ? "bg-emerald-100 text-emerald-700"
                        : emp.role === "RECEPTION"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {emp.role}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link to="/admin/employees" className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-600 hover:underline">
            Manage Employees
            <ArrowUpRight size={14} />
          </Link>
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Database size={16} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">System Health</h3>
          </div>

          {/* Status */}
          <div
            className={cn(
              "mb-4 flex items-center gap-3 rounded-xl p-4 border",
              systemHealth.status === "healthy"
                ? "bg-green-50 border-green-100"
                : systemHealth.status === "warning"
                  ? "bg-amber-50 border-amber-100"
                  : "bg-red-50 border-red-100",
            )}
          >
            <span
              className={cn(
                "h-3 w-3 shrink-0 rounded-full",
                systemHealth.status === "healthy" ? "bg-green-500 animate-pulse" : systemHealth.status === "warning" ? "bg-amber-500" : "bg-red-500",
              )}
            />
            <div>
              <p
                className={cn(
                  "text-sm font-semibold capitalize",
                  systemHealth.status === "healthy" ? "text-green-700" : systemHealth.status === "warning" ? "text-amber-700" : "text-red-700",
                )}
              >
                {systemHealth.status === "healthy" ? "All Systems Operational" : systemHealth.status === "warning" ? "Minor Issues Detected" : "Action Required"}
              </p>
              <p className={cn("text-xs mt-0.5", systemHealth.status === "healthy" ? "text-green-600" : "text-amber-600")}>
                {systemHealth.status === "healthy" ? "Everything is running smoothly" : "Please check the logs"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                label: "Database",
                value: systemHealth.dbStatus ?? "UP",
                icon: Database,
                ok: systemHealth.dbStatus === "UP",
              },
              {
                label: "Uptime",
                value: systemHealth.uptime ? `${systemHealth.uptime}s` : "N/A",
                icon: Activity,
                ok: true,
              },
              {
                label: "Last Backup",
                value: systemHealth.lastBackup ?? "Not configured",
                icon: CheckCircle,
                ok: systemHealth.lastBackup !== "not_configured",
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                <div className="flex items-center gap-2">
                  <item.icon size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <span className={cn("text-sm font-medium", item.ok ? "text-green-600" : "text-amber-600")}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* QUICK ACTIONS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <h3 className="mb-4 font-bold text-gray-900">Quick Actions</h3>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          {[
            {
              label: "Manage Employees",
              href: "/admin/employees",
              icon: Users,
              color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
            },
            {
              label: "Add Menu Item",
              href: "/admin/menu",
              icon: UtensilsCrossed,
              color: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200",
            },
            {
              label: "Add Category",
              href: "/admin/categories",
              icon: Tag,
              color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200",
            },
            {
              label: "Manage Tables",
              href: "/admin/tables",
              icon: Grid3X3,
              color: "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200",
            },
            {
              label: "Manage Floors",
              href: "/admin/floors",
              icon: Layers,
              color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200",
            },
            {
              label: "Manage Rooms",
              href: "/admin/rooms",
              icon: BedDouble,
              color: "bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-200",
            },
            {
              label: "View Bookings",
              href: "/admin/bookings",
              icon: CalendarDays,
              color: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-cyan-200",
            },
            {
              label: "Create Offer",
              href: "/admin/offers",
              icon: Percent,
              color: "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200",
            },
            {
              label: "Restaurant Settings",
              href: "/admin/settings",
              icon: Settings,
              color: "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200",
            },
            {
              label: "Audit Logs",
              href: "/admin/audit-logs",
              icon: ClipboardList,
              color: "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200",
            },
          ].map((action) => (
            <Link
              key={action.href}
              to={action.href}
              className={cn(
                "flex items-center gap-2.5 px-4 py-3",
                "rounded-xl border text-sm font-medium",
                "transition-all hover:scale-[1.02]",
                action.color,
              )}
            >
              <action.icon size={16} />
              {action.label}
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// Skeleton loader
const AdminDashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 w-64 bg-gray-200 rounded-xl" />
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
      ))}
    </div>
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
      ))}
    </div>
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 h-72 bg-gray-200 rounded-2xl" />
      <div className="h-72 bg-gray-200 rounded-2xl" />
    </div>
    <div className="grid grid-cols-2 gap-6">
      {[1, 2].map((i) => (
        <div key={i} className="h-64 bg-gray-200 rounded-2xl" />
      ))}
    </div>
  </div>
);

export default AdminDashboardPage;
