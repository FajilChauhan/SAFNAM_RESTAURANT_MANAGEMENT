import { useMemo } from "react";
import { BarChart3, CalendarDays, ShoppingBag, Users, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui";
import { formatCurrency, getErrorMessage } from "@/utils/formatters";
import { biApi } from "@/api/bi.api";
import { bookingApi } from "@/api/booking.api";
import { menuApi } from "@/api/menu.api";
import { RevenueChart } from "../components/RevenueChart";
import { OrdersChart } from "../components/OrdersChart";
import { StatCard } from "../components/StatCard";

type DashboardData = {
  todayRevenue?: number;
  todayOrders?: number;
  activeBookings?: number;
  totalCustomers?: number;
  recentBookings?: Array<{
    id: string;
    customerName?: string;
    tableOrRoom?: string;
    date?: string;
    time?: string;
    guests?: number;
    status?: string;
  }>;
  revenueChart?: Array<{ label: string; value: number }>;
  orderBreakdown?: Array<{ label: string; value: number; className: string }>;
};

type MenuItemRow = {
  id: string;
  name: string;
  category?: { name: string };
  price?: number;
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => (await biApi.dashboard()).data.data as DashboardData,
    refetchInterval: 30000,
  });
  const bookingsQuery = useQuery({
    queryKey: ["admin-recent-bookings"],
    queryFn: async () => (await bookingApi.getAllBookings()).data.data as DashboardData["recentBookings"],
  });
  const menuItemsQuery = useQuery({
    queryKey: ["admin-top-items"],
    queryFn: async () => (await menuApi.getItems()).data.data as MenuItemRow[],
  });

  const dashboard = dashboardQuery.data;
  const stats = useMemo(
    () => [
      { label: "Today's Revenue", value: formatCurrency(dashboard?.todayRevenue ?? 0), icon: BarChart3 },
      { label: "Today's Orders", value: String(dashboard?.todayOrders ?? 0), icon: ShoppingBag },
      { label: "Active Bookings", value: String(dashboard?.activeBookings ?? 0), icon: CalendarDays },
      { label: "Total Customers", value: String(dashboard?.totalCustomers ?? 0), icon: Users },
    ],
    [dashboard],
  );

  const recentBookings = dashboard?.recentBookings ?? bookingsQuery.data ?? [];
  const topItems = menuItemsQuery.data ?? [];

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

  if (dashboardQuery.isError) {
    return (
      <EmptyState
        title="Dashboard unavailable"
        description={getErrorMessage(dashboardQuery.error)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="Restaurant wide performance overview" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart points={dashboard?.revenueChart} />
        </div>
        <OrdersChart items={dashboard?.orderBreakdown} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Bookings</h3>
            <button className="text-sm text-emerald-700 hover:underline" onClick={() => navigate("/admin/bookings")}>View All</button>
          </div>
          {!recentBookings.length ? (
            <EmptyState title="No recent bookings" description="Recent bookings will appear here once guests start reserving tables or rooms." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-2">Customer</th>
                    <th>Table/Room</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Guests</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="py-3 font-medium">{booking.customerName ?? "Guest"}</td>
                      <td>{booking.tableOrRoom ?? "-"}</td>
                      <td>{booking.date ?? "-"}</td>
                      <td>{booking.time ?? "-"}</td>
                      <td>{booking.guests ?? "-"}</td>
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
          {!topItems.length ? (
            <EmptyState title="No menu items" description="Menu items will appear here once the menu module returns records." />
          ) : (
            <div className="space-y-4">
              {topItems.slice(0, 6).map((item, index) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{index + 1}. {item.name}</p>
                      <p className="text-slate-500">{item.category?.name ?? "Category"}</p>
                    </div>
                    <div className="text-right text-slate-500">
                      <p>{formatCurrency(item.price ?? 0)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Add Employee", "/admin/employees"],
            ["Add Menu Item", "/admin/menu/items"],
            ["Add Table", "/admin/tables"],
            ["Add Room", "/admin/rooms"],
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

