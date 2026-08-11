import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, CreditCard, LogOut, Users } from "lucide-react";
import { dashboardApi } from "@/api/dashboard.api";
import type { ReceptionDashboard, Table } from "@/types/dashboard.types";
import { DashboardError, DashboardSkeleton, RefreshLine, StatCard, StatusPill } from "@/features/dashboard/DashboardShared";
import { cn } from "@/utils/cn";

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } };

export default function ReceptionDashboardPage() {
  const query = useQuery({
    queryKey: ["reception-dashboard"],
    queryFn: async () => (await dashboardApi.getReceptionDashboard()).data.data.dashboard,
    refetchInterval: 15000,
  });

  if (query.isLoading) return <DashboardSkeleton />;
  if (query.isError || !query.data) return <DashboardError onRetry={() => void query.refetch()} />;

  const dashboard: ReceptionDashboard = query.data;
  const tableBuckets = useMemo(() => bucketTables(dashboard.tableStatus), [dashboard.tableStatus]);

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <RefreshLine generatedAt={dashboard.generatedAt} isFetching={query.isFetching} onRefresh={() => void query.refetch()} />
        <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
          <StatCard label="Today's Bookings" value={dashboard.stats.todayBookings} sub={`${dashboard.stats.todayCheckIns} checked in`} icon={<CalendarDays className="h-5 w-5" />} tone="blue" />
          <StatCard label="Current Customers" value={dashboard.stats.currentCustomers} sub="In restaurant now" icon={<Users className="h-5 w-5" />} />
          <StatCard label="Pending Payments" value={dashboard.stats.pendingPayments} sub={`${dashboard.stats.pendingInvoices} invoices`} icon={<CreditCard className="h-5 w-5" />} tone="amber" />
          <StatCard label="Today's Checkouts" value={dashboard.stats.todayCheckouts} sub="Completed today" icon={<LogOut className="h-5 w-5" />} tone="gray" />
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-3">
          <motion.section variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 xl:col-span-2">
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Today's Bookings</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-500">
                  <tr>
                    <th className="py-2">Time</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Table/Room</th>
                    <th>Guests</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.todayBookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="py-3">{booking.startTime ?? "-"}</td>
                      <td className="font-medium text-gray-900 dark:text-white">{booking.customerName ?? "Guest"}</td>
                      <td>{booking.bookingType ?? "-"}</td>
                      <td>{booking.tableNumber ?? booking.roomNumber ?? "-"}</td>
                      <td>{booking.members ?? booking.guests ?? "-"}</td>
                      <td><StatusPill status={booking.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          <motion.section variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Tables</h2>
            <div className="grid grid-cols-4 gap-2">
              {dashboard.tableStatus.map((table) => (
                <div key={table.id} className={cn("rounded-xl border p-3 text-center text-xs font-bold", tableTone(table.status))}>
                  {table.tableNumber}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
              <span>Available {tableBuckets.AVAILABLE ?? 0}</span>
              <span>Occupied {tableBuckets.OCCUPIED ?? 0}</span>
              <span>Reserved {tableBuckets.RESERVED ?? 0}</span>
              <span>Cleaning {tableBuckets.CLEANING ?? 0}</span>
            </div>
          </motion.section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Recent Activities" items={dashboard.recentActivities.map((activity) => `${activity.type}: ${activity.title ?? "-"} - ${activity.status ?? "-"}`)} />
          <Panel title="Room Status" items={dashboard.roomStatus.map((room) => `${room.roomNumber} - ${room.status}`)} />
          <Panel title="Current Customers" items={dashboard.currentCustomers.map((customer) => `${customer.fullName ?? customer.name ?? "Guest"} - ${customer.tableNumber ?? customer.roomNumber ?? "-"}`)} />
          <Panel title="Pending Payments" items={dashboard.pendingPaymentsList.map((payment) => `${payment.paymentNumber ?? payment.id} - ${payment.status ?? "-"}`)} />
        </div>
      </div>
    </motion.div>
  );
}

function bucketTables(tables: Table[]) {
  return tables.reduce<Record<string, number>>((acc, table) => ({ ...acc, [table.status]: (acc[table.status] ?? 0) + 1 }), {});
}

function tableTone(status: string) {
  if (status === "AVAILABLE") return "border-emerald-300 bg-emerald-100 text-emerald-800";
  if (status === "OCCUPIED") return "border-red-300 bg-red-100 text-red-800";
  if (status === "RESERVED") return "border-blue-300 bg-blue-100 text-blue-800";
  return "border-yellow-300 bg-yellow-100 text-yellow-800";
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
      <div className="space-y-3">
        {items.length ? items.slice(0, 10).map((entry) => <div key={entry} className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">{entry}</div>) : <p className="text-sm text-gray-500">No records.</p>}
      </div>
    </section>
  );
}
