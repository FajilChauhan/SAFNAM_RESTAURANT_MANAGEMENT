import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { floorApi } from "@/api/floor.api";
import { tableApi } from "@/api/table.api";
import { Button, EmptyState, Input, Modal, PageHeader, Select, StatusChip } from "@/components/ui";
import { getErrorMessage } from "@/utils/formatters";

type Table = { id: string; floorId?: string; tableNumber: string; capacity: number; shape?: string; status: string; floor?: { id: string; name: string } };
type Floor = { id: string; name: string; status?: string };
type Form = { floorId: string; tableNumber: string; capacity: string; shape: string; status: string };
const emptyForm: Form = { floorId: "", tableNumber: "", capacity: "2", shape: "SQUARE", status: "AVAILABLE" };

export default function TablesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Table | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [error, setError] = useState("");
  const floorsQuery = useQuery({ queryKey: ["admin", "floors"], queryFn: async () => (await floorApi.getFloors()).data.data.floors as Floor[] });
  const tablesQuery = useQuery({ queryKey: ["admin", "tables"], queryFn: async () => (await tableApi.getTables()).data.data.tables as Table[] });
  const floors = (floorsQuery.data ?? []).filter((floor) => floor.status !== "INACTIVE");
  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { floorId: form.floorId, tableNumber: form.tableNumber.trim(), capacity: Number(form.capacity), shape: form.shape, status: form.status };
      return editing ? tableApi.updateTable(editing.id, payload) : tableApi.createTable(payload);
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin", "tables"] }); closeModal(); },
    onError: (err) => setError(getErrorMessage(err)),
  });
  const deleteMutation = useMutation({ mutationFn: (id: string) => tableApi.deleteTable(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "tables"] }) });
  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, floorId: floors[0]?.id ?? "" }); setError(""); setIsOpen(true); };
  const openEdit = (table: Table) => { setEditing(table); setForm({ floorId: table.floorId ?? table.floor?.id ?? "", tableNumber: table.tableNumber, capacity: String(table.capacity), shape: table.shape ?? "SQUARE", status: table.status }); setError(""); setIsOpen(true); };
  const closeModal = () => { setIsOpen(false); setEditing(null); setForm(emptyForm); setError(""); };
  const tables = tablesQuery.data ?? [];
  const canSave = form.floorId && form.tableNumber.trim() && Number(form.capacity) > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Tables" subtitle="Manage seating layout and table availability" />
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex justify-end"><Button onClick={openCreate} disabled={!floors.length} leftIcon={<Plus size={16} />}>Add Table</Button></div>
        {!floors.length && !floorsQuery.isLoading ? <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Create an active floor before adding tables.</p> : null}
        {tablesQuery.isError ? <EmptyState title="Unable to load tables" description={getErrorMessage(tablesQuery.error)} /> : !tables.length && !tablesQuery.isLoading ? <EmptyState title="No tables" description="Add dining tables to manage reservations and occupancy." /> : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{tables.map((table) => (
            <article key={table.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-lg font-semibold text-slate-900">Table {table.tableNumber}</p><p className="text-sm text-slate-500">{table.floor?.name ?? "No floor"}</p><p className="text-sm text-slate-500">Capacity: {table.capacity}</p><p className="text-sm text-slate-500">Shape: {table.shape ?? "-"}</p><div className="mt-3"><StatusChip status={table.status} /></div><div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => openEdit(table)}>Edit</Button><Button size="sm" variant="danger" onClick={() => window.confirm(`Delete table ${table.tableNumber}?`) && deleteMutation.mutate(table.id)}>Delete</Button></div></article>
          ))}</div>
        )}
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} title={editing ? "Edit Table" : "Add Table"}>
        <div className="space-y-4">{error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}<Field label="Floor"><Select value={form.floorId} onChange={(e) => setForm({ ...form, floorId: e.target.value })}>{floors.map((floor) => <option key={floor.id} value={floor.id}>{floor.name}</option>)}</Select></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Table Number"><Input value={form.tableNumber} onChange={(e) => setForm({ ...form, tableNumber: e.target.value })} /></Field><Field label="Capacity"><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Shape"><Select value={form.shape} onChange={(e) => setForm({ ...form, shape: e.target.value })}><option value="SQUARE">Square</option><option value="RECTANGLE">Rectangle</option><option value="ROUND">Round</option><option value="OVAL">Oval</option></Select></Field><Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="AVAILABLE">Available</option><option value="RESERVED">Reserved</option><option value="OCCUPIED">Occupied</option><option value="BILLING">Billing</option><option value="CLEANING">Cleaning</option><option value="OUT_OF_SERVICE">Out of Service</option></Select></Field></div><div className="flex justify-end gap-3"><Button variant="ghost" onClick={closeModal}>Cancel</Button><Button disabled={!canSave} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>Save</Button></div></div>
      </Modal>
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>{children}</label>; }
