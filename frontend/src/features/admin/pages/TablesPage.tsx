import { useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2, Power, PowerOff, HelpCircle, Loader2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { floorApi } from "@/api/floor.api";
import { tableApi } from "@/api/table.api";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { getErrorMessage } from "@/utils/formatters";
import { toast } from "@/utils/toast";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";

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
  const { hasPermission, user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const canCreate = isAdmin || hasPermission("operations.tables.create");
  const canUpdate = isAdmin || hasPermission("operations.tables.update");
  const canDelete = isAdmin || hasPermission("operations.tables.delete");

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

  // Stats Grid calculation
  const totalTables = tables.length;
  const availableTables = tables.filter((t) => t.status === "AVAILABLE").length;
  const occupiedTables = tables.filter((t) => t.status === "OCCUPIED").length;
  const maintenanceTables = tables.filter((t) => t.status === "OUT_OF_SERVICE").length;

  const stats = [
    {
      label: "Total Tables",
      value: totalTables,
      color: "bg-gray-50 border-gray-100",
      textColor: "text-gray-900",
      sub: "Total dining tables",
    },
    {
      label: "Available Tables",
      value: availableTables,
      color: "bg-emerald-50 border-emerald-100",
      textColor: "text-emerald-700",
      sub: "Ready for guests",
    },
    {
      label: "Occupied Tables",
      value: occupiedTables,
      color: "bg-blue-50 border-blue-100",
      textColor: "text-blue-700",
      sub: "Currently dining",
    },
    {
      label: "Under Maintenance",
      value: maintenanceTables,
      color: "bg-red-50 border-red-100",
      textColor: "text-red-700",
      sub: "Out of service",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <PageHeader
        title="Tables"
        subtitle="Manage dining layout and table occupancy status"
        actions={
          canCreate ? (
            <Button
              onClick={openCreate}
              leftIcon={<Plus size={16} />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Add Table
            </Button>
          ) : undefined
        }
      />

      {/* Stats Grid */}
      <StatsGrid stats={stats} isLoading={tablesQuery.isLoading} />

      {/* Main Container wrapping Search/Filter and Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Search and Filters */}
        <div className="p-5 border-b border-gray-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="h-11 rounded-xl bg-gray-50 border border-gray-200 px-4 text-sm font-medium text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
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
              className="h-11 rounded-xl bg-gray-50 border border-gray-200 px-4 text-sm font-medium text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
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

        {/* Table/List View */}
        {tablesQuery.isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse w-full" />
            ))}
          </div>
        ) : tablesQuery.isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-semibold text-gray-750">Unable to load tables</p>
            <p className="text-xs text-gray-500 mt-1">{getErrorMessage(tablesQuery.error)}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => tablesQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <HelpCircle className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-900">No tables found</p>
            <p className="text-xs text-gray-500 mt-1">Add tables to assign guests and handle occupancy.</p>
            {canCreate && (
              <Button size="sm" className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700" onClick={openCreate} leftIcon={<Plus size={16} />}>
                Add Table
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-150 bg-gray-50/50">
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3 px-3 pl-6 text-left pt-4">Table Number</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3 px-3 text-left pt-4">Floor</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3 px-3 text-left pt-4">Capacity</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3 px-3 text-left pt-4">Shape</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3 px-3 text-left pt-4">Status</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3 px-3 text-right pr-6 pt-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTables.map((table) => (
                  <tr key={table.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-4 px-3 pl-6 font-semibold text-gray-900">
                      Table {table.tableNumber}
                    </td>
                    <td className="py-4 px-3 text-gray-650">
                      {table.floor?.name || "No Floor"}
                    </td>
                    <td className="py-4 px-3 font-medium text-gray-800">
                      {table.capacity} Guests
                    </td>
                    <td className="py-4 px-3 text-xs font-semibold text-gray-500 capitalize">
                      {table.shape.toLowerCase()}
                    </td>
                    <td className="py-4 px-3">
                      <StatusChip status={table.status} />
                    </td>
                    <td className="py-4 px-3 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canUpdate && (
                          <button
                            onClick={() => openEdit(table)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
                            title="Edit Table"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        {canUpdate && (
                          <button
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: table.id,
                                status: table.status === "OUT_OF_SERVICE" ? "AVAILABLE" : "OUT_OF_SERVICE",
                              })
                            }
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
                            title={table.status === "OUT_OF_SERVICE" ? "Activate" : "Deactivate"}
                          >
                            {table.status === "OUT_OF_SERVICE" ? (
                              <Power size={13} className="text-emerald-500" />
                            ) : (
                              <PowerOff size={13} className="text-amber-500" />
                            )}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(table)}
                            className="p-1.5 rounded-lg border border-gray-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                            title="Delete Table"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Table Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? "Edit Table" : "Add Table"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {formError && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600 flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Floor *
                </label>
                <select
                  value={form.floorId}
                  onChange={(e) => setForm({ ...form, floorId: e.target.value })}
                  className="w-full h-11 rounded-xl bg-gray-50 border border-gray-200 px-4 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
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
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                    Table Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 101, T1"
                    value={form.tableNumber}
                    onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                    className="w-full h-11 rounded-xl bg-gray-50 border border-gray-200 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                    Seating Capacity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full h-11 rounded-xl bg-gray-50 border border-gray-200 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                    Table Shape
                  </label>
                  <select
                    value={form.shape}
                    onChange={(e) => setForm({ ...form, shape: e.target.value as Table["shape"] })}
                    className="w-full h-11 rounded-xl bg-gray-50 border border-gray-200 px-4 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  >
                    <option value="SQUARE">Square</option>
                    <option value="RECTANGLE">Rectangle</option>
                    <option value="ROUND">Round</option>
                    <option value="OVAL">Oval</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Table["status"] })}
                    className="w-full h-11 rounded-xl bg-gray-50 border border-gray-200 px-4 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
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

            <div className="border-t border-gray-150 pt-4 mt-5 flex justify-end gap-3 bg-white">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                disabled={!isFormValid}
                loading={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
