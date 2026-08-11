import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { restaurantApi } from "@/api/restaurant.api";
import { roomApi } from "@/api/room.api";
import { Button, EmptyState, Input, Modal, PageHeader, Select, StatusChip } from "@/components/ui";
import { formatCurrency, getErrorMessage } from "@/utils/formatters";

type Room = { id: string; roomNumber: string; roomType: string; capacity: number; pricePerDay: string | number; description?: string; status: string };
type Form = { roomNumber: string; roomType: string; capacity: string; pricePerDay: string; description: string; status: string };
const emptyForm: Form = { roomNumber: "", roomType: "", capacity: "2", pricePerDay: "", description: "", status: "AVAILABLE" };

export default function RoomsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [error, setError] = useState("");
  const restaurantQuery = useQuery({ queryKey: ["restaurant"], queryFn: async () => (await restaurantApi.getInfo()).data.data.restaurant });
  const roomsQuery = useQuery({ queryKey: ["admin", "rooms"], queryFn: async () => (await roomApi.getRooms()).data.data.rooms as Room[] });
  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { restaurantId: restaurantQuery.data?.id, roomNumber: form.roomNumber.trim(), roomType: form.roomType.trim(), capacity: Number(form.capacity), pricePerDay: Number(form.pricePerDay), description: form.description.trim() || undefined, status: form.status };
      if (!payload.restaurantId && !editing) throw new Error("Restaurant setup is required before creating rooms");
      return editing ? roomApi.updateRoom(editing.id, payload) : roomApi.createRoom(payload);
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin", "rooms"] }); closeModal(); },
    onError: (err) => setError(getErrorMessage(err)),
  });
  const deleteMutation = useMutation({ mutationFn: (id: string) => roomApi.deleteRoom(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "rooms"] }) });
  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(""); setIsOpen(true); };
  const openEdit = (room: Room) => { setEditing(room); setForm({ roomNumber: room.roomNumber, roomType: room.roomType, capacity: String(room.capacity), pricePerDay: String(room.pricePerDay), description: room.description ?? "", status: room.status }); setError(""); setIsOpen(true); };
  const closeModal = () => { setIsOpen(false); setEditing(null); setForm(emptyForm); setError(""); };
  const rooms = roomsQuery.data ?? [];
  const canSave = form.roomNumber.trim() && form.roomType.trim() && Number(form.capacity) > 0 && Number(form.pricePerDay) >= 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Rooms" subtitle="Manage SAFNAM room inventory and availability" />
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex justify-end"><Button onClick={openCreate} leftIcon={<Plus size={16} />}>Add Room</Button></div>
        {roomsQuery.isError ? <EmptyState title="Unable to load rooms" description={getErrorMessage(roomsQuery.error)} /> : !rooms.length && !roomsQuery.isLoading ? <EmptyState title="No rooms" description="Add rooms to manage reservations and occupancy." /> : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rooms.map((room) => (
            <article key={room.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"><div className="h-32 bg-gradient-to-br from-emerald-50 to-amber-50" /><div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900">Room {room.roomNumber}</p><p className="text-sm text-slate-500">{room.roomType}</p><p className="text-sm text-slate-500">{room.capacity} guests</p></div><StatusChip status={room.status} /></div><p className="mt-3 font-semibold text-slate-900">{formatCurrency(Number(room.pricePerDay ?? 0))}/day</p><p className="mt-1 line-clamp-2 text-sm text-slate-500">{room.description ?? "No description"}</p><div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => openEdit(room)}>Edit</Button><Button size="sm" variant="danger" onClick={() => window.confirm(`Delete room ${room.roomNumber}?`) && deleteMutation.mutate(room.id)}>Delete</Button></div></div></article>
          ))}</div>
        )}
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} title={editing ? "Edit Room" : "Add Room"}>
        <div className="space-y-4">{error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}<div className="grid gap-3 sm:grid-cols-2"><Field label="Room Number"><Input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} /></Field><Field label="Room Type"><Input value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })} /></Field></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Capacity"><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field><Field label="Price Per Day"><Input type="number" value={form.pricePerDay} onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })} /></Field></div><Field label="Description"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field><Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="AVAILABLE">Available</option><option value="RESERVED">Reserved</option><option value="OCCUPIED">Occupied</option><option value="CLEANING">Cleaning</option><option value="OUT_OF_SERVICE">Out of Service</option></Select></Field><div className="flex justify-end gap-3"><Button variant="ghost" onClick={closeModal}>Cancel</Button><Button disabled={!canSave} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>Save</Button></div></div>
      </Modal>
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>{children}</label>; }
