import { useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2, Power, PowerOff, Upload, X, HelpCircle, Loader2, Layers, Activity, Grid } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { floorApi } from "@/api/floor.api";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { getErrorMessage } from "@/utils/formatters";
import { toast } from "@/utils/toast";
import { useAuthStore } from "@/store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

type Floor = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder?: number;
  status?: "ACTIVE" | "INACTIVE";
  _count?: {
    tables: number;
  };
};

type FloorForm = {
  name: string;
  description: string;
  displayOrder: string;
  status: "ACTIVE" | "INACTIVE";
  imageUrl: string;
  imageFile: File | null;
};

const emptyForm: FloorForm = {
  name: "",
  description: "",
  displayOrder: "0",
  status: "ACTIVE",
  imageUrl: "",
  imageFile: null,
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=80";

export default function FloorsPage() {
  const queryClient = useQueryClient();
  const { hasPermission, user } = useAuthStore();
  // ADMIN bypasses all permission checks; others use explicit permission keys
  const isAdmin = user?.role === "ADMIN";
  const canCreate = isAdmin || hasPermission("operations.floors.create");
  const canUpdate = isAdmin || hasPermission("operations.floors.update");
  const canDelete = isAdmin || hasPermission("operations.floors.delete");

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Floor | null>(null);
  const [form, setForm] = useState<FloorForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImageDeleted, setIsImageDeleted] = useState(false);

  // Queries
  const floorsQuery = useQuery({
    queryKey: ["admin", "floors"],
    queryFn: async () => {
      const res = await floorApi.getFloors();
      return res.data.data.floors as Floor[];
    },
  });

  const floors = floorsQuery.data ?? [];

  // Filtered floors
  const filteredFloors = useMemo(() => {
    return floors.filter((f) => {
      const nameMatch = f.name.toLowerCase().includes(search.toLowerCase());
      const descMatch = (f.description ?? "").toLowerCase().includes(search.toLowerCase());
      return nameMatch || descMatch;
    });
  }, [floors, search]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async () => {
      setFormError("");
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("description", form.description.trim());
      payload.append("displayOrder", String(Number(form.displayOrder || 0)));
      payload.append("status", form.status);

      if (form.imageFile) {
        payload.append("image", form.imageFile);
      } else if (isImageDeleted) {
        payload.append("imageUrl", "");
      } else if (form.imageUrl.trim()) {
        payload.append("imageUrl", form.imageUrl.trim());
      } else if (editing?.imageUrl) {
        payload.append("imageUrl", editing.imageUrl);
      }

      if (editing) {
        return floorApi.updateFloor(editing.id, payload);
      } else {
        return floorApi.createFloor(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "floors"] });
      toast.success(editing ? "Floor updated successfully." : "Floor created successfully.");
      closeModal();
    },
    onError: (err) => {
      setFormError(getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => floorApi.deleteFloor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "floors"] });
      toast.success("Floor deleted successfully.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" }) => {
      const payload = new FormData();
      payload.append("status", status);
      return floorApi.updateFloor(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "floors"] });
      toast.success("Floor status updated.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Image Helper
  const getImageUrl = (url?: string) => {
    if (!url) return FALLBACK_IMAGE;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    return `${baseUrl.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setForm((prev) => ({ ...prev, imageFile: file, imageUrl: "" }));
      setPreviewUrl(URL.createObjectURL(file));
      setIsImageDeleted(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setForm((prev) => ({ ...prev, imageUrl: url, imageFile: null }));
    setPreviewUrl(url ? getImageUrl(url) : null);
    setIsImageDeleted(url ? false : true);
  };

  const clearImage = () => {
    setForm((prev) => ({ ...prev, imageFile: null, imageUrl: "" }));
    setPreviewUrl(null);
    setIsImageDeleted(true);
  };

  // Modal Handlers
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setPreviewUrl(null);
    setIsImageDeleted(false);
    setFormError("");
    setIsOpen(true);
  };

  const openEdit = (floor: Floor) => {
    setEditing(floor);
    setForm({
      name: floor.name,
      description: floor.description ?? "",
      displayOrder: String(floor.displayOrder ?? 0),
      status: floor.status ?? "ACTIVE",
      imageUrl: floor.imageUrl ?? "",
      imageFile: null,
    });
    setPreviewUrl(floor.imageUrl ? getImageUrl(floor.imageUrl) : null);
    setIsImageDeleted(false);
    setFormError("");
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setPreviewUrl(null);
    setIsImageDeleted(false);
    setFormError("");
  };

  const handleDelete = (floor: Floor) => {
    const count = floor._count?.tables ?? 0;
    if (count > 0) {
      toast.error(`This floor contains tables. Move or remove its tables before deleting the floor.`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete floor "${floor.name}"?`)) {
      deleteMutation.mutate(floor.id);
    }
  };

  const isFormValid = form.name.trim().length >= 2 && Number(form.displayOrder) >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Floors"
        subtitle="Manage restaurant floors and layout settings"
        actions={
          canCreate ? (
            <Button
              onClick={openCreate}
              leftIcon={<Plus size={16} />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Add Floor
            </Button>
          ) : undefined
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between transition-all"
        >
          <div className="space-y-1">
            <p className="text-sm text-gray-500 font-medium">Total Floors</p>
            <h4 className="text-2xl font-bold text-gray-900">{floors.length}</h4>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Layers size={22} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between transition-all"
        >
          <div className="space-y-1">
            <p className="text-sm text-gray-500 font-medium">Active Floors</p>
            <h4 className="text-2xl font-bold text-gray-900 font-semibold">
              {floors.filter((f) => f.status === "ACTIVE").length}
            </h4>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Activity size={22} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between transition-all"
        >
          <div className="space-y-1">
            <p className="text-sm text-gray-500 font-medium">Total Tables</p>
            <h4 className="text-2xl font-bold text-gray-900">
              {floors.reduce((sum, f) => sum + (f._count?.tables ?? 0), 0)}
            </h4>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Grid size={22} />
          </div>
        </motion.div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search floors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
          />
        </div>
      </div>

      {/* Main Grid View */}
      {floorsQuery.isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 animate-pulse">
              <div className="h-40 bg-gray-100 rounded-xl w-full" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 bg-gray-100 rounded w-1/4" />
                <div className="h-8 bg-gray-100 rounded-lg w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : floorsQuery.isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4">
            <HelpCircle className="h-10 w-10" />
          </div>
          <p className="text-lg font-semibold text-gray-900">Unable to load floors</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">{getErrorMessage(floorsQuery.error)}</p>
          <Button
            variant="outline"
            className="mt-6 border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={() => floorsQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : filteredFloors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="p-4 bg-gray-50 text-gray-400 rounded-full mb-4">
            <HelpCircle className="h-10 w-10" />
          </div>
          <p className="text-lg font-semibold text-gray-900">No floors found</p>
          <p className="text-sm text-gray-500 mt-1">Add floors to structure your dining layout.</p>
          {canCreate && (
            <Button
              className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={openCreate}
              leftIcon={<Plus size={16} />}
            >
              Add Floor
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFloors.map((floor) => (
            <motion.div
              key={floor.id}
              whileHover={{ y: -2 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all group"
            >
              {/* Card Image */}
              <div className="relative h-48 bg-gray-50 overflow-hidden border-b border-gray-100">
                <img
                  src={getImageUrl(floor.imageUrl)}
                  alt={floor.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                <div className="absolute top-3 right-3">
                  <StatusChip status={floor.status ?? "ACTIVE"} />
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                  Order: {floor.displayOrder ?? 0}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{floor.name}</h3>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {floor.description || "No description provided"}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">
                    Dining Tables: <strong className="text-gray-900">{floor._count?.tables ?? 0}</strong>
                  </span>

                  {/* Actions — only shown when permitted */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canUpdate && (
                      <button
                        onClick={() => openEdit(floor)}
                        className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        title="Edit Floor"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    {canUpdate && (
                      <button
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: floor.id,
                            status: floor.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                          })
                        }
                        className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        title={floor.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      >
                        {floor.status === "ACTIVE" ? <PowerOff size={14} className="text-amber-500" /> : <Power size={14} className="text-emerald-500" />}
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(floor)}
                        className="p-2 rounded-xl border border-gray-200 text-red-650 hover:bg-red-50 hover:text-red-700 transition-colors"
                        title="Delete Floor"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editing ? "Edit Floor" : "Add Floor"}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {formError && (
                  <div className="rounded-xl bg-red-50 border border-red-100 p-3.5 text-sm text-red-700 flex items-start gap-2">
                    <span className="mt-0.5">⚠️</span>
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Floor Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ground Floor, Rooftop"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Description
                  </label>
                  <textarea
                    placeholder="Provide details about this floor..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.displayOrder}
                      onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as "ACTIVE" | "INACTIVE" })}
                      className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Image Upload/Link Section */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Floor Layout Image
                  </label>
                  <div className="flex flex-col gap-3 p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                    {previewUrl ? (
                      <div className="relative h-32 w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="h-full w-full object-cover animate-fade-in"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors relative">
                        <Upload className="h-6 w-6 text-gray-400 mb-1" />
                        <span className="text-xs font-semibold text-gray-700">Choose file or drag here</span>
                        <span className="text-[10px] text-gray-450 mt-0.5">JPG, PNG, WEBP (Max 2MB)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    )}

                    <div className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      Or Link Image URL
                    </div>

                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={form.imageUrl}
                      onChange={handleUrlChange}
                      className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-4 flex justify-end gap-3 bg-white">
                <Button
                  variant="ghost"
                  onClick={closeModal}
                  className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm transition-all"
                >
                  Cancel
                </Button>
                <Button
                  disabled={!isFormValid}
                  loading={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Save
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
