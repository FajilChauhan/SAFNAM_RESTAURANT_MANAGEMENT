import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, CreditCard, LogOut, Users, BedDouble, ArrowRight, Clock } from "lucide-react";
import { dashboardApi } from "@/api/dashboard.api";
import type { Table } from "@/types/dashboard.types";
import { DashboardError, DashboardSkeleton, StatusPill, formatMoney } from "@/features/dashboard/DashboardShared";
import { cn } from "@/utils/cn";

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } };

export default function ReceptionDashboardPage() {
  const query = useQuery({
    queryKey: ["reception-dashboard"],
    queryFn: async () => (await dashboardApi.getReceptionDashboard()).data.data.dashboard,
    refetchInterval: 15000,
  });

  const dashboard = query.data;
  const tableBuckets = useMemo(() => bucketTables(dashboard?.tableStatus ?? []), [dashboard?.tableStatus]);

  if (query.isLoading) return <DashboardSkeleton columns={4} />;
  if (query.isError || !dashboard) return <DashboardError onRetry={() => void query.refetch()} />;

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reception Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · Live operational view
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs text-gray-400 shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Auto-refresh 15s
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Today's Bookings" value={dashboard.stats.todayBookings} sub={`${dashboard.stats.todayCheckIns} checked in`} icon={<CalendarDays size={20} />} tone="blue" />
        <StatCard label="Current Guests" value={dashboard.stats.currentCustomers} sub="In restaurant now" icon={<Users size={20} />} tone="emerald" />
        <StatCard label="Pending Payments" value={dashboard.stats.pendingPayments} sub={`${dashboard.stats.pendingInvoices} invoices`} icon={<CreditCard size={20} />} tone="amber" />
        <StatCard label="Today's Checkouts" value={dashboard.stats.todayCheckouts} sub="Completed today" icon={<LogOut size={20} />} tone="gray" />
      </motion.div>

      {/* Bookings Table + Tables Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        <motion.div variants={item} className="xl:col-span-2 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Bookings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 pb-3 pt-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Time</th>
                  <th className="px-3 pb-3 pt-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Customer</th>
                  <th className="px-3 pb-3 pt-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Type</th>
                  <th className="px-3 pb-3 pt-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Location</th>
                  <th className="px-3 pb-3 pt-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Guests</th>
                  <th className="px-5 pb-3 pt-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dashboard.todayBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">No bookings today.</td>
                  </tr>
                ) : (
                  dashboard.todayBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-600">{booking.startTime ?? "-"}</td>
                      <td className="px-3 py-3.5 text-sm font-medium text-gray-900">{booking.customerName ?? "Guest"}</td>
                      <td className="px-3 py-3.5">
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", booking.bookingType === "ROOM" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700")}>
                          {booking.bookingType ?? "-"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-sm text-gray-600">{booking.tableNumber ?? booking.roomNumber ?? "-"}</td>
                      <td className="px-3 py-3.5 text-sm text-gray-600">{booking.members ?? booking.guests ?? "-"}</td>
                      <td className="px-5 py-3.5"><StatusPill status={booking.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Tables Grid */}
        <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Tables</h2>
          <div className="grid grid-cols-4 gap-1.5">
            {dashboard.tableStatus.map((table) => (
              <div
                key={table.id}
                title={`${table.tableNumber} — ${table.status}`}
                className={cn(
                  "rounded-xl border-2 p-2 text-center text-xs font-bold transition-all hover:scale-105 cursor-pointer",
                  tableTone(table.status)
                )}
              >
                {table.tableNumber}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            {[
              { label: "Available", color: "bg-emerald-500", count: tableBuckets.AVAILABLE ?? 0 },
              { label: "Occupied", color: "bg-red-500", count: tableBuckets.OCCUPIED ?? 0 },
              { label: "Reserved", color: "bg-blue-500", count: tableBuckets.RESERVED ?? 0 },
              { label: "Cleaning", color: "bg-yellow-500", count: tableBuckets.CLEANING ?? 0 },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 text-gray-500">
                <div className={cn("h-2 w-2 rounded-full", l.color)} />
                {l.label} ({l.count})
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Room Status + Current Customers + Recent Activities + Pending Payments */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Room Status */}
        <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Room Status</h2>
          {dashboard.roomStatus.length === 0 ? (
            <p className="text-sm text-gray-400">No rooms configured.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {dashboard.roomStatus.map((room) => (
                <div
                  key={room.id}
                  className={cn(
                    "rounded-xl border-2 p-3 text-center transition-all hover:scale-105 cursor-pointer",
                    room.status === "AVAILABLE" && "border-emerald-200 bg-emerald-50",
                    room.status === "OCCUPIED" && "border-red-200 bg-red-50",
                    room.status === "RESERVED" && "border-blue-200 bg-blue-50",
                    room.status === "MAINTENANCE" && "border-yellow-200 bg-yellow-50",
                    !["AVAILABLE","OCCUPIED","RESERVED","MAINTENANCE"].includes(room.status) && "border-gray-200 bg-gray-50"
                  )}
                >
                  <p className="text-sm font-bold text-gray-900">{room.roomNumber}</p>
                  <p className="mt-0.5 text-[10px] font-medium text-gray-500">{room.status}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Current Customers */}
        <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Current Customers</h2>
          {dashboard.currentCustomers.length === 0 ? (
            <p className="text-sm text-gray-400">No customers in restaurant right now.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {dashboard.currentCustomers.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                      <span className="text-xs font-bold text-emerald-700">
                        {(c.fullName ?? c.name ?? "G").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.fullName ?? c.name ?? "Guest"}</p>
                      <p className="text-xs text-gray-400">{c.tableNumber ?? c.roomNumber ?? "-"}</p>
                    </div>
                  </div>
                  {c.checkedInAt && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={11} />
                      {new Date(c.checkedInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Activities */}
        <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Activities</h2>
          {dashboard.recentActivities.length === 0 ? (
            <p className="text-sm text-gray-400">No recent activity.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {dashboard.recentActivities.slice(0, 10).map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <ArrowRight size={12} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.title ?? activity.type}</p>
                    {activity.status && <StatusPill status={activity.status} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pending Payments */}
        <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Pending Payments</h2>
          {dashboard.pendingPaymentsList.length === 0 ? (
            <p className="text-sm text-gray-400">No pending payments.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {dashboard.pendingPaymentsList.slice(0, 10).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5 hover:bg-amber-100 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{payment.paymentNumber ?? payment.id.slice(-8)}</p>
                    <p className="text-xs text-gray-400">{payment.method ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatMoney(payment.amount)}</p>
                    <StatusPill status={payment.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

function bucketTables(tables: Table[]) {
  return tables.reduce<Record<string, number>>(
    (acc, table) => ({ ...acc, [table.status]: (acc[table.status] ?? 0) + 1 }),
    {}
  );
}

function tableTone(status: string) {
  if (status === "AVAILABLE") return "border-emerald-300 bg-emerald-100 text-emerald-800";
  if (status === "OCCUPIED") return "border-red-300 bg-red-100 text-red-800";
  if (status === "RESERVED") return "border-blue-300 bg-blue-100 text-blue-800";
  return "border-yellow-300 bg-yellow-100 text-yellow-800";
}

function StatCard({
  label, value, sub, icon, tone = "emerald"
}: {
  label: string; value: React.ReactNode; sub?: string; icon: React.ReactNode;
  tone?: "emerald" | "amber" | "blue" | "purple" | "red" | "gray";
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
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </motion.div>
  );
}
