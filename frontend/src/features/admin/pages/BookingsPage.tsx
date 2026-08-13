import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import { adminApi, type AdminCustomer } from "@/api/admin.api";
import { bookingApi } from "@/api/booking.api";
import { floorApi } from "@/api/floor.api";
import { Button, EmptyState, Input, Modal, PageHeader, Select, StatusChip } from "@/components/ui";
import { getErrorMessage } from "@/utils/formatters";
import { toast } from "@/utils/toast";
import { useBookingsAdmin } from "../hooks/useBookingsAdmin";

type BookingType = "TABLE" | "ROOM";
type BookingScope = "ACTIVE" | "ALL";
type BookingRow = {
  id: string;
  bookingNumber?: string;
  customer?: { fullName?: string; name?: string; phone?: string; email?: string };
  bookingType?: string;
  table?: { tableNumber?: string; capacity?: number; floor?: { name?: string } };
  room?: { roomNumber?: string; roomType?: string };
  date?: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  guests?: number;
  members?: number;
  paymentStatus?: string;
  status: string;
};
type BookingActionMutation = UseMutationResult<AxiosResponse<unknown>, Error, { id: string; action: "cancel" | "check-in" | "check-out" }, unknown>;

type BookingForm = {
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

const today = new Date().toISOString().slice(0, 10);
const emptyForm: BookingForm = {
  bookingType: "TABLE",
  customerId: "",
  floorId: "",
  resourceId: "",
  date: today,
  startTime: "19:00",
  endTime: "20:00",
  members: "2",
  notes: "",
};

const activeStatuses = new Set(["PENDING", "CONFIRMED", "CHECKED_IN"]);

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [bookingType, setBookingType] = useState<BookingType>("TABLE");
  const [scope, setScope] = useState<BookingScope>("ACTIVE");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [formError, setFormError] = useState("");

  const bookingsQuery = useBookingsAdmin();
  const customersQuery = useQuery({ queryKey: ["admin", "customers", "booking-select"], queryFn: async () => (await adminApi.customers.list({ limit: 100 })).data.data.customers });
  const floorsQuery = useQuery({ queryKey: ["admin", "floors", "booking-select"], queryFn: async () => (await floorApi.getFloors()).data.data.floors as Array<{ id: string; name: string; status?: string }> });

  const availabilityQuery = useQuery({
    queryKey: ["admin", "booking-availability", form.bookingType, form.date, form.startTime, form.endTime, form.members, form.floorId],
    enabled: isOpen && Boolean(form.date && form.startTime && form.endTime && Number(form.members) > 0),
    queryFn: async () => {
      const params = { date: form.date, startTime: form.startTime, endTime: form.endTime, members: Number(form.members), floorId: form.floorId || undefined };
      const response = form.bookingType === "TABLE" ? await bookingApi.getAvailability(params) : await bookingApi.getAvailableRooms(params);
      return form.bookingType === "TABLE" ? response.data.data.tables : response.data.data.rooms;
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "cancel" | "check-in" | "check-out" }) => {
      if (action === "cancel") return bookingApi.cancelBooking(id);
      if (action === "check-in") return bookingApi.checkIn(id);
      return bookingApi.checkOut(id);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] }); toast.success("Booking action completed."); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!form.customerId) throw new Error("Customer is required");
      if (!form.resourceId) throw new Error(`${form.bookingType === "TABLE" ? "Table" : "Room"} is required`);
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      toast.success(`${form.bookingType === "TABLE" ? "Table" : "Room"} booking created successfully.`);
      closeModal();
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const rows = useMemo(() => {
    const raw = bookingsQuery.data ?? [];
    return raw.filter((booking) => {
      if (booking.bookingType !== bookingType) return false;
      if (scope === "ACTIVE" && !activeStatuses.has(booking.status)) return false;
      if (status && booking.status !== status) return false;
      if (!search.trim()) return true;
      const text = [
        booking.bookingNumber,
        booking.customer?.fullName ?? booking.customer?.name,
        booking.customer?.phone,
        booking.table?.tableNumber,
        booking.room?.roomNumber,
      ].join(" ").toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [bookingsQuery.data, bookingType, scope, status, search]);

  const openCreate = (type: BookingType) => {
    setForm({ ...emptyForm, bookingType: type });
    setFormError("");
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setForm(emptyForm);
    setFormError("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        subtitle="Reusable booking management for table and room reservations"
        actions={
          bookingType === "TABLE" ? (
            <Button onClick={() => openCreate("TABLE")} leftIcon={<Plus size={16} />}>Add Table Booking</Button>
          ) : (
            <Button onClick={() => openCreate("ROOM")} leftIcon={<Plus size={16} />}>Add Room Booking</Button>
          )
        }
      />

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Tab active={bookingType === "TABLE"} onClick={() => setBookingType("TABLE")}>Table Bookings</Tab>
          <Tab active={bookingType === "ROOM"} onClick={() => setBookingType("ROOM")}>Room Bookings</Tab>
        </div>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Tab active={scope === "ACTIVE"} onClick={() => setScope("ACTIVE")}>Active Bookings</Tab>
            <Tab active={scope === "ALL"} onClick={() => setScope("ALL")}>All Bookings</Tab>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block sm:w-72">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search booking/customer" className="pl-10" />
            </label>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </Select>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          {bookingsQuery.isError ? (
            <EmptyState title="Unable to load bookings" description={getErrorMessage(bookingsQuery.error)} action={<Button variant="outline" onClick={() => bookingsQuery.refetch()}>Retry</Button>} />
          ) : !rows.length && !bookingsQuery.isLoading ? (
            <EmptyState title={`No ${scope.toLowerCase()} ${bookingType.toLowerCase()} bookings`} description="Bookings will appear here after customers reserve or staff create them." />
          ) : bookingType === "TABLE" ? (
            <BookingTable rows={rows} actionMutation={actionMutation} />
          ) : (
            <RoomBookingTable rows={rows} actionMutation={actionMutation} />
          )}
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} title={`Add ${form.bookingType === "TABLE" ? "Table" : "Room"} Booking`}>
        <div className="space-y-4">
          {formError ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div> : null}
          <Field label="Booking Type">
            <Select value={form.bookingType} onChange={(e) => setForm({ ...form, bookingType: e.target.value as BookingType, resourceId: "" })}>
              <option value="TABLE">Table Booking</option>
              <option value="ROOM">Room Booking</option>
            </Select>
          </Field>
          <Field label="Customer">
            <Select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              <option value="">Select customer</option>
              {(customersQuery.data ?? []).map((customer: AdminCustomer) => <option key={customer.id} value={customer.id}>{customer.fullName} · {customer.phoneNumber}</option>)}
            </Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={form.bookingType === "TABLE" ? "Booking Date" : "Check-in Date"}><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value, resourceId: "" })} /></Field>
            <Field label="Start Time"><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value, resourceId: "" })} /></Field>
            <Field label="End Time"><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value, resourceId: "" })} /></Field>
          </div>
          {form.bookingType === "TABLE" ? (
            <Field label="Floor">
              <Select value={form.floorId} onChange={(e) => setForm({ ...form, floorId: e.target.value, resourceId: "" })}>
                <option value="">All floors</option>
                {(floorsQuery.data ?? []).filter((floor) => floor.status !== "INACTIVE").map((floor) => <option key={floor.id} value={floor.id}>{floor.name}</option>)}
              </Select>
            </Field>
          ) : null}
          <Field label="Guests"><Input type="number" min={1} value={form.members} onChange={(e) => setForm({ ...form, members: e.target.value, resourceId: "" })} /></Field>
          <Field label={form.bookingType === "TABLE" ? "Available Table" : "Available Room"}>
            <Select value={form.resourceId} onChange={(e) => setForm({ ...form, resourceId: e.target.value })}>
              <option value="">{availabilityQuery.isFetching ? "Loading availability..." : "Select available option"}</option>
              {(availabilityQuery.data ?? []).map((item: { id: string; tableNumber?: string; roomNumber?: string; floor?: { name?: string }; capacity?: number; roomType?: string }) => (
                <option key={item.id} value={item.id}>
                  {form.bookingType === "TABLE" ? `Table ${item.tableNumber} · ${item.floor?.name ?? "Floor"} · ${item.capacity} guests` : `Room ${item.roomNumber} · ${item.roomType ?? "Room"} · ${item.capacity} guests`}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notes"><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Create Booking</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function BookingTable({ rows, actionMutation }: { rows: BookingRow[]; actionMutation: BookingActionMutation }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
        <tr><th className="rounded-l-xl px-4 py-3">Booking ID</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Table</th><th className="px-4 py-3">Floor</th><th className="px-4 py-3">Capacity</th><th className="px-4 py-3">Date / Time</th><th className="px-4 py-3">Guests</th><th className="px-4 py-3">Status</th><th className="rounded-r-xl px-4 py-3 text-right">Actions</th></tr>
      </thead>
      <tbody>{rows.map((booking) => <BookingRowView key={booking.id} booking={booking} type="TABLE" actionMutation={actionMutation} />)}</tbody>
    </table>
  );
}

function RoomBookingTable({ rows, actionMutation }: { rows: BookingRow[]; actionMutation: BookingActionMutation }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
        <tr><th className="rounded-l-xl px-4 py-3">Booking ID</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Room</th><th className="px-4 py-3">Room Type</th><th className="px-4 py-3">Check-in / Checkout</th><th className="px-4 py-3">Guests</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Status</th><th className="rounded-r-xl px-4 py-3 text-right">Actions</th></tr>
      </thead>
      <tbody>{rows.map((booking) => <BookingRowView key={booking.id} booking={booking} type="ROOM" actionMutation={actionMutation} />)}</tbody>
    </table>
  );
}

function BookingRowView({ booking, type, actionMutation }: { booking: BookingRow; type: BookingType; actionMutation: BookingActionMutation }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-4 py-4 font-semibold text-slate-900">{booking.bookingNumber ?? booking.id}</td>
      <td className="px-4 py-4 text-slate-700">{booking.customer?.fullName ?? booking.customer?.name ?? "-"}</td>
      {type === "TABLE" ? (
        <>
          <td className="px-4 py-4 text-slate-700">{booking.table?.tableNumber ?? "-"}</td>
          <td className="px-4 py-4 text-slate-700">{booking.table?.floor?.name ?? "-"}</td>
          <td className="px-4 py-4 text-slate-700">{booking.table?.capacity ?? "-"}</td>
          <td className="px-4 py-4 text-slate-700">{booking.bookingDate ?? booking.date ?? "-"} · {booking.startTime ?? "-"}-{booking.endTime ?? "-"}</td>
        </>
      ) : (
        <>
          <td className="px-4 py-4 text-slate-700">{booking.room?.roomNumber ?? "-"}</td>
          <td className="px-4 py-4 text-slate-700">{booking.room?.roomType ?? "-"}</td>
          <td className="px-4 py-4 text-slate-700">{booking.bookingDate ?? booking.date ?? "-"} · {booking.startTime ?? "-"}-{booking.endTime ?? "-"}</td>
          <td className="px-4 py-4 text-slate-700">{booking.paymentStatus ?? "-"}</td>
        </>
      )}
      <td className="px-4 py-4 text-slate-700">{booking.members ?? booking.guests ?? "-"}</td>
      <td className="px-4 py-4"><StatusChip status={booking.status} /></td>
      <td className="px-4 py-4">
        <div className="flex justify-end gap-2">
          {["PENDING", "CONFIRMED"].includes(booking.status) ? <Button size="sm" variant="ghost" onClick={() => actionMutation.mutate({ id: booking.id, action: "check-in" })}>Check In</Button> : null}
          {booking.status === "CHECKED_IN" ? <Button size="sm" variant="ghost" onClick={() => actionMutation.mutate({ id: booking.id, action: "check-out" })}>Checkout</Button> : null}
          {!["CANCELLED", "COMPLETED"].includes(booking.status) ? <Button size="sm" variant="danger" onClick={() => window.confirm("Cancel this booking?") && actionMutation.mutate({ id: booking.id, action: "cancel" })}>Cancel</Button> : null}
        </div>
      </td>
    </tr>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{children}</button>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}
