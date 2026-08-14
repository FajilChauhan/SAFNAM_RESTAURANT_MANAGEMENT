import { useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2, Power, PowerOff, HelpCircle, Loader2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { floorApi } from "@/api/floor.api";
import { tableApi } from "@/api/table.api";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { getErrorMessage } from "@/utils/formatters";
import { toast } from "@/utils/toast";

type Table = {
  id: string;
  floorId?: string;
  tableNumber: string;
  capacity: number;
  shape: "SQUARE" | "RECTANGLE" | "ROUND" | "OVAL";
  status: "AVAILABLE" | "RESERVED" | "OCCUPIED" | "BILLING" | "CLEANING" | "OUT_OF_SERVICE";
  floor?: {
    id: string;
    name: string;
  };
};

type Floor = {
  id: string;
  name: string;
  status?: string;
};

type TableForm = {
  floorId: string;
  tableNumber: string;
  capacity: string;
  shape: "SQUARE" | "RECTANGLE" | "ROUND" | "OVAL";
  status: "AVAILABLE" | "RESERVED" | "OCCUPIED" | "BILLING" | "CLEANING" | "OUT_OF_SERVICE";
};

const emptyForm = (defaultFloorId = ""): TableForm => ({
  floorId: defaultFloorId,
  tableNumber: "",
  capacity: "2",
  shape: "SQUARE",
  status: "AVAILABLE",
});

export default function TablesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Table | null>(null);
  const [form, setForm] = useState<TableForm>(emptyForm());
  const [search, setSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formError, setFormError] = useState("");

  // Queries
  const floorsQuery = useQuery({
    queryKey: ["admin", "floors"],
    queryFn: async () => {
      const res = await floorApi.getFloors();
      return res.data.data.floors as Floor[];
    },
  });

  const tablesQuery = useQuery({
    queryKey: ["admin", "tables"],
    queryFn: async () => {
      const res = await tableApi.getTables();
      return res.data.data.tables as Table[];
    },
  });

  const floors = (floorsQuery.data ?? []).filter((floor) => floor.status !== "INACTIVE");
  const tables = tablesQuery.data ?? [];

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const searchMatch = table.tableNumber.toLowerCase().includes(search.toLowerCase());
      
      const tableFloorId = table.floorId ?? table.floor?.id ?? "";
      const floorMatch = !floorFilter || tableFloorId === floorFilter;
      const statusMatch = !statusFilter || table.status === statusFilter;

      return searchMatch && floorMatch && statusMatch;
    });
  }, [tables, search, floorFilter, statusFilter]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async () => {
      setFormError("");
      const payload = {
        floorId: form.floorId,
        tableNumber: form.tableNumber.trim(),
        capacity: Number(form.capacity),
        shape: form.shape,
        status: form.status,
      };

      if (editing) {
        return tableApi.updateTable(editing.id, payload);
      } else {
        return tableApi.createTable(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tables"] });
      toast.success(editing ? "Table updated successfully." : "Table created successfully.");
      closeModal();
    },
    onError: (err) => {
      setFormError(getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tableApi.deleteTable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tables"] });
      toast.success("Table deleted successfully.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Table["status"] }) => {
      return tableApi.updateTable(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tables"] });
      toast.success("Table status updated.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Modal Handlers
  const openCreate = () => {
    if (floors.length === 0) {
      toast.error("Please create an active floor first before adding tables.");
      return;
    }
    setEditing(null);
    setForm(emptyForm(floors[0].id));
    setFormError("");
    setIsOpen(true);
  };

  const openEdit = (table: Table) => {
    setEditing(table);
    setForm({
      floorId: table.floorId ?? table.floor?.id ?? "",
      tableNumber: table.tableNumber,
      capacity: String(table.capacity),
      shape: table.shape ?? "SQUARE",
      status: table.status ?? "AVAILABLE",
    });
    setFormError("");
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
  };

  const handleDelete = (table: Table) => {
    if (window.confirm(`Are you sure you want to delete Table ${table.tableNumber}?`)) {
      deleteMutation.mutate(table.id);
    }
  };

  const isFormValid =
    form.floorId &&
    form.tableNumber.trim().length > 0 &&
    Number(form.capacity) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tables</h1>
          <p className="text-sm text-slate-500">Manage dining layout and table occupancy status</p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus size={16} />} className="bg-emerald-600 text-white hover:bg-emerald-700">
          Add Table
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All Floors</option>
            {floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="RESERVED">Reserved</option>
            <option value="CLEANING">Cleaning</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
          </select>
        </div>
      </div>

      {/* Main Tables Table/List View */}
      {tablesQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading tables...</p>
        </div>
      ) : tablesQuery.isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-semibold text-slate-700">Unable to load tables</p>
          <p className="text-xs text-slate-500 mt-1">{getErrorMessage(tablesQuery.error)}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => tablesQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm animate-fade-in">
          <HelpCircle className="h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No tables found</p>
          <p className="text-xs text-slate-500 mt-1">Add tables to assign guests and handle occupancy.</p>
          <Button size="sm" className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700" onClick={openCreate} leftIcon={<Plus size={16} />}>
            Add Table
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-150 bg-slate-50 text-xs font-semibold text-slate-650 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Table Number</th>
                  <th className="px-6 py-3.5">Floor</th>
                  <th className="px-6 py-3.5">Capacity</th>
                  <th className="px-6 py-3.5">Shape</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTables.map((table) => (
                  <tr key={table.id} className="hover:bg-slate-55/40 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      Table {table.tableNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {table.floor?.name || "No Floor"}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {table.capacity} Guests
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-550 capitalize">
                      {table.shape.toLowerCase()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusChip status={table.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(table)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                          title="Edit Table"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: table.id,
                              status: table.status === "OUT_OF_SERVICE" ? "AVAILABLE" : "OUT_OF_SERVICE",
                            })
                          }
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                          title={table.status === "OUT_OF_SERVICE" ? "Activate" : "Deactivate"}
                        >
                          {table.status === "OUT_OF_SERVICE" ? (
                            <Power size={13} className="text-emerald-500" />
                          ) : (
                            <PowerOff size={13} className="text-amber-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(table)}
                          className="p-1.5 rounded-lg border border-slate-200 text-red-650 hover:bg-red-50 hover:text-red-750 transition"
                          title="Delete Table"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Table Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editing ? "Edit Table" : "Add Table"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {formError && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-750 flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  Floor *
                </label>
                <select
                  value={form.floorId}
                  onChange={(e) => setForm({ ...form, floorId: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {floors.map((floor) => (
                    <option key={floor.id} value={floor.id}>
                      {floor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Table Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 101, T1"
                    value={form.tableNumber}
                    onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Seating Capacity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Table Shape
                  </label>
                  <select
                    value={form.shape}
                    onChange={(e) => setForm({ ...form, shape: e.target.value as Table["shape"] })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="SQUARE">Square</option>
                    <option value="RECTANGLE">Rectangle</option>
                    <option value="ROUND">Round</option>
                    <option value="OVAL">Oval</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Table["status"] })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="BILLING">Billing</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-5 flex justify-end gap-3 bg-white">
              <Button variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                disabled={!isFormValid}
                loading={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
