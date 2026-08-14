import { useState, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, RefreshCw, X, ChevronRight,
  Calendar, Clock, Users, Utensils, BedDouble,
  Phone, Mail, MapPin, Hash, Eye, LogIn, LogOut,
  Ban, CheckCircle, AlertCircle, Loader2, Filter,
  Building2, StickyNote,
} from "lucide-react";
import {
  bookingApi,
  type Booking,
  type BookingType,
  type BookingStatus,
  type TableAvailabilityResult,
  type RoomAvailabilityResult,
} from "@/api/booking.api";
import { adminApi, type AdminCustomer } from "@/api/admin.api";
import { floorApi } from "@/api/floor.api";
import { roomApi } from "@/api/room.api";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { cn } from "@/utils/cn";
import { getErrorMessage } from "@/utils/formatters";

// ─── Types ────────────────────────────────────────────────────────────────────
type ActiveTab = "TABLE" | "ROOM";
type ScopeTab = "ACTIVE" | "ALL";

const ACTIVE_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

function fmtTime(t: string) {
  if (!t) return "-";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>("TABLE");
  const [scope, setScope] = useState<ScopeTab>("ACTIVE");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [dateFilter, setDateFilter] = useState("");

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ─── Data ─────────────────────────────────────────────────────────────────
  const bookingsQuery = useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: async () => {
      const { data } = await bookingApi.listBookings({ limit: 500 });
      return data.data.bookings;
    },
    staleTime: 20_000,
  });

  const rows = useMemo(() => {
    const all = bookingsQuery.data ?? [];
    return all.filter((b) => {
      if (b.bookingType !== activeTab) return false;
      if (scope === "ACTIVE" && !ACTIVE_STATUSES.includes(b.status)) return false;
      if (statusFilter && b.status !== statusFilter) return false;
      if (dateFilter && !b.bookingDate.startsWith(dateFilter)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = [
          b.bookingNumber,
          b.customer?.fullName,
          b.customer?.phoneNumber,
          b.table?.tableNumber,
          b.table?.floor?.name,
          b.room?.roomNumber,
          b.room?.roomType,
        ].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [bookingsQuery.data, activeTab, scope, statusFilter, dateFilter, search]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "cancel" | "check-in" | "check-out" }) => {
      if (action === "cancel") return bookingApi.cancelBooking(id);
      if (action === "check-in") return bookingApi.checkIn(id);
      return bookingApi.checkOut(id);
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      const labels = { cancel: "Booking cancelled", "check-in": "Checked in", "check-out": "Checked out" };
      showToast("success", labels[action] + " successfully.");
      if (viewBooking) setViewBooking(null);
    },
    onError: (err) => showToast("error", getErrorMessage(err)),
  });

  const handleAction = (id: string, action: "cancel" | "check-in" | "check-out") => {
    const confirmMsg = action === "cancel"
      ? "Cancel this booking? This cannot be undone."
      : action === "check-in"
        ? "Check in this booking?"
        : "Check out this booking?";
    if (!window.confirm(confirmMsg)) return;
    actionMutation.mutate({ id, action });
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });

  // ─── Counts ───────────────────────────────────────────────────────────────
  const tableCounts = useMemo(() => {
    const t = (bookingsQuery.data ?? []).filter((b) => b.bookingType === "TABLE");
    return { active: t.filter((b) => ACTIVE_STATUSES.includes(b.status)).length, total: t.length };
  }, [bookingsQuery.data]);

  const roomCounts = useMemo(() => {
    const r = (bookingsQuery.data ?? []).filter((b) => b.bookingType === "ROOM");
    return { active: r.filter((b) => ACTIVE_STATUSES.includes(b.status)).length, total: r.length };
  }, [bookingsQuery.data]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={cn(
              "fixed right-6 top-20 z-[100] flex items-center gap-3 rounded-2xl px-5 py-3 shadow-lg",
              toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white",
            )}
          >
            {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">Manage table and room reservations for SAFNAM Restaurant</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={refresh}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition"
          >
            <RefreshCw size={15} className={bookingsQuery.isFetching ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Button
            leftIcon={<Plus size={16} />}
            onClick={() => setShowCreate(true)}
          >
            {activeTab === "TABLE" ? "Add Table Booking" : "Add Room Booking"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard icon={<Utensils size={20} className="text-emerald-600" />} label="Active Table Bookings" value={tableCounts.active} bg="bg-emerald-50" />
        <SummaryCard icon={<Utensils size={20} className="text-slate-500" />} label="Total Table Bookings" value={tableCounts.total} bg="bg-slate-50" />
        <SummaryCard icon={<BedDouble size={20} className="text-blue-600" />} label="Active Room Bookings" value={roomCounts.active} bg="bg-blue-50" />
        <SummaryCard icon={<BedDouble size={20} className="text-slate-500" />} label="Total Room Bookings" value={roomCounts.total} bg="bg-slate-50" />
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {/* Type Tabs */}
        <div className="border-b border-gray-100 px-6 pt-5">
          <div className="flex gap-1">
            <TypeTab
              active={activeTab === "TABLE"}
              onClick={() => { setActiveTab("TABLE"); setStatusFilter(""); setDateFilter(""); setSearch(""); }}
              icon={<Utensils size={15} />}
              label="Table Bookings"
              count={tableCounts.total}
            />
            <TypeTab
              active={activeTab === "ROOM"}
              onClick={() => { setActiveTab("ROOM"); setStatusFilter(""); setDateFilter(""); setSearch(""); }}
              icon={<BedDouble size={15} />}
              label="Room Bookings"
              count={roomCounts.total}
            />
          </div>
        </div>

        {/* Scope + Filters */}
        <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Scope Tabs */}
          <div className="flex gap-1">
            <ScopeTabBtn active={scope === "ACTIVE"} onClick={() => setScope("ACTIVE")} label="Active" />
            <ScopeTabBtn active={scope === "ALL"} onClick={() => setScope("ALL")} label="All Bookings" />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={activeTab === "TABLE" ? "Search booking, customer, table…" : "Search booking, customer, room…"}
                className="h-9 w-64 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Date filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 w-44 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              {dateFilter && (
                <button onClick={() => setDateFilter("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BookingStatus | "")}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          {bookingsQuery.isLoading ? (
            <LoadingSkeleton />
          ) : bookingsQuery.isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle size={36} className="text-red-400" />
              <p className="text-sm font-medium text-slate-700">Unable to load bookings</p>
              <p className="text-xs text-slate-500">{getErrorMessage(bookingsQuery.error)}</p>
              <Button variant="outline" size="sm" onClick={refresh}>Retry</Button>
            </div>
          ) : rows.length === 0 ? (
            <EmptyBookings
              type={activeTab}
              scope={scope}
              onAdd={() => setShowCreate(true)}
            />
          ) : activeTab === "TABLE" ? (
            <TableBookingTable
              rows={rows}
              onView={setViewBooking}
              onAction={handleAction}
              isMutating={actionMutation.isPending}
            />
          ) : (
            <RoomBookingTable
              rows={rows}
              onView={setViewBooking}
              onAction={handleAction}
              isMutating={actionMutation.isPending}
            />
          )}
        </div>

        {/* Row count footer */}
        {rows.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-3">
            <p className="text-xs text-slate-500">
              Showing <strong className="text-slate-700">{rows.length}</strong> {scope === "ACTIVE" ? "active" : ""} {activeTab.toLowerCase()} {rows.length === 1 ? "booking" : "bookings"}
            </p>
          </div>
        )}
      </div>

      {/* Create Booking Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateBookingModal
            defaultType={activeTab}
            onClose={() => setShowCreate(false)}
            onSuccess={(type) => {
              queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
              showToast("success", `${type === "TABLE" ? "Table" : "Room"} booking created successfully.`);
              setShowCreate(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
        {viewBooking && (
          <ViewBookingModal
            booking={viewBooking}
            onClose={() => setViewBooking(null)}
            onAction={handleAction}
            isMutating={actionMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <div className={cn("rounded-2xl p-4 flex items-center gap-3", bg, "border border-white/60")}>
      <div className="h-9 w-9 rounded-xl bg-white/70 flex items-center justify-center shadow-sm">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500 leading-tight">{label}</p>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function TypeTab({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-t-xl px-5 py-2.5 text-sm font-semibold transition border-b-2",
        active
          ? "border-emerald-600 text-emerald-700 bg-emerald-50"
          : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50",
      )}
    >
      {icon}
      {label}
      <span className={cn(
        "rounded-full px-1.5 py-0.5 text-xs font-bold",
        active ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600",
      )}>{count}</span>
    </button>
  );
}

function ScopeTabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl px-4 py-1.5 text-sm font-semibold transition",
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
      )}
    >
      {label}
    </button>
  );
}

// ─── Table Booking Table ──────────────────────────────────────────────────────
function TableBookingTable({
  rows, onView, onAction, isMutating,
}: {
  rows: Booking[];
  onView: (b: Booking) => void;
  onAction: (id: string, action: "cancel" | "check-in" | "check-out") => void;
  isMutating: boolean;
}) {
  return (
    <table className="w-full min-w-[900px] text-left text-sm">
      <thead>
        <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <th className="px-5 py-3 font-semibold rounded-l-none">Booking #</th>
          <th className="px-5 py-3 font-semibold">Customer</th>
          <th className="px-5 py-3 font-semibold">Table / Floor</th>
          <th className="px-5 py-3 font-semibold">Date</th>
          <th className="px-5 py-3 font-semibold">Time</th>
          <th className="px-5 py-3 font-semibold">Guests</th>
          <th className="px-5 py-3 font-semibold">Status</th>
          <th className="px-5 py-3 font-semibold text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((b) => (
          <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
            <td className="px-5 py-4">
              <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                {b.bookingNumber}
              </span>
            </td>
            <td className="px-5 py-4">
              <div>
                <p className="font-semibold text-slate-800">{b.customer?.fullName ?? "-"}</p>
                {b.customer?.phoneNumber && (
                  <p className="text-xs text-slate-500">{b.customer.phoneNumber}</p>
                )}
              </div>
            </td>
            <td className="px-5 py-4">
              {b.table ? (
                <div>
                  <p className="font-medium text-slate-800">Table {b.table.tableNumber}</p>
                  <p className="text-xs text-slate-500">{b.table.floor?.name ?? "-"} · Cap {b.table.capacity}</p>
                </div>
              ) : <span className="text-slate-400">-</span>}
            </td>
            <td className="px-5 py-4 text-slate-700">{fmtDate(b.bookingDate)}</td>
            <td className="px-5 py-4 text-slate-700 whitespace-nowrap">
              {fmtTime(b.startTime)} – {fmtTime(b.endTime)}
            </td>
            <td className="px-5 py-4 text-slate-700">{b.members}</td>
            <td className="px-5 py-4"><StatusChip status={b.status} /></td>
            <td className="px-5 py-4">
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => onView(b)}
                  className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center transition"
                  title="View details"
                >
                  <Eye size={14} />
                </button>
                {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                  <button
                    disabled={isMutating}
                    onClick={() => onAction(b.id, "check-in")}
                    className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                  >
                    <LogIn size={12} /> Check In
                  </button>
                )}
                {b.status === "CHECKED_IN" && (
                  <button
                    disabled={isMutating}
                    onClick={() => onAction(b.id, "check-out")}
                    className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition disabled:opacity-50"
                  >
                    <LogOut size={12} /> Check Out
                  </button>
                )}
                {!["CANCELLED", "COMPLETED", "NO_SHOW"].includes(b.status) && (
                  <button
                    disabled={isMutating}
                    onClick={() => onAction(b.id, "cancel")}
                    className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                  >
                    <Ban size={12} /> Cancel
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Room Booking Table ───────────────────────────────────────────────────────
function RoomBookingTable({
  rows, onView, onAction, isMutating,
}: {
  rows: Booking[];
  onView: (b: Booking) => void;
  onAction: (id: string, action: "cancel" | "check-in" | "check-out") => void;
  isMutating: boolean;
}) {
  return (
    <table className="w-full min-w-[900px] text-left text-sm">
      <thead>
        <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <th className="px-5 py-3 font-semibold">Booking #</th>
          <th className="px-5 py-3 font-semibold">Customer</th>
          <th className="px-5 py-3 font-semibold">Room</th>
          <th className="px-5 py-3 font-semibold">Check-in</th>
          <th className="px-5 py-3 font-semibold">Check-out</th>
          <th className="px-5 py-3 font-semibold">Guests</th>
          <th className="px-5 py-3 font-semibold">Status</th>
          <th className="px-5 py-3 font-semibold text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((b) => (
          <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
            <td className="px-5 py-4">
              <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg">
                {b.bookingNumber}
              </span>
            </td>
            <td className="px-5 py-4">
              <div>
                <p className="font-semibold text-slate-800">{b.customer?.fullName ?? "-"}</p>
                {b.customer?.phoneNumber && (
                  <p className="text-xs text-slate-500">{b.customer.phoneNumber}</p>
                )}
              </div>
            </td>
            <td className="px-5 py-4">
              {b.room ? (
                <div>
                  <p className="font-medium text-slate-800">Room {b.room.roomNumber}</p>
                  <p className="text-xs text-slate-500">{b.room.roomType} · Cap {b.room.capacity}</p>
                </div>
              ) : <span className="text-slate-400">-</span>}
            </td>
            <td className="px-5 py-4 text-slate-700">
              <p>{fmtDate(b.bookingDate)}</p>
              <p className="text-xs text-slate-500">{fmtTime(b.startTime)}</p>
            </td>
            <td className="px-5 py-4 text-slate-700">
              <p>{fmtDate(b.endAt)}</p>
              <p className="text-xs text-slate-500">{fmtTime(b.endTime)}</p>
            </td>
            <td className="px-5 py-4 text-slate-700">{b.members}</td>
            <td className="px-5 py-4"><StatusChip status={b.status} /></td>
            <td className="px-5 py-4">
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => onView(b)}
                  className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center transition"
                  title="View details"
                >
                  <Eye size={14} />
                </button>
                {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                  <button
                    disabled={isMutating}
                    onClick={() => onAction(b.id, "check-in")}
                    className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                  >
                    <LogIn size={12} /> Check In
                  </button>
                )}
                {b.status === "CHECKED_IN" && (
                  <button
                    disabled={isMutating}
                    onClick={() => onAction(b.id, "check-out")}
                    className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition disabled:opacity-50"
                  >
                    <LogOut size={12} /> Check Out
                  </button>
                )}
                {!["CANCELLED", "COMPLETED", "NO_SHOW"].includes(b.status) && (
                  <button
                    disabled={isMutating}
                    onClick={() => onAction(b.id, "cancel")}
                    className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                  >
                    <Ban size={12} /> Cancel
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-10 w-28 rounded-xl bg-slate-100" />
          <div className="h-10 flex-1 rounded-xl bg-slate-100" />
          <div className="h-10 w-32 rounded-xl bg-slate-100" />
          <div className="h-10 w-24 rounded-xl bg-slate-100" />
          <div className="h-10 w-20 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyBookings({ type, scope, onAdd }: { type: ActiveTab; scope: ScopeTab; onAdd: () => void }) {
  const icon = type === "TABLE" ? <Utensils size={40} className="text-slate-300" /> : <BedDouble size={40} className="text-slate-300" />;
  const label = type === "TABLE" ? "table" : "room";
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      {icon}
      <div>
        <p className="font-semibold text-slate-700">
          No {scope === "ACTIVE" ? "active " : ""}{label} bookings found
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {scope === "ACTIVE"
            ? `No active ${label} bookings right now.`
            : `No ${label} bookings match your current filters.`}
        </p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
      >
        <Plus size={16} />
        Add {type === "TABLE" ? "Table" : "Room"} Booking
      </button>
    </div>
  );
}

// ─── View Booking Modal ───────────────────────────────────────────────────────
function ViewBookingModal({
  booking, onClose, onAction, isMutating,
}: {
  booking: Booking;
  onClose: () => void;
  onAction: (id: string, action: "cancel" | "check-in" | "check-out") => void;
  isMutating: boolean;
}) {
  const isTable = booking.bookingType === "TABLE";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn(
          "px-6 py-5 border-b border-gray-100 flex items-start justify-between",
          isTable ? "bg-emerald-50" : "bg-blue-50",
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", isTable ? "bg-emerald-600" : "bg-blue-600")}>
              {isTable ? <Utensils size={18} className="text-white" /> : <BedDouble size={18} className="text-white" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {isTable ? "Table Booking" : "Room Booking"}
              </p>
              <p className="font-mono text-sm font-bold text-slate-800">{booking.bookingNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusChip status={booking.status} />
            <button onClick={onClose} className="h-8 w-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-slate-500 hover:bg-gray-50 transition">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Customer */}
          <Section title="Customer">
            <InfoRow icon={<Users size={14} />} label="Name" value={booking.customer?.fullName ?? "-"} />
            {booking.customer?.phoneNumber && (
              <InfoRow icon={<Phone size={14} />} label="Phone" value={booking.customer.phoneNumber} />
            )}
            {booking.customer?.email && (
              <InfoRow icon={<Mail size={14} />} label="Email" value={booking.customer.email} />
            )}
          </Section>

          {/* Resource */}
          <Section title={isTable ? "Table" : "Room"}>
            {isTable && booking.table ? (
              <>
                <InfoRow icon={<Utensils size={14} />} label="Table" value={`Table ${booking.table.tableNumber}`} />
                <InfoRow icon={<MapPin size={14} />} label="Floor" value={booking.table.floor?.name ?? "-"} />
                <InfoRow icon={<Users size={14} />} label="Capacity" value={`${booking.table.capacity} guests`} />
              </>
            ) : !isTable && booking.room ? (
              <>
                <InfoRow icon={<BedDouble size={14} />} label="Room" value={`Room ${booking.room.roomNumber}`} />
                <InfoRow icon={<Building2 size={14} />} label="Type" value={booking.room.roomType} />
                <InfoRow icon={<Users size={14} />} label="Capacity" value={`${booking.room.capacity} guests`} />
              </>
            ) : <p className="text-sm text-slate-400">No resource info</p>}
          </Section>

          {/* Schedule */}
          <Section title="Schedule">
            <InfoRow icon={<Calendar size={14} />} label="Date" value={fmtDate(booking.bookingDate)} />
            <InfoRow icon={<Clock size={14} />} label="Start" value={fmtTime(booking.startTime)} />
            <InfoRow icon={<Clock size={14} />} label="End" value={fmtTime(booking.endTime)} />
            <InfoRow icon={<Users size={14} />} label="Guests" value={`${booking.members}`} />
          </Section>

          {/* Timeline */}
          <Section title="Timeline">
            <InfoRow icon={<Hash size={14} />} label="Source" value={booking.source.replace("_", " ")} />
            <InfoRow icon={<Calendar size={14} />} label="Created" value={fmtDate(booking.createdAt)} />
            {booking.checkedInAt && <InfoRow icon={<LogIn size={14} />} label="Checked In" value={fmtDate(booking.checkedInAt)} />}
            {booking.checkedOutAt && <InfoRow icon={<LogOut size={14} />} label="Checked Out" value={fmtDate(booking.checkedOutAt)} />}
            {booking.cancelledAt && <InfoRow icon={<Ban size={14} />} label="Cancelled" value={fmtDate(booking.cancelledAt)} />}
          </Section>

          {booking.notes && (
            <Section title="Notes">
              <p className="text-sm text-slate-600">{booking.notes}</p>
            </Section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-2 bg-slate-50/50">
          <button onClick={onClose} className="text-sm font-medium text-slate-600 hover:text-slate-800 transition">
            Close
          </button>
          <div className="flex gap-2">
            {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
              <Button
                size="sm"
                variant="primary"
                disabled={isMutating}
                leftIcon={<LogIn size={14} />}
                onClick={() => { onAction(booking.id, "check-in"); }}
              >
                Check In
              </Button>
            )}
            {booking.status === "CHECKED_IN" && (
              <Button
                size="sm"
                variant="secondary"
                disabled={isMutating}
                leftIcon={<LogOut size={14} />}
                onClick={() => { onAction(booking.id, "check-out"); }}
              >
                Check Out
              </Button>
            )}
            {!["CANCELLED", "COMPLETED", "NO_SHOW"].includes(booking.status) && (
              <Button
                size="sm"
                variant="danger"
                disabled={isMutating}
                leftIcon={<Ban size={14} />}
                onClick={() => { onAction(booking.id, "cancel"); }}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Section / InfoRow helpers ────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 space-y-2">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-400 w-4 flex-shrink-0">{icon}</span>
      <span className="text-slate-500 w-20 flex-shrink-0">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

// ─── Create Booking Modal ─────────────────────────────────────────────────────
type CreateBookingForm = {
  bookingType: BookingType;
  customerId: string;
  floorId: string;
  resourceId: string;
  date: string;
  startTime: string;
  endTime: string;
  members: string;
  notes: string;
};

const emptyForm = (type: BookingType): CreateBookingForm => ({
  bookingType: type,
  customerId: "",
  floorId: "",
  resourceId: "",
  date: todayStr(),
  startTime: "19:00",
  endTime: "20:00",
  members: "2",
  notes: "",
});

function CreateBookingModal({
  defaultType,
  onClose,
  onSuccess,
}: {
  defaultType: BookingType;
  onClose: () => void;
  onSuccess: (type: BookingType) => void;
}) {
  const [form, setForm] = useState<CreateBookingForm>(emptyForm(defaultType));
  const [formError, setFormError] = useState("");

  const set = <K extends keyof CreateBookingForm>(key: K, val: CreateBookingForm[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  // ─── Data queries ─────────────────────────────────────────────────────────
  const customersQuery = useQuery({
    queryKey: ["admin", "customers", "select"],
    queryFn: async () => {
      const { data } = await adminApi.customers.list({ limit: 100 });
      return data.data.customers;
    },
    staleTime: 60_000,
  });

  const floorsQuery = useQuery({
    queryKey: ["admin", "floors", "select"],
    queryFn: async () => {
      const { data } = await floorApi.getFloors();
      return (data as { data: { floors: Array<{ id: string; name: string; status?: string }> } }).data.floors;
    },
    staleTime: 60_000,
    enabled: form.bookingType === "TABLE",
  });

  const availabilityReady =
    Boolean(form.date) &&
    Boolean(form.startTime) &&
    Boolean(form.endTime) &&
    Number(form.members) > 0 &&
    form.startTime < form.endTime;

  const tableAvailQuery = useQuery({
    queryKey: ["booking-avail-tables", form.date, form.startTime, form.endTime, form.members, form.floorId],
    enabled: form.bookingType === "TABLE" && availabilityReady,
    queryFn: async () => {
      const { data } = await bookingApi.getAvailableTables({
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        members: Number(form.members),
        floorId: form.floorId || undefined,
      });
      return data.data.tables;
    },
  });

  const roomAvailQuery = useQuery({
    queryKey: ["booking-avail-rooms", form.date, form.startTime, form.endTime, form.members],
    enabled: form.bookingType === "ROOM" && availabilityReady,
    queryFn: async () => {
      const { data } = await bookingApi.getAvailableRooms({
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        members: Number(form.members),
      });
      return data.data.rooms;
    },
  });

  const availItems = form.bookingType === "TABLE"
    ? (tableAvailQuery.data ?? [])
    : (roomAvailQuery.data ?? []);

  const availLoading = form.bookingType === "TABLE"
    ? tableAvailQuery.isFetching
    : roomAvailQuery.isFetching;

  // ─── Create mutation ──────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () => {
      setFormError("");
      if (!form.customerId) throw new Error("Customer is required");
      if (!form.resourceId) throw new Error(`${form.bookingType === "TABLE" ? "Table" : "Room"} is required`);
      if (!form.date) throw new Error("Date is required");
      if (!form.startTime || !form.endTime) throw new Error("Start and end time are required");
      if (form.startTime >= form.endTime) throw new Error("End time must be after start time");
      if (Number(form.members) < 1) throw new Error("At least 1 guest is required");

      return bookingApi.createBooking({
        bookingType: form.bookingType,
        customerId: form.customerId,
        tableId: form.bookingType === "TABLE" ? form.resourceId : undefined,
        roomId: form.bookingType === "ROOM" ? form.resourceId : undefined,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        members: Number(form.members),
        notes: form.notes.trim() || undefined,
        source: "ADMIN",
      });
    },
    onSuccess: () => onSuccess(form.bookingType),
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const availableItems = availItems.filter((i) => (i as TableAvailabilityResult | RoomAvailabilityResult).available);
  const isTable = form.bookingType === "TABLE";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", isTable ? "bg-emerald-600" : "bg-blue-600")}>
              {isTable ? <Utensils size={16} className="text-white" /> : <BedDouble size={16} className="text-white" />}
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Add {isTable ? "Table" : "Room"} Booking
            </h2>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-xl border border-gray-200 flex items-center justify-center text-slate-500 hover:bg-gray-50 transition">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Error */}
          {formError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          )}

          {/* Booking Type */}
          <FormField label="Booking Type">
            <div className="grid grid-cols-2 gap-2">
              {(["TABLE", "ROOM"] as BookingType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...emptyForm(t) })}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                    form.bookingType === t
                      ? t === "TABLE" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {t === "TABLE" ? <Utensils size={15} /> : <BedDouble size={15} />}
                  {t === "TABLE" ? "Table Booking" : "Room Booking"}
                </button>
              ))}
            </div>
          </FormField>

          {/* Customer */}
          <FormField label="Customer *">
            {customersQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={14} className="animate-spin" /> Loading customers…</div>
            ) : (
              <select
                value={form.customerId}
                onChange={(e) => set("customerId", e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="">Select customer</option>
                {(customersQuery.data ?? []).map((c: AdminCustomer) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} · {c.phoneNumber}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          {/* Date + Times */}
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Date *">
              <input
                type="date"
                value={form.date}
                onChange={(e) => { set("date", e.target.value); set("resourceId", ""); }}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </FormField>
            <FormField label="Start Time *">
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => { set("startTime", e.target.value); set("resourceId", ""); }}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </FormField>
            <FormField label="End Time *">
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => { set("endTime", e.target.value); set("resourceId", ""); }}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </FormField>
          </div>

          {/* Guests */}
          <FormField label="Number of Guests *">
            <input
              type="number"
              min={1}
              value={form.members}
              onChange={(e) => { set("members", e.target.value); set("resourceId", ""); }}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </FormField>

          {/* Floor (table only) */}
          {isTable && (
            <FormField label="Filter by Floor">
              {floorsQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={14} className="animate-spin" /> Loading floors…</div>
              ) : (
                <select
                  value={form.floorId}
                  onChange={(e) => { set("floorId", e.target.value); set("resourceId", ""); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="">All floors</option>
                  {(floorsQuery.data ?? [])
                    .filter((f: { id: string; name: string; status?: string }) => f.status !== "INACTIVE")
                    .map((f: { id: string; name: string }) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
              )}
            </FormField>
          )}

          {/* Resource Selector */}
          <FormField label={isTable ? "Select Available Table *" : "Select Available Room *"}>
            {!availabilityReady ? (
              <p className="text-xs text-slate-400 bg-slate-50 rounded-xl px-3 py-2">
                Fill in date, start time, end time and guests to see availability.
              </p>
            ) : availLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-xl px-3 py-2">
                <Loader2 size={14} className="animate-spin" /> Checking availability…
              </div>
            ) : availItems.length === 0 ? (
              <p className="text-xs text-slate-400 bg-slate-50 rounded-xl px-3 py-2">
                No {isTable ? "tables" : "rooms"} found for these dates.
              </p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {availItems.map((item) => {
                  const avail = item as TableAvailabilityResult | RoomAvailabilityResult;
                  const resource = avail.resource;
                  const id = resource.id;
                  const isAvail = avail.available;
                  const label = isTable
                    ? `Table ${(resource as TableAvailabilityResult["resource"]).tableNumber} · ${(resource as TableAvailabilityResult["resource"]).floor?.name ?? "Floor"} · Capacity ${resource.capacity}`
                    : `Room ${(resource as RoomAvailabilityResult["resource"]).roomNumber} · ${(resource as RoomAvailabilityResult["resource"]).roomType} · Capacity ${resource.capacity}`;
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={!isAvail}
                      onClick={() => isAvail && set("resourceId", id)}
                      className={cn(
                        "w-full rounded-xl border px-4 py-2.5 text-sm text-left transition",
                        form.resourceId === id
                          ? isTable ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold" : "border-blue-500 bg-blue-50 text-blue-800 font-semibold"
                          : isAvail
                            ? "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                            : "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{label}</span>
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          avail.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" :
                            avail.status === "RESERVED" ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-600"
                        )}>
                          {avail.status}
                        </span>
                      </div>
                      {!isAvail && avail.reason && (
                        <p className="mt-0.5 text-xs text-slate-400">{avail.reason}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </FormField>

          {/* Notes */}
          <FormField label="Notes (optional)">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Any special requests or notes…"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </FormField>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
          <button onClick={onClose} className="text-sm font-medium text-slate-600 hover:text-slate-800 transition">
            Cancel
          </button>
          <Button
            loading={createMutation.isPending}
            disabled={createMutation.isPending || !form.resourceId || !form.customerId}
            onClick={() => createMutation.mutate()}
            leftIcon={<Plus size={16} />}
          >
            Create Booking
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
