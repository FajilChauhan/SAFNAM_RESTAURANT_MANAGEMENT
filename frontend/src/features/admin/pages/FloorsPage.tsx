import { useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2, Power, PowerOff, Upload, X, HelpCircle, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { floorApi } from "@/api/floor.api";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { getErrorMessage } from "@/utils/formatters";
import { toast } from "@/utils/toast";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Floors</h1>
          <p className="text-sm text-slate-500">Manage restaurant floors and layout settings</p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus size={16} />} className="bg-emerald-600 text-white hover:bg-emerald-700">
          Add Floor
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search floors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Main Grid View */}
      {floorsQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading floors...</p>
        </div>
      ) : floorsQuery.isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-semibold text-slate-700">Unable to load floors</p>
          <p className="text-xs text-slate-500 mt-1">{getErrorMessage(floorsQuery.error)}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => floorsQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : filteredFloors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
          <HelpCircle className="h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No floors found</p>
          <p className="text-xs text-slate-500 mt-1">Add floors to structure your dining layout.</p>
          <Button size="sm" className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700" onClick={openCreate} leftIcon={<Plus size={16} />}>
            Add Floor
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFloors.map((floor) => (
            <div
              key={floor.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition duration-200"
            >
              {/* Card Image */}
              <div className="relative h-48 bg-slate-100 overflow-hidden border-b border-slate-100">
                <img
                  src={getImageUrl(floor.imageUrl)}
                  alt={floor.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                <div className="absolute top-3 right-3">
                  <StatusChip status={floor.status ?? "ACTIVE"} />
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Order: {floor.displayOrder ?? 0}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{floor.name}</h3>
                  <p className="text-xs text-slate-550 mt-1 line-clamp-2 leading-relaxed">
                    {floor.description || "No description provided"}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Dining Tables: <strong className="text-slate-800">{floor._count?.tables ?? 0}</strong>
                  </span>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(floor)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                      title="Edit Floor"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() =>
                        toggleStatusMutation.mutate({
                          id: floor.id,
                          status: floor.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                        })
                      }
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                      title={floor.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    >
                      {floor.status === "ACTIVE" ? <PowerOff size={13} className="text-amber-500" /> : <Power size={13} className="text-emerald-500" />}
                    </button>
                    <button
                      onClick={() => handleDelete(floor)}
                      className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 hover:text-red-750 transition"
                      title="Delete Floor"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editing ? "Edit Floor" : "Add Floor"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {formError && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700 flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  Floor Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ground Floor, Rooftop"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Provide details about this floor..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as "ACTIVE" | "INACTIVE" })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Image Upload/Link Section */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Floor Layout Image
                </label>
                <div className="flex flex-col gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                  {previewUrl ? (
                    <div className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
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
                        className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/60 text-white hover:bg-black/80 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-white hover:bg-slate-50/50 transition relative">
                      <Upload className="h-6 w-6 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">Choose file or drag here</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP (Max 2MB)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    Or Link Image URL
                  </div>

                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    value={form.imageUrl}
                    onChange={handleUrlChange}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-850 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4 flex justify-end gap-3 bg-white">
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
