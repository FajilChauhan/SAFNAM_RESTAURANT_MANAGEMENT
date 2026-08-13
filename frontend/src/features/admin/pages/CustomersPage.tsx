import { useState } from "react";
import { Search, Eye, UserX, UserCheck, RefreshCw, ChevronLeft, ChevronRight, Loader2, Mail, Phone, Calendar, ShoppingBag, Shield, CheckCircle, AlertCircle, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminCustomer, type UserStatus } from "@/api/admin.api";
import { Button, StatusChip } from "@/components/ui";
import { formatCurrency, formatDate, getErrorMessage } from "@/utils/formatters";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [selected, setSelected] = useState<AdminCustomer | null>(null);
  const [confirmBlock, setConfirmBlock] = useState<{ id: string; currentStatus: UserStatus } | null>(null);

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Queries
  const statsQuery = useQuery({
    queryKey: ["admin", "customers", "stats"],
    queryFn: async () => (await adminApi.customers.stats()).data.data,
  });

  const customersQuery = useQuery({
    queryKey: ["admin", "customers", search, statusFilter, page],
    queryFn: async () => {
      const res = await adminApi.customers.list({
        search: search.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : (statusFilter as UserStatus),
        page,
        limit,
      });
      return res.data;
    },
  });

  const customerDetailsQuery = useQuery({
    queryKey: ["admin", "customers", selected?.id, "details"],
    enabled: Boolean(selected?.id),
    queryFn: async () => {
      const res = (await adminApi.customers.get(selected!.id)).data.data.customer as AdminCustomer & {
        bookings?: Array<{
          id: string;
          bookingNumber?: string;
          bookingType?: "TABLE" | "ROOM";
          status?: string;
          bookingDate?: string;
          checkedInAt?: string;
          checkedOutAt?: string;
          partySize?: number;
          guestsCount?: number;
          table?: { tableNumber: number };
          room?: { roomNumber: string };
        }>;
        orders?: Array<{
          id: string;
          orderNumber?: string;
          status?: string;
          totalSnapshot?: string | number;
          createdAt?: string;
          paymentStatus?: string;
          items?: Array<{ id: string; quantity: number; notes?: string; menuItem?: { name: string } }>;
        }>;
        payments?: Array<{
          id: string;
          paymentNumber?: string;
          status?: string;
          amount?: string | number;
          method?: string;
          paidAt?: string;
        }>;
        feedback?: Array<{
          id: string;
          comments?: string;
          foodRating?: number;
          serviceRating?: number;
          createdAt?: string;
        }>;
      };
      return res;
    },
  });

  // Block / Unblock Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) => adminApi.customers.status(id, status),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      showToast("success", `Customer successfully ${variables.status === "BLOCKED" ? "blocked" : "unblocked"}!`);
      setConfirmBlock(null);
      if (selected && selected.id === variables.id) {
        setSelected(null);
      }
    },
    onError: (err) => {
      showToast("error", getErrorMessage(err));
    },
  });

  const handleRefresh = () => {
    statsQuery.refetch();
    customersQuery.refetch();
  };

  const rows = customersQuery.data?.data.customers ?? [];
  const meta = customersQuery.data?.meta;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-white",
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            )}
          >
            {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Customer profiles, visits, loyalty and activity overview
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-gray-300 bg-white text-gray-700 font-semibold text-sm rounded-xl transition-all hover:bg-gray-50 shadow-sm"
        >
          <RefreshCw size={16} className={cn((customersQuery.isFetching || statsQuery.isFetching) && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Customer Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Customers", value: statsQuery.data?.totalCustomers ?? 0, color: "bg-gray-50 border-gray-200", textColor: "text-slate-900" },
          { label: "Active Customers", value: statsQuery.data?.activeCustomers ?? 0, color: "bg-emerald-50 border-emerald-100", textColor: "text-emerald-700" },
          { label: "Blocked Customers", value: statsQuery.data?.blockedCustomers ?? 0, color: "bg-red-50 border-red-100", textColor: "text-red-700" },
          { label: "New Customers (30d)", value: statsQuery.data?.newCustomers ?? 0, color: "bg-blue-50 border-blue-100", textColor: "text-blue-700" },
          { label: "Total Spent", value: formatCurrency(Number(statsQuery.data?.totalRevenue ?? 0)), color: "bg-purple-50 border-purple-100", textColor: "text-purple-700" },
        ].map((s, idx) => (
          <div key={idx} className={cn("rounded-2xl p-4 border flex flex-col justify-between shadow-sm", s.color)}>
            <p className={cn("text-2xl md:text-3xl font-bold tracking-tight", s.textColor)}>
              {statsQuery.isLoading ? <Loader2 className="animate-spin h-6 w-6 text-gray-400" /> : s.value}
            </p>
            <p className="text-slate-600 font-medium text-xs md:text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main Customers List Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Name, Email, or Phone..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {["ALL", "ACTIVE", "BLOCKED"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setStatusFilter(f);
                  setPage(1);
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                  statusFilter === f
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-600 border-gray-200 hover:border-gray-300"
                )}
              >
                {f === "ALL" ? "All Customers" : f}
              </button>
            ))}
          </div>
        </div>

        {/* Table Area */}
        {customersQuery.isLoading ? (
          <div className="space-y-3 py-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse w-full" />
            ))}
          </div>
        ) : customersQuery.isError ? (
          <div className="text-center py-12 border border-dashed rounded-2xl border-gray-200">
            <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold text-lg">Unable to load customers</p>
            <p className="text-slate-400 text-sm mb-4">{getErrorMessage(customersQuery.error)}</p>
            <Button variant="outline" onClick={() => customersQuery.refetch()}>Retry</Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-2xl border-gray-200">
            <X size={44} className="text-gray-300 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold">No customers found</p>
            <p className="text-slate-400 text-sm mt-1">
              {search || statusFilter !== "ALL" ? "Try adjusting your search query or filter." : "Click Refresh to sync newest updates."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 px-3">Customer</th>
                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 px-3">Contact</th>
                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 px-3 text-center">Visits</th>
                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 px-3 text-right">Total Spent</th>
                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 px-3">Last Visit</th>
                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 px-3">Status</th>
                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((customer: AdminCustomer) => (
                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                      {/* Name / Initials Icon */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl shrink-0 bg-slate-100 flex items-center justify-center font-bold text-emerald-800 text-sm border border-emerald-100">
                            {customer.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{customer.fullName}</p>
                            <p className="text-slate-400 text-xs mt-0.5">#{customer.id.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Email */}
                      <td className="py-4 px-3">
                        <p className="text-slate-700 text-sm">{customer.phoneNumber || "Not provided"}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{customer.email || "Not provided"}</p>
                      </td>

                      {/* Visits */}
                      <td className="py-4 px-3 text-center font-medium text-slate-800">
                        {customer.visitCount}
                      </td>

                      {/* Total Spent */}
                      <td className="py-4 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(Number(customer.totalSpending ?? 0))}
                      </td>

                      {/* Last Visit */}
                      <td className="py-4 px-3 text-slate-500 text-sm">
                        {customer.lastVisitAt ? formatDate(customer.lastVisitAt) : "Never"}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3">
                        <span
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1",
                            customer.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", customer.status === "ACTIVE" ? "bg-green-500" : "bg-red-500")} />
                          {customer.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => setSelected(customer)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-gray-200 rounded-lg transition-all"
                          >
                            <Eye size={12} />
                            View
                          </button>
                          <button
                            onClick={() => setConfirmBlock({ id: customer.id, currentStatus: customer.status })}
                            className={cn(
                              "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all",
                              customer.status === "ACTIVE"
                                ? "text-red-600 border-red-100 bg-red-50/50 hover:bg-red-100/70"
                                : "text-emerald-700 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/70"
                            )}
                          >
                            {customer.status === "ACTIVE" ? <UserX size={12} /> : <UserCheck size={12} />}
                            {customer.status === "ACTIVE" ? "Block" : "Unblock"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-slate-500 text-xs">
                  Showing page <b>{meta.page}</b> of <b>{meta.totalPages}</b> ({meta.total} total customers)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!meta.hasPreviousPage}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-gray-200 rounded-lg transition-all disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={!meta.hasNextPage}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-gray-200 rounded-lg transition-all disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CONFIRM BLOCK/UNBLOCK DIALOG */}
      <AnimatePresence>
        {confirmBlock && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmBlock(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            {/* Dialog Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4 border border-gray-100">
                <div className="flex items-center gap-3 text-amber-600">
                  <AlertCircle size={24} />
                  <h3 className="font-bold text-slate-900 text-lg">
                    {confirmBlock.currentStatus === "ACTIVE" ? "Block Customer?" : "Unblock Customer?"}
                  </h3>
                </div>
                <p className="text-slate-600 text-sm">
                  {confirmBlock.currentStatus === "ACTIVE"
                    ? "Are you sure you want to block this customer? They will not be able to log in, book tables/rooms, or place food orders."
                    : "Unblocking this customer will restore their full access to booking and ordering systems."}
                </p>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setConfirmBlock(null)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      statusMutation.mutate({
                        id: confirmBlock.id,
                        status: confirmBlock.currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE",
                      })
                    }
                    disabled={statusMutation.isPending}
                    className={cn(
                      "px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all flex items-center gap-1.5",
                      confirmBlock.currentStatus === "ACTIVE" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    {statusMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* VIEW CUSTOMER DETAILS DRAWER/MODAL */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              className="fixed top-0 right-0 h-screen w-full max-w-xl bg-white shadow-2xl z-40 flex flex-col border-l border-gray-100"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Customer Profile</h2>
                  <p className="text-slate-400 text-xs mt-0.5">#{selected.id}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {customerDetailsQuery.isLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                    <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
                    <p className="text-sm">Loading activity logs...</p>
                  </div>
                ) : customerDetailsQuery.isError ? (
                  <div className="text-center py-8">
                    <p className="text-red-500">Failed to load detailed profile activity.</p>
                  </div>
                ) : (
                  <>
                    {/* Identity card */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-gray-100">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center font-bold text-2xl text-emerald-800 border border-emerald-200">
                        {customerDetailsQuery.data?.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{customerDetailsQuery.data?.fullName}</h3>
                        <p className="text-xs font-semibold mt-1">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full",
                              customerDetailsQuery.data?.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}
                          >
                            {customerDetailsQuery.data?.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Stats Summary Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-gray-100 text-center">
                        <span className="text-slate-400 text-xs">Visits</span>
                        <p className="text-xl font-bold text-slate-900 mt-1">{customerDetailsQuery.data?.visitCount ?? 0}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-gray-100 text-center">
                        <span className="text-slate-400 text-xs">Total Spent</span>
                        <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(Number(customerDetailsQuery.data?.totalSpending ?? 0))}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-gray-100 text-center">
                        <span className="text-slate-400 text-xs">Last Visit</span>
                        <p className="text-sm font-semibold text-slate-900 mt-2 truncate">
                          {customerDetailsQuery.data?.lastVisitAt ? formatDate(customerDetailsQuery.data?.lastVisitAt) : "Never"}
                        </p>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <Shield size={16} className="text-slate-400" /> Account details
                      </h4>
                      <div className="divide-y divide-gray-100 bg-slate-50 border border-gray-100 rounded-2xl px-4 py-1 text-sm text-slate-700">
                        <div className="py-2.5 flex justify-between">
                          <span className="text-slate-500">Email Address</span>
                          <span className="font-medium text-slate-900 flex items-center gap-1">
                            <Mail size={12} className="text-slate-400" />
                            {customerDetailsQuery.data?.email || "Not provided"}
                          </span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-slate-500">Phone Number</span>
                          <span className="font-medium text-slate-900 flex items-center gap-1">
                            <Phone size={12} className="text-slate-400" />
                            {customerDetailsQuery.data?.phoneNumber || "Not provided"}
                          </span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-slate-500">Registration Date</span>
                          <span className="font-medium text-slate-900">
                            {customerDetailsQuery.data?.createdAt ? formatDate(customerDetailsQuery.data?.createdAt) : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Booking History */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <Calendar size={16} className="text-slate-400" /> Booking History (Table / Room)
                      </h4>
                      {customerDetailsQuery.data?.bookings && customerDetailsQuery.data.bookings.length > 0 ? (
                        <div className="space-y-2.5">
                          {customerDetailsQuery.data.bookings.map((booking) => (
                            <div key={booking.id} className="p-3 bg-white rounded-xl border border-gray-100 flex justify-between items-start text-sm shadow-sm">
                              <div>
                                <p className="font-bold text-slate-800">
                                  {booking.bookingType === "TABLE"
                                    ? `Table Reservation ${booking.table ? `#${booking.table.tableNumber}` : ""}`
                                    : `Room Reservation ${booking.room ? `#${booking.room.roomNumber}` : ""}`}
                                </p>
                                <p className="text-slate-400 text-xs mt-1">
                                  Date: {booking.bookingDate ? formatDate(booking.bookingDate) : "—"} · Guests: {booking.partySize ?? booking.guestsCount ?? 1}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                  booking.status === "COMPLETED" || booking.status === "CHECKED_IN"
                                    ? "bg-green-50 text-green-700 border border-green-100"
                                    : booking.status === "CANCELLED"
                                    ? "bg-red-50 text-red-700 border border-red-100"
                                    : "bg-amber-50 text-amber-700 border border-amber-100"
                                )}
                              >
                                {booking.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No bookings found for this customer.</p>
                      )}
                    </div>

                    {/* Order History */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <ShoppingBag size={16} className="text-slate-400" /> Food Orders
                      </h4>
                      {customerDetailsQuery.data?.orders && customerDetailsQuery.data.orders.length > 0 ? (
                        <div className="space-y-2.5">
                          {customerDetailsQuery.data.orders.map((order) => (
                            <div key={order.id} className="p-3 bg-white rounded-xl border border-gray-100 flex justify-between items-start text-sm shadow-sm">
                              <div>
                                <p className="font-bold text-slate-800">Order {order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(-6).toUpperCase()}`}</p>
                                <p className="text-slate-400 text-xs mt-1">
                                  Placed: {order.createdAt ? formatDate(order.createdAt) : "—"}
                                </p>
                                {order.items && order.items.length > 0 && (
                                  <p className="text-slate-600 text-xs mt-1 truncate max-w-xs">
                                    {order.items.map((i) => `${i.menuItem?.name || "Item"} x${i.quantity}`).join(", ")}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-slate-900">{formatCurrency(Number(order.totalSnapshot ?? 0))}</p>
                                <span
                                  className={cn(
                                    "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase inline-block mt-1",
                                    order.status === "SERVED"
                                      ? "bg-green-50 text-green-700 border border-green-100"
                                      : order.status === "CANCELLED"
                                      ? "bg-red-50 text-red-700 border border-red-100"
                                      : "bg-blue-50 text-blue-700 border border-blue-100"
                                  )}
                                >
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No food orders registered yet.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
