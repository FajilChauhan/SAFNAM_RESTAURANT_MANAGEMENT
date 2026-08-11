import { useMemo } from "react";
import { BarChart3, CalendarDays, Database, Plus, ShieldCheck, ShoppingBag, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui";
import { getErrorMessage } from "@/utils/formatters";
import { dashboardApi } from "@/api/dashboard.api";
import type { AdminDashboard } from "@/types/dashboard.types";
import { RevenueChart } from "../components/RevenueChart";
import { OrdersChart } from "../components/OrdersChart";
import { StatCard } from "../components/StatCard";
import { formatMoney } from "@/features/dashboard/DashboardShared";

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => (await dashboardApi.getAdminDashboard()).data.data.dashboard,
    refetchInterval: 30000,
  });

  const dashboard = dashboardQuery.data as AdminDashboard | undefined;
  const stats = useMemo(
    () => [
      { label: "Today's Revenue", value: formatMoney(dashboard?.stats.todayRevenue), icon: BarChart3 },
      { label: "Today's Orders", value: String(dashboard?.stats.todayOrders ?? 0), icon: ShoppingBag },
      { label: "Today's Bookings", value: String(dashboard?.stats.todayBookings ?? 0), icon: CalendarDays },
      { label: "Total Customers", value: String(dashboard?.stats.totalCustomers ?? 0), icon: Users },
    ],
    [dashboard],
  );
  const orderBreakdown = useMemo(() => {
    const items = dashboard?.orderBreakdown ?? [];
    const total = items.reduce((sum, point) => sum + point.value, 0);
    const colors = ["bg-amber-500", "bg-blue-500", "bg-emerald-500", "bg-slate-500", "bg-red-500"];

    return items.map((point, index) => ({
      label: point.label,
      value: total ? Math.round((point.value / total) * 100) : 0,
      className: colors[index % colors.length],
    }));
  }, [dashboard?.orderBreakdown]);

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Dashboard" subtitle="Restaurant wide performance overview" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (dashboardQuery.isError || !dashboard) {
    return <EmptyState title="Dashboard unavailable" description={getErrorMessage(dashboardQuery.error)} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="Restaurant wide performance overview" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart points={dashboard.revenueChart} />
        </div>
        <OrdersChart items={orderBreakdown} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Bookings</h3>
            <button className="text-sm text-emerald-700 hover:underline" onClick={() => navigate("/admin/bookings")}>View All</button>
          </div>
          {!dashboard.recentBookings.length ? (
            <EmptyState title="No recent bookings" description="Recent bookings will appear here once guests start reserving tables or rooms." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-2">Customer</th>
                    <th>Table/Room</th>
                    <th>Date</th>
                    <th>Guests</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="py-3 font-medium">{booking.customerName ?? "Guest"}</td>
                      <td>{booking.tableNumber ?? booking.roomNumber ?? "-"}</td>
                      <td>{booking.startAt ?? booking.bookingDate ?? "-"}</td>
                      <td>{booking.members ?? booking.guests ?? "-"}</td>
                      <td>{booking.status ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Top Selling Items</h3>
          {!dashboard.topSellingFoods.length ? (
            <EmptyState title="No order data" description="Top selling foods will appear after orders are completed." />
          ) : (
            <div className="space-y-4">
              {dashboard.topSellingFoods.slice(0, 6).map((item, index) => (
                <div key={item.menuItemId ?? item.name} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{index + 1}. {item.name}</p>
                    <p className="text-slate-500">{item.quantity ?? 0} orders</p>
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{formatMoney(item.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Employee Stats</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Mini label="Total Staff" value={dashboard.employeeStats.total} />
            <Mini label="Managers" value={dashboard.employeeStats.managers} />
            <Mini label="Reception" value={dashboard.employeeStats.reception} />
            <Mini label="Kitchen" value={dashboard.employeeStats.kitchen} />
          </div>
          <button className="mt-4 text-sm font-semibold text-emerald-700 hover:underline" onClick={() => navigate("/admin/employees")}>Manage Employees</button>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">System Health</h3>
          </div>
          <div className="space-y-3 text-sm">
            <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />{dashboard.systemHealth.status}</p>
            <p>DB Status: {dashboard.systemHealth.dbStatus}</p>
            <p>Uptime: {dashboard.systemHealth.uptime}s</p>
            <p>Last backup: {dashboard.systemHealth.lastBackup}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Manage Employees", "/admin/employees"],
            ["Restaurant Settings", "/admin/settings"],
            ["Add Menu Item", "/admin/menu"],
            ["Audit Logs", "/admin/audit-logs"],
            ["Manage Tables", "/admin/tables"],
            ["Manage Rooms", "/admin/rooms"],
            ["Manage Categories", "/admin/categories"],
            ["View Bookings", "/admin/bookings"],
          ].map(([label, path]) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="rounded-2xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-gray-800 dark:text-slate-200 dark:hover:bg-emerald-500/10"
            >
              <span className="flex items-center gap-2"><Plus size={16} /> {label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
