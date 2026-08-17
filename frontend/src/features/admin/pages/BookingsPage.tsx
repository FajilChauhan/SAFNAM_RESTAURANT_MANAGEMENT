import { useState, useMemo, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, RefreshCw, X, ChevronRight,
  Calendar, Clock, Users, Utensils, BedDouble,
  Phone, Mail, MapPin, Hash, Eye, LogIn, LogOut,
  Ban, CheckCircle, AlertCircle, Loader2, Filter,
  Building2, StickyNote, CreditCard, Receipt, FileText, ShieldAlert, Edit2, Check
} from "lucide-react";
import {
  bookingApi,
  type Booking,
  type BookingType,
  type BookingStatus,
  type TableAvailabilityResult,
  type RoomAvailabilityResult,
} from "@/api/booking.api";
import { adminApi, type AdminCustomer, type AdminOffer } from "@/api/admin.api";
import { floorApi } from "@/api/floor.api";
import { roomApi } from "@/api/room.api";
import { invoiceApi } from "@/api/invoice.api";
import { paymentApi } from "@/api/payment.api";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { cn } from "@/utils/cn";
import { formatCurrency, getErrorMessage } from "@/utils/formatters";
import { toast as toastNotification } from "@/utils/toast";

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

function getBookingDisplayTotal(booking: Booking) {
  if (booking.invoice && Number(booking.invoice.grandTotal) > 0) {
    return Number(booking.invoice.grandTotal);
  }

  if (booking.bookingType === "ROOM") {
    const roomPricePerDay = Number(booking.room?.pricePerDay ?? 0);
    if (!roomPricePerDay || !booking.bookingDate || !booking.endAt) return 0;

    const checkInDate = new Date(booking.bookingDate);
    const checkOutDate = new Date(booking.endAt);
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const roomDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    return roomPricePerDay * roomDays;
  }

  if (booking.invoice) {
    return Number(booking.invoice.grandTotal ?? 0);
  }

  return 0;
}

// Helper to mask Aadhaar: XXXX-XXXX-1234
function maskAadhaar(aadhaar: string | null | undefined) {
  if (!aadhaar) return "—";
  if (aadhaar.length < 4) return aadhaar;
  return `XXXX-XXXX-${aadhaar.slice(-4)}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>("TABLE");
  const [scope, setScope] = useState<ScopeTab>("ACTIVE");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState("");

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [viewBookingId, setViewBookingId] = useState<string | null>(null);

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
    staleTime: 10_000,
  });

  const rows = useMemo(() => {
    const all = bookingsQuery.data ?? [];
    return all.filter((b) => {
      if (b.bookingType !== activeTab) return false;
      if (scope === "ACTIVE" && !ACTIVE_STATUSES.includes(b.status)) return false;
      if (statusFilter && b.status !== statusFilter) return false;
      if (paymentFilter) {
        const invStatus = b.invoice?.status ?? "PENDING";
        if (paymentFilter === "PAID" && invStatus !== "PAID") return false;
        if (paymentFilter === "PENDING" && invStatus === "PAID") return false;
        if (paymentFilter === "CANCELLED" && invStatus !== "CANCELLED") return false;
      }
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
  }, [bookingsQuery.data, activeTab, scope, statusFilter, paymentFilter, dateFilter, search]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "cancel" | "check-in" | "check-out" }) => {
      if (action === "cancel") return bookingApi.cancelBooking(id);
      if (action === "check-in") return bookingApi.checkIn(id);
      return bookingApi.checkOut(id);
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      if (viewBookingId) {
        queryClient.invalidateQueries({ queryKey: ["admin", "booking-details", viewBookingId] });
      }
      const labels = { cancel: "Booking cancelled", "check-in": "Checked in", "check-out": "Checked out" };
      showToast("success", labels[action] + " successfully.");
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

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
    if (viewBookingId) {
      queryClient.invalidateQueries({ queryKey: ["admin", "booking-details", viewBookingId] });
    }
  };

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
              onClick={() => { setActiveTab("TABLE"); setStatusFilter(""); setPaymentFilter(""); setDateFilter(""); setSearch(""); }}
              icon={<Utensils size={15} />}
              label="Table Bookings"
              count={tableCounts.total}
            />
            <TypeTab
              active={activeTab === "ROOM"}
              onClick={() => { setActiveTab("ROOM"); setStatusFilter(""); setPaymentFilter(""); setDateFilter(""); setSearch(""); }}
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
              <option value="">All Booking Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>

            {/* Payment filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="">All Payment Status</option>
              <option value="PENDING">Pending/Unpaid</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
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
              onView={(b) => setViewBookingId(b.id)}
              onAction={handleAction}
              isMutating={actionMutation.isPending}
            />
          ) : (
            <RoomBookingTable
              rows={rows}
              onView={(b) => setViewBookingId(b.id)}
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

      {/* View Details / Financial Panel Modal */}
      <AnimatePresence>
        {viewBookingId && (
          <ViewBookingModal
            bookingId={viewBookingId}
            onClose={() => setViewBookingId(null)}
            onAction={handleAction}
            isMutating={actionMutation.isPending}
            refresh={refresh}
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

// Scope Selector
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

// ─── Helper to Render Discount Status on Grid ─────────────────────────────────
function DiscountInfoBadge({ booking }: { booking: any }) {
  const source = booking.discountSource ?? "NONE";
  const percentage = Number(booking.discountPercentage ?? 0);
  const amount = Number(booking.discountAmount ?? 0);

  if (source === "NONE" || (percentage === 0 && amount === 0)) {
    return <span className="text-xs text-slate-400">No discount</span>;
  }

  if (source === "GAME") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
        Game ({percentage}%)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200" title={booking.appliedOffer?.title ?? "Promo Offer"}>
      {booking.appliedOffer?.code || "Offer"} ({percentage}%)
    </span>
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
    <table className="w-full min-w-[1000px] text-left text-sm font-sans">
      <thead>
        <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <th className="px-5 py-3 font-semibold">Booking #</th>
          <th className="px-5 py-3 font-semibold">Customer</th>
          <th className="px-5 py-3 font-semibold">Table / Floor</th>
          <th className="px-5 py-3 font-semibold">Date & Time</th>
          <th className="px-5 py-3 font-semibold">Guests</th>
          <th className="px-5 py-3 font-semibold">Discount</th>
          <th className="px-5 py-3 font-semibold">Total Amount</th>
          <th className="px-5 py-3 font-semibold">Payment Status</th>
          <th className="px-5 py-3 font-semibold">Status</th>
          <th className="px-5 py-3 font-semibold text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((b) => {
          const grandTotal = getBookingDisplayTotal(b);
          const invoiceStatus = b.invoice?.status ?? "UNPAID";
          const paymentPaid = b.invoice?.status === "PAID";
          return (
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
              <td className="px-5 py-4 text-slate-700">
                <p className="font-medium">{fmtDate(b.bookingDate)}</p>
                <p className="text-xs text-slate-500">{fmtTime(b.startTime)} – {fmtTime(b.endTime)}</p>
              </td>
              <td className="px-5 py-4 text-slate-700 font-medium">{b.members}</td>
              <td className="px-5 py-4">
                <DiscountInfoBadge booking={b} />
              </td>
              <td className="px-5 py-4 font-semibold text-slate-900">
                {grandTotal > 0 ? formatCurrency(grandTotal) : "—"}
              </td>
              <td className="px-5 py-4">
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
                  paymentPaid ? "bg-emerald-50 text-emerald-700" :
                  invoiceStatus === "PARTIALLY_PAID" ? "bg-amber-50 text-amber-700" :
                  invoiceStatus === "CANCELLED" ? "bg-red-50 text-red-700" :
                  "bg-slate-100 text-slate-600"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", paymentPaid ? "bg-emerald-500" : invoiceStatus === "PARTIALLY_PAID" ? "bg-amber-500" : "bg-slate-400")} />
                  {invoiceStatus === "UNPAID" ? "Pending" : invoiceStatus.replace("_", " ")}
                </span>
              </td>
              <td className="px-5 py-4"><StatusChip status={b.status} /></td>
              <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onView(b)}
                    className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center transition"
                    title="View details & Billing"
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
          );
        })}
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
    <table className="w-full min-w-[1000px] text-left text-sm font-sans">
      <thead>
        <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <th className="px-5 py-3 font-semibold">Booking #</th>
          <th className="px-5 py-3 font-semibold">Customer</th>
          <th className="px-5 py-3 font-semibold">Room</th>
          <th className="px-5 py-3 font-semibold">Check-in / Out</th>
          <th className="px-5 py-3 font-semibold">Guests</th>
          <th className="px-5 py-3 font-semibold">Discount</th>
          <th className="px-5 py-3 font-semibold">Total Amount</th>
          <th className="px-5 py-3 font-semibold">Payment Status</th>
          <th className="px-5 py-3 font-semibold">Status</th>
          <th className="px-5 py-3 font-semibold text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((b) => {
          const grandTotal = getBookingDisplayTotal(b);
          const invoiceStatus = b.invoice?.status ?? "UNPAID";
          const paymentPaid = b.invoice?.status === "PAID";
          return (
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
                <p className="font-medium"><span className="text-slate-400">In:</span> {fmtDate(b.bookingDate)}</p>
                <p className="text-xs text-slate-500"><span className="text-slate-400">Out:</span> {fmtDate(b.endAt)}</p>
              </td>
              <td className="px-5 py-4 text-slate-700 font-medium">
                {b.members} {b.members === 1 ? "Guest" : "Guests"}
              </td>
              <td className="px-5 py-4">
                <DiscountInfoBadge booking={b} />
              </td>
              <td className="px-5 py-4 font-semibold text-slate-900">
                {grandTotal > 0 ? formatCurrency(grandTotal) : "—"}
              </td>
              <td className="px-5 py-4">
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
                  paymentPaid ? "bg-emerald-50 text-emerald-700" :
                  invoiceStatus === "PARTIALLY_PAID" ? "bg-amber-50 text-amber-700" :
                  invoiceStatus === "CANCELLED" ? "bg-red-50 text-red-700" :
                  "bg-slate-100 text-slate-600"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", paymentPaid ? "bg-emerald-500" : invoiceStatus === "PARTIALLY_PAID" ? "bg-amber-500" : "bg-slate-400")} />
                  {invoiceStatus === "UNPAID" ? "Pending" : invoiceStatus.replace("_", " ")}
                </span>
              </td>
              <td className="px-5 py-4"><StatusChip status={b.status} /></td>
              <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onView(b)}
                    className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center transition"
                    title="View details & Billing"
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
          );
        })}
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

// ─── View Booking Modal & Financial Panel ─────────────────────────────────────
function ViewBookingModal({
  bookingId, onClose, onAction, isMutating, refresh,
}: {
  bookingId: string;
  onClose: () => void;
  onAction: (id: string, action: "cancel" | "check-in" | "check-out") => void;
  isMutating: boolean;
  refresh: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: booking, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "booking-details", bookingId],
    queryFn: async () => {
      const { data } = await bookingApi.getBookingById(bookingId);
      return data.data.booking;
    },
  });

  // Inline Guest Editor
  const [editingGuests, setEditingGuests] = useState(false);
  const [guestList, setGuestList] = useState<Array<{ fullName: string; aadhaarNumber: string }>>([]);

  useEffect(() => {
    if (booking?.guests) {
      setGuestList(booking.guests.map((g: any) => ({
        fullName: g.fullName,
        aadhaarNumber: g.aadhaarNumber,
      })));
    }
  }, [booking]);

  // Record Payment form state
  const [showPayForm, setShowPayForm] = useState(false);
  const [payMethod, setPayMethod] = useState("CASH");
  const [payAmount, setPayAmount] = useState("");
  const [payTxnId, setPayTxnId] = useState("");
  const [payRef, setPayRef] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [payError, setPayError] = useState("");

  const updateGuestsMutation = useMutation({
    mutationFn: () => {
      // Validate Aadhaar numbers are 12 digits
      const invalid = guestList.some((g) => !/^\d{12}$/.test(g.aadhaarNumber));
      if (invalid) {
        throw new Error("Each guest Aadhaar number must be exactly 12 digits.");
      }
      return bookingApi.updateBooking(bookingId, { guests: guestList });
    },
    onSuccess: () => {
      setEditingGuests(false);
      refetch();
      refresh();
      toastNotification.success("Guest details updated successfully.");
    },
    onError: (err) => toastNotification.error(getErrorMessage(err)),
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: () => invoiceApi.generateInvoice(bookingId),
    onSuccess: () => {
      refetch();
      refresh();
      toastNotification.success("Invoice generated successfully.");
    },
    onError: (err) => toastNotification.error(getErrorMessage(err)),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: () => {
      if (!booking?.invoice?.id) throw new Error("Invoice not found");
      const amt = Number(payAmount);
      if (isNaN(amt) || amt <= 0) throw new Error("Amount must be positive");
      return paymentApi.recordPayment({
        invoiceId: booking.invoice.id,
        method: payMethod,
        amount: amt,
        transactionId: payTxnId.trim() || undefined,
        referenceNumber: payRef.trim() || undefined,
        remarks: payRemarks.trim() || undefined,
      });
    },
    onSuccess: () => {
      setShowPayForm(false);
      setPayAmount("");
      setPayTxnId("");
      setPayRef("");
      setPayRemarks("");
      setPayError("");
      refetch();
      refresh();
      toastNotification.success("Payment recorded successfully.");
    },
    onError: (err) => setPayError(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
        <div className="bg-white p-8 rounded-3xl flex items-center gap-3">
          <Loader2 className="animate-spin text-emerald-600" />
          <span className="font-semibold text-slate-800">Loading booking information...</span>
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
        <div className="bg-white p-8 rounded-3xl text-center space-y-4">
          <AlertCircle className="mx-auto text-red-500" size={32} />
          <p className="font-semibold text-slate-800">Failed to load booking details.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  const isTable = booking.bookingType === "TABLE";
  const invoice = booking.invoice;
  const orders = booking.orders ?? [];

  // Calculate days for room booking
  let roomDays = 1;
  if (booking.bookingType === "ROOM") {
    try {
      const checkInDate = new Date(booking.bookingDate);
      const checkOutDate = new Date(booking.endAt);
      const diffTime = checkOutDate.getTime() - checkInDate.getTime();
      roomDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    } catch {
      roomDays = 1;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden my-8"
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

        {/* Scrollable Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 max-h-[75vh] overflow-y-auto">
          {/* Left Panel: Info & Orders */}
          <div className="p-6 space-y-5">
            {/* Customer Details */}
            <Section title="Customer Information">
              <InfoRow icon={<Users size={14} />} label="Name" value={booking.customer?.fullName ?? "-"} />
              {booking.customer?.phoneNumber && (
                <InfoRow icon={<Phone size={14} />} label="Phone" value={booking.customer.phoneNumber} />
              )}
              {booking.customer?.email && (
                <InfoRow icon={<Mail size={14} />} label="Email" value={booking.customer.email} />
              )}
            </Section>

            {/* Placement Details */}
            <Section title={isTable ? "Table Details" : "Room Details"}>
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

            {/* Schedule Details */}
            <Section title="Schedule">
              <InfoRow icon={<Calendar size={14} />} label="Date" value={fmtDate(booking.bookingDate)} />
              {isTable ? (
                <>
                  <InfoRow icon={<Clock size={14} />} label="Start" value={fmtTime(booking.startTime)} />
                  <InfoRow icon={<Clock size={14} />} label="End" value={fmtTime(booking.endTime)} />
                </>
              ) : (
                <InfoRow icon={<Calendar size={14} />} label="Check-out" value={fmtDate(booking.endAt)} />
              )}
              <InfoRow icon={<Users size={14} />} label="Guests" value={`${booking.members}`} />
            </Section>

            {/* Room Guests List Section */}
            {!isTable && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Guest Information</p>
                  {!editingGuests ? (
                    <button
                      onClick={() => setEditingGuests(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      <Edit2 size={12} /> Edit Guests
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingGuests(false)}
                        className="text-xs text-slate-500 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => updateGuestsMutation.mutate()}
                        className="text-xs text-emerald-600 font-semibold flex items-center gap-1"
                      >
                        <Check size={12} /> Save
                      </button>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                  {!editingGuests ? (
                    !booking.guests || booking.guests.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No guests details recorded.</p>
                    ) : (
                      booking.guests.map((g: any, i: number) => (
                        <div key={g.id || i} className="flex justify-between items-center text-sm border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                          <span className="font-semibold text-slate-700">{i + 1}. {g.fullName}</span>
                          <span className="font-mono text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100">
                            {maskAadhaar(g.aadhaarNumber)}
                          </span>
                        </div>
                      ))
                    )
                  ) : (
                    <div className="space-y-3">
                      {guestList.map((g, i) => (
                        <div key={i} className="space-y-1.5 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                          <p className="text-xs font-bold text-slate-500">Guest {i + 1}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={g.fullName}
                              placeholder="Name"
                              onChange={(e) => {
                                const copy = [...guestList];
                                copy[i].fullName = e.target.value;
                                setGuestList(copy);
                              }}
                              className="h-8 rounded-lg border border-slate-200 px-2 text-xs text-slate-800"
                            />
                            <input
                              type="text"
                              value={g.aadhaarNumber}
                              maxLength={12}
                              placeholder="12-digit Aadhaar"
                              onChange={(e) => {
                                const copy = [...guestList];
                                copy[i].aadhaarNumber = e.target.value.replace(/\D/g, "");
                                setGuestList(copy);
                              }}
                              className="h-8 rounded-lg border border-slate-200 px-2 text-xs text-slate-800 font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selected Food Items */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 font-sans">Selected Food Items / Orders</p>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                {orders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No food orders linked to this booking.</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((o) => (
                      <div key={o.id} className="border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">
                            {o.orderNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-600">{formatCurrency(Number(o.totalSnapshot))}</span>
                        </div>
                        <div className="pl-2 space-y-1">
                          {o.items.map((it) => (
                            <div key={it.id} className="flex justify-between text-xs text-slate-500">
                              <span>{it.itemNameSnapshot} {it.variantNameSnapshot ? `(${it.variantNameSnapshot})` : ""} x{it.quantity}</span>
                              <span>{formatCurrency(Number(it.lineTotalSnapshot))}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Finance & Invoicing */}
          <div className="p-6 bg-slate-50/30 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Financial Summary</p>
                {invoice && (
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full border",
                    invoice.status === "PAID" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                    invoice.status === "PARTIALLY_PAID" ? "bg-amber-50 border-amber-200 text-amber-700" :
                    "bg-slate-100 border-slate-200 text-slate-600"
                  )}>
                    Invoice: {invoice.status}
                  </span>
                )}
              </div>

              {!invoice ? (
                <div className="text-center py-8 border border-slate-100 rounded-2xl bg-white space-y-3">
                  <Receipt className="mx-auto text-slate-300" size={32} />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">No Invoice Generated</p>
                    <p className="text-xs text-slate-500 mt-0.5">Please check in customer first to generate the invoice.</p>
                  </div>
                  {(booking.status === "CHECKED_IN" || booking.status === "COMPLETED") ? (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      onClick={() => generateInvoiceMutation.mutate()}
                      loading={generateInvoiceMutation.isPending}
                    >
                      Generate Invoice Now
                    </Button>
                  ) : (
                    <p className="text-xs text-amber-600 font-semibold bg-amber-50 rounded-lg p-2 inline-block">
                      Awaiting Check-in status to bill.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2 shadow-sm font-sans">
                    {/* Room charge break up if ROOM */}
                    {!isTable && booking.room && (
                      <div className="flex justify-between text-xs text-slate-500 border-b border-slate-100 pb-2 mb-2">
                        <span>Room charge ({roomDays} days x {formatCurrency(Number(booking.room.pricePerDay ?? 0))})</span>
                        <span>{formatCurrency(Number(invoice.roomTotal))}</span>
                      </div>
                    )}
                    {Number(invoice.foodTotal) > 0 && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Food Orders Subtotal</span>
                        <span>{formatCurrency(Number(invoice.foodTotal))}</span>
                      </div>
                    )}
                    {Number(invoice.extraCharges) > 0 && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Extra Charges</span>
                        <span>{formatCurrency(Number(invoice.extraCharges))}</span>
                      </div>
                    )}

                    {/* Applied Offer/Discount Breakdown */}
                    <div className="flex justify-between text-xs text-slate-600 border-t border-slate-50 pt-2 font-medium">
                      <div className="flex flex-col">
                        <span>Discount Source</span>
                        <span className="text-[10px] text-slate-400">
                          {booking.discountSource === "OFFER" && booking.appliedOffer ? `Promo: ${booking.appliedOffer.title}` :
                           booking.discountSource === "GAME" ? "Earned Game Reward" : "None applied"}
                        </span>
                      </div>
                      <span className="text-red-600 font-bold">
                        -{formatCurrency(Number(invoice.discountTotal))} ({booking.discountPercentage}%)
                      </span>
                    </div>

                    {Number(invoice.taxTotal) > 0 && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Taxes (CGST/SGST)</span>
                        <span>{formatCurrency(Number(invoice.taxTotal))}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-slate-100 pt-2">
                      <span>Final Amount</span>
                      <span>{formatCurrency(Number(invoice.grandTotal))}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Paid Amount</span>
                      <span className="text-emerald-700">{formatCurrency(Number(invoice.paidAmount))}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Remaining Balance</span>
                      <span className="text-red-700">{formatCurrency(Number(invoice.balanceAmount))}</span>
                    </div>
                  </div>

                  {/* Payments list */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Transactions / Payments</p>
                    <div className="space-y-2 max-h-36 overflow-y-auto">
                      {!invoice.payments || invoice.payments.length === 0 ? (
                        <p className="text-xs text-slate-400 italic bg-white border border-slate-100 rounded-xl p-3">No payments recorded yet.</p>
                      ) : (
                        invoice.payments.map((p) => (
                          <div key={p.id} className="bg-white border border-slate-100 rounded-xl p-3 text-xs flex justify-between items-start shadow-sm">
                            <div>
                              <p className="font-bold text-slate-700 uppercase">{p.method} Payment</p>
                              <p className="text-slate-400 text-[10px]">{new Date(p.paidAt).toLocaleString("en-IN")}</p>
                              {p.transactionId && (
                                <p className="text-[10px] text-emerald-700 font-mono mt-0.5">TXN ID: {p.transactionId}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-800">{formatCurrency(Number(p.amount))}</p>
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                                {p.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Add Payment Button / Form */}
                  {Number(invoice.balanceAmount) > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      {!showPayForm ? (
                        <Button
                          size="sm"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          leftIcon={<CreditCard size={14} />}
                          onClick={() => {
                            setPayAmount(String(Number(invoice.balanceAmount)));
                            setShowPayForm(true);
                          }}
                        >
                          Record Manual Payment
                        </Button>
                      ) : (
                        <div className="bg-white border border-emerald-100 rounded-2xl p-4 space-y-3 shadow-inner">
                          <p className="text-xs font-bold text-slate-700 border-b pb-1">Enter Payment Details</p>
                          {payError && (
                            <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{payError}</p>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block uppercase">Method</label>
                              <select
                                value={payMethod}
                                onChange={(e) => setPayMethod(e.target.value)}
                                className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800"
                              >
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="CARD">Card</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block uppercase">Amount *</label>
                              <input
                                type="number"
                                step="0.01"
                                max={Number(invoice.balanceAmount)}
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value)}
                                className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 font-medium"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block uppercase">Transaction ID</label>
                            <input
                              type="text"
                              placeholder="TXN..."
                              value={payTxnId}
                              onChange={(e) => setPayTxnId(e.target.value)}
                              className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 font-mono"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setShowPayForm(false)}
                              className="text-xs font-medium text-slate-500 hover:text-slate-800"
                            >
                              Cancel
                            </button>
                            <Button
                              size="sm"
                              onClick={() => recordPaymentMutation.mutate()}
                              loading={recordPaymentMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 font-semibold"
                            >
                              Record Payment
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons footer */}
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-end gap-2">
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
      <span className="font-semibold text-slate-800">{value}</span>
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
  endDate: string;
  startTime: string;
  endTime: string;
  members: string;
  notes: string;
  appliedOfferId: string;
  useGameDiscount: boolean;
};

const emptyForm = (type: BookingType): CreateBookingForm => ({
  bookingType: type,
  customerId: "",
  floorId: "",
  resourceId: "",
  date: todayStr(),
  endDate: todayStr(),
  startTime: type === "ROOM" ? "14:00" : "19:00",
  endTime: type === "ROOM" ? "18:00" : "20:00",
  members: "2",
  notes: "",
  appliedOfferId: "",
  useGameDiscount: false,
});

const ROOM_BOOKING_WINDOW = {
  startTime: "14:00",
  endTime: "18:00",
};

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
  const [guestsList, setGuestsList] = useState<Array<{ fullName: string; aadhaarNumber: string }>>([
    { fullName: "", aadhaarNumber: "" },
    { fullName: "", aadhaarNumber: "" },
  ]);

  const set = <K extends keyof CreateBookingForm>(key: K, val: CreateBookingForm[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  // ─── Guest List Sync ─────────────────────────────────────────────────────
  useEffect(() => {
    const desiredCount = parseInt(form.members) || 1;
    if (desiredCount < 1) return;

    if (desiredCount > guestsList.length) {
      // Pad list
      const pad = Array.from({ length: desiredCount - guestsList.length }).map(() => ({
        fullName: "",
        aadhaarNumber: "",
      }));
      setGuestsList((prev) => [...prev, ...pad]);
    } else if (desiredCount < guestsList.length) {
      // Determine if there is content in removed guests
      const tail = guestsList.slice(desiredCount);
      const hasContent = tail.some((g) => g.fullName.trim() !== "" || g.aadhaarNumber.trim() !== "");

      if (hasContent) {
        const confirmClear = window.confirm("Reducing the guest count will delete entered guest details. Do you want to proceed?");
        if (!confirmClear) {
          // Reset members state back to previous length
          setForm((p) => ({ ...p, members: String(guestsList.length) }));
          return;
        }
      }
      setGuestsList((prev) => prev.slice(0, desiredCount));
    }
  }, [form.members]);

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

  const offersQuery = useQuery({
    queryKey: ["admin", "offers", "all"],
    queryFn: async () => {
      const { data } = await adminApi.offers.list({ limit: 100 });
      return data.data.offers;
    },
    staleTime: 60_000,
  });

  const activeRewardQuery = useQuery({
    queryKey: ["admin", "active-reward", form.customerId],
    enabled: !!form.customerId,
    queryFn: async () => {
      const { data } = await bookingApi.getActiveReward(form.customerId);
      return data.data.reward;
    },
  });

  // Filter offers by booking applicability
  const applicableOffers = useMemo(() => {
    const offers = offersQuery.data ?? [];
    return offers.filter((o) => {
      if (o.status !== "ACTIVE") return false;
      const applicableTo = (o as any).applicableTo ?? "BOTH";
      if (form.bookingType === "ROOM") {
        return applicableTo === "ROOM" || applicableTo === "BOTH";
      } else {
        return applicableTo === "TABLE" || applicableTo === "BOTH";
      }
    });
  }, [offersQuery.data, form.bookingType]);

  const availabilityReady = form.bookingType === "ROOM"
    ? Boolean(form.date) &&
      Boolean(form.endDate) &&
      new Date(form.endDate) >= new Date(form.date) &&
      Number(form.members) > 0
    : Boolean(form.date) &&
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
    queryKey: ["booking-avail-rooms", form.date, form.endDate, form.members],
    enabled: form.bookingType === "ROOM" && availabilityReady,
    queryFn: async () => {
      const { data } = await bookingApi.getAvailableRooms({
        date: form.date,
        startTime: ROOM_BOOKING_WINDOW.startTime,
        endTime: ROOM_BOOKING_WINDOW.endTime,
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

  const selectedAvailability = useMemo(() => {
    if (!form.resourceId) return null;
    const items = availItems as Array<TableAvailabilityResult | RoomAvailabilityResult>;
    return items.find((i) => i.resource.id === form.resourceId) ?? null;
  }, [form.resourceId, availItems]);

  // Find currently selected resource for price calculations
  const selectedResource = useMemo(() => {
    if (!form.resourceId) return null;
    return selectedAvailability?.resource ?? null;
  }, [form.resourceId, selectedAvailability]);

  // Pricing preview
  const pricingPreview = useMemo(() => {
    let subtotal = 0;
    let roomDaysCount = 1;

    if (form.bookingType === "ROOM" && selectedResource) {
      if ("pricePerDay" in selectedResource) {
        try {
          const checkInDate = new Date(form.date);
          const checkOutDate = new Date(form.endDate);
          const diffTime = checkOutDate.getTime() - checkInDate.getTime();
          roomDaysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        } catch {}
        subtotal = Number(selectedResource.pricePerDay || 0) * roomDaysCount;
      }
    }

    let discountPercentage = 0;
    if (form.appliedOfferId) {
      const match = applicableOffers.find((o) => o.id === form.appliedOfferId);
      if (match) discountPercentage = Number(match.discountValue);
    } else if (form.useGameDiscount && activeRewardQuery.data) {
      discountPercentage = Number(activeRewardQuery.data.discountValue);
    }

    const discountAmount = (subtotal * discountPercentage) / 100;
    const finalAmount = Math.max(0, subtotal - discountAmount);

    return {
      subtotal,
      discountPercentage,
      discountAmount,
      finalAmount,
    };
  }, [form.date, form.endDate, form.bookingType, selectedResource, form.appliedOfferId, form.useGameDiscount, activeRewardQuery.data, applicableOffers]);

  // ─── Create mutation ──────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () => {
      setFormError("");
      if (!form.customerId) throw new Error("Customer is required");
      if (!form.resourceId) throw new Error(`${form.bookingType === "TABLE" ? "Table" : "Room"} is required`);
      if (!form.date) throw new Error("Date is required");

      if (form.bookingType === "ROOM") {
        if (!form.endDate) throw new Error("End date is required");
        if (new Date(form.endDate) < new Date(form.date)) throw new Error("End date must be on or after start date");

        // Validate all guest details are entered
        const invalid = guestsList.some((g) => !g.fullName.trim() || !/^\d{12}$/.test(g.aadhaarNumber));
        if (invalid) {
          throw new Error("Full Name and a valid 12-digit Aadhaar Number are required for every guest.");
        }
      } else {
        if (!form.startTime || !form.endTime) throw new Error("Start and end time are required");
        if (form.startTime >= form.endTime) throw new Error("End time must be after start time");
      }

      if (Number(form.members) < 1) throw new Error("At least 1 guest is required");

      if (selectedAvailability && !selectedAvailability.available) {
        throw new Error(`${form.bookingType === "TABLE" ? "Selected table" : "Selected room"} is unavailable for the chosen date and time.`);
      }

      if (form.resourceId && !selectedAvailability) {
        throw new Error("Selected resource is no longer available. Please choose another option.");
      }

      return bookingApi.createBooking({
        bookingType: form.bookingType,
        customerId: form.customerId,
        tableId: form.bookingType === "TABLE" ? form.resourceId : undefined,
        roomId: form.bookingType === "ROOM" ? form.resourceId : undefined,
        date: form.date,
        endDate: form.bookingType === "ROOM" ? form.endDate : undefined,   // check-out date
        startTime: form.bookingType === "ROOM" ? ROOM_BOOKING_WINDOW.startTime : form.startTime,
        endTime: form.bookingType === "ROOM" ? ROOM_BOOKING_WINDOW.endTime : form.endTime,
        members: Number(form.members),
        notes: form.notes.trim() || undefined,
        source: "ADMIN",
        appliedOfferId: form.appliedOfferId || undefined,
        useGameDiscount: form.useGameDiscount || undefined,
        guests: form.bookingType === "ROOM" ? guestsList : undefined,
      });
    },
    onSuccess: () => onSuccess(form.bookingType),
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const availableItems = availItems.filter((i) => (i as TableAvailabilityResult | RoomAvailabilityResult).available);
  const isTable = form.bookingType === "TABLE";
  const gameReward = activeRewardQuery.data;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden my-8"
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

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
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
                  onClick={() => {
                    setForm({ ...emptyForm(t) });
                    setGuestsList([
                      { fullName: "", aadhaarNumber: "" },
                      { fullName: "", aadhaarNumber: "" },
                    ]);
                  }}
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
                onChange={(e) => {
                  set("customerId", e.target.value);
                  set("appliedOfferId", "");
                  set("useGameDiscount", false);
                }}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none"
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
          {isTable ? (
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Date *">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => { set("date", e.target.value); set("resourceId", ""); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                />
              </FormField>
              <FormField label="Start Time *">
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => { set("startTime", e.target.value); set("resourceId", ""); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                />
              </FormField>
              <FormField label="End Time *">
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => { set("endTime", e.target.value); set("resourceId", ""); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                />
              </FormField>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Start Date *">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => { set("date", e.target.value); set("resourceId", ""); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                />
              </FormField>
              <FormField label="End Date *">
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => { set("endDate", e.target.value); set("resourceId", ""); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                />
              </FormField>
            </div>
          )}

          {/* Guests Count */}
          <FormField label="Number of Guests *">
            <input
              type="number"
              min={1}
              value={form.members}
              onChange={(e) => { set("members", e.target.value); set("resourceId", ""); }}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
            />
          </FormField>

          {/* Guest Information Repeatable Form for ROOM Bookings */}
          {form.bookingType === "ROOM" && (
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">All Guest Identification details</p>
              {guestsList.map((g, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                  <p className="text-xs font-bold text-slate-500">Guest {idx + 1}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={g.fullName}
                        onChange={(e) => {
                          const copy = [...guestsList];
                          copy[idx].fullName = e.target.value;
                          setGuestsList(copy);
                        }}
                        className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="12-digit Aadhaar"
                        maxLength={12}
                        value={g.aadhaarNumber}
                        onChange={(e) => {
                          const copy = [...guestsList];
                          copy[idx].aadhaarNumber = e.target.value.replace(/\D/g, "");
                          setGuestsList(copy);
                        }}
                        className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Floor (table only) */}
          {isTable && (
            <FormField label="Filter by Floor">
              {floorsQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={14} className="animate-spin" /> Loading floors…</div>
              ) : (
                <select
                  value={form.floorId}
                  onChange={(e) => { set("floorId", e.target.value); set("resourceId", ""); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none"
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
                {isTable
                  ? "Fill in date, start time, end time and guests to see availability."
                  : "Fill in start date, end date and guests to see availability."}
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

          {/* Discount Section (Offers and Game Rewards with Single-Discount enforcement) */}
          {form.customerId && (
            <div className="border-t border-slate-100 pt-3 space-y-3.5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Discount & Promotions</p>
              
              <div className="grid grid-cols-1 gap-3.5">
                {/* Offer Dropdown */}
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Select Promo Offer</label>
                  {offersQuery.isLoading ? (
                    <p className="text-xs text-slate-500 animate-pulse">Loading offers...</p>
                  ) : (
                    <select
                      value={form.appliedOfferId}
                      disabled={form.useGameDiscount}
                      onChange={(e) => set("appliedOfferId", e.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">No offer selected</option>
                      {applicableOffers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.title} · ({o.discountValue}% Off)
                        </option>
                      ))}
                    </select>
                  )}
                  {form.useGameDiscount && (
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">
                      Remove Game Discount to select a promotional offer.
                    </p>
                  )}
                </div>

                {/* Game Discount Checkbox */}
                <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <input
                    type="checkbox"
                    id="gameDiscountCb"
                    disabled={!!form.appliedOfferId || !gameReward}
                    checked={form.useGameDiscount}
                    onChange={(e) => set("useGameDiscount", e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <label htmlFor="gameDiscountCb" className="font-bold text-slate-700 cursor-pointer">
                      Use Earned Game Discount
                    </label>
                    <p className="text-slate-500 text-[10px] mt-0.5">
                      {gameReward ? (
                        <span className="text-emerald-700 font-semibold">Available Game Reward: {gameReward.discountValue}% Off</span>
                      ) : (
                        <span className="text-slate-400 italic">No Game Discount Available</span>
                      )}
                    </p>
                    {form.appliedOfferId && (
                      <p className="text-[10px] text-amber-600 font-semibold mt-1">
                        Remove selected offer to use Game Discount.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Preview Box */}
          {selectedResource && (
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-1.5 shadow-md">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Price Preview</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Base Subtotal:</span>
                <span className="font-semibold">{formatCurrency(pricingPreview.subtotal)}</span>
              </div>
              {pricingPreview.discountPercentage > 0 && (
                <div className="flex justify-between text-sm text-red-400">
                  <span>Discount ({pricingPreview.discountPercentage}%):</span>
                  <span>-{formatCurrency(pricingPreview.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-slate-800 pt-1.5">
                <span>Final Estimate:</span>
                <span className="text-emerald-400">{formatCurrency(pricingPreview.finalAmount)}</span>
              </div>
              <p className="text-[10px] text-slate-400 italic">Taxes and additional charges will be added upon invoicing.</p>
            </div>
          )}

          {/* Notes */}
          <FormField label="Notes (optional)">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Any special requests or notes…"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none"
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
            disabled={
              createMutation.isPending ||
              !form.resourceId ||
              !form.customerId ||
              Boolean(selectedAvailability && !selectedAvailability.available)
            }
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
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}
