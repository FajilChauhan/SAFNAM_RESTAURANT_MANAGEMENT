import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { floorApi } from "@/api/floor.api";
import { restaurantApi } from "@/api/restaurant.api";
import { Button, EmptyState, Input, Modal, PageHeader, Select, StatusChip } from "@/components/ui";
import { getErrorMessage } from "@/utils/formatters";

type Floor = { id: string; name: string; description?: string; displayOrder?: number; status?: string; tables?: unknown[] };
type Form = { name: string; description: string; displayOrder: string; status: string };
const emptyForm: Form = { name: "", description: "", displayOrder: "0", status: "ACTIVE" };

export default function FloorsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Floor | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [error, setError] = useState("");
  const restaurantQuery = useQuery({ queryKey: ["restaurant"], queryFn: async () => (await restaurantApi.getInfo()).data.data.restaurant });
  const floorsQuery = useQuery({ queryKey: ["admin", "floors"], queryFn: async () => (await floorApi.getFloors()).data.data.floors as Floor[] });
  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { restaurantId: restaurantQuery.data?.id, name: form.name.trim(), description: form.description.trim() || undefined, displayOrder: Number(form.displayOrder || 0), status: form.status };
      if (!payload.restaurantId && !editing) throw new Error("Restaurant setup is required before creating floors");
      return editing ? floorApi.updateFloor(editing.id, payload) : floorApi.createFloor(payload);
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin", "floors"] }); closeModal(); },
    onError: (err) => setError(getErrorMessage(err)),
  });
  const deleteMutation = useMutation({ mutationFn: (id: string) => floorApi.deleteFloor(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "floors"] }) });
  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(""); setIsOpen(true); };
  const openEdit = (floor: Floor) => { setEditing(floor); setForm({ name: floor.name, description: floor.description ?? "", displayOrder: String(floor.displayOrder ?? 0), status: floor.status ?? "ACTIVE" }); setError(""); setIsOpen(true); };
  const closeModal = () => { setIsOpen(false); setEditing(null); setForm(emptyForm); setError(""); };
  const floors = floorsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Floors" subtitle="Manage SAFNAM floor layout" />
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex justify-end"><Button onClick={openCreate} leftIcon={<Plus size={16} />}>Add Floor</Button></div>
        {floorsQuery.isError ? <EmptyState title="Unable to load floors" description={getErrorMessage(floorsQuery.error)} /> : !floors.length && !floorsQuery.isLoading ? <EmptyState title="No floors" description="Create floors before assigning dining tables." /> : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{floors.map((floor) => (
            <article key={floor.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{floor.name}</p><p className="text-sm text-slate-500">{floor.description ?? "No description"}</p><p className="mt-2 text-sm text-slate-600">{floor.tables?.length ?? 0} tables</p></div><StatusChip status={floor.status ?? "ACTIVE"} /></div>
              <div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => openEdit(floor)}>Edit</Button><Button size="sm" variant="danger" onClick={() => window.confirm(`Delete ${floor.name}?`) && deleteMutation.mutate(floor.id)}>Delete</Button></div>
            </article>
          ))}</div>
        )}
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} title={editing ? "Edit Floor" : "Add Floor"}>
        <div className="space-y-4">{error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}<Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Description"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Display Order"><Input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} /></Field><Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></Select></Field></div><div className="flex justify-end gap-3"><Button variant="ghost" onClick={closeModal}>Cancel</Button><Button disabled={form.name.trim().length < 2} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>Save</Button></div></div>
      </Modal>
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>{children}</label>; }
