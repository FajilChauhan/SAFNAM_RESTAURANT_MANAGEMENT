import { useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2, Power, PowerOff, Upload, X, HelpCircle, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { menuApi } from "@/api/menu.api";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { getErrorMessage } from "@/utils/formatters";
import { toast } from "@/utils/toast";
import { useAuthStore } from "@/store/authStore";

type Category = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder?: number;
  status?: "ACTIVE" | "INACTIVE";
  _count?: {
    items: number;
  };
};

type CategoryForm = {
  name: string;
  description: string;
  displayOrder: string;
  status: "ACTIVE" | "INACTIVE";
  imageUrl: string;
  imageFile: File | null;
};

const emptyForm: CategoryForm = {
  name: "",
  description: "",
  displayOrder: "0",
  status: "ACTIVE",
  imageUrl: "",
  imageFile: null,
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80";

export default function MenuCategoriesPage() {
  const queryClient = useQueryClient();
  const { hasPermission, user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const canCreate = isAdmin || hasPermission("operations.categories.create");
  const canUpdate = isAdmin || hasPermission("operations.categories.update");
  const canDelete = isAdmin || hasPermission("operations.categories.delete");

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImageDeleted, setIsImageDeleted] = useState(false);

  // Queries
  const categoriesQuery = useQuery({
    queryKey: ["admin", "menu", "categories"],
    queryFn: async () => {
      const res = await menuApi.getCategories();
      return res.data.data.categories as Category[];
    },
  });

  const categories = categoriesQuery.data ?? [];

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(search.toLowerCase());
      const descMatch = (c.description ?? "").toLowerCase().includes(search.toLowerCase());
      return nameMatch || descMatch;
    });
  }, [categories, search]);

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
        return menuApi.updateCategory(editing.id, payload);
      } else {
        return menuApi.createCategory(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu", "categories"] });
      toast.success(editing ? "Category updated successfully." : "Category created successfully.");
      closeModal();
    },
    onError: (err) => {
      setFormError(getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu", "categories"] });
      toast.success("Category deleted successfully.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" }) => {
      const payload = new FormData();
      payload.append("status", status);
      return menuApi.updateCategory(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu", "categories"] });
      toast.success("Category status updated.");
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

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description ?? "",
      displayOrder: String(category.displayOrder ?? 0),
      status: category.status ?? "ACTIVE",
      imageUrl: category.imageUrl ?? "",
      imageFile: null,
    });
    setPreviewUrl(category.imageUrl ? getImageUrl(category.imageUrl) : null);
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

  const handleDelete = (category: Category) => {
    const count = category._count?.items ?? 0;
    if (count > 0) {
      toast.error(`Category "${category.name}" contains ${count} menu items. Move or remove those items before deleting.`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const isFormValid = form.name.trim().length >= 2 && Number(form.displayOrder) >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Categories"
        subtitle="Manage food menu categories"
        actions={
          canCreate ? (
            <Button onClick={openCreate} leftIcon={<Plus size={16} />} className="bg-emerald-600 text-white hover:bg-emerald-700">
              Add Category
            </Button>
          ) : undefined
        }
      />

      {/* Filter and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Main Grid View */}
      {categoriesQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading categories...</p>
        </div>
      ) : categoriesQuery.isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-semibold text-slate-700">Unable to load categories</p>
          <p className="text-xs text-slate-500 mt-1">{getErrorMessage(categoriesQuery.error)}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => categoriesQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
          <HelpCircle className="h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No categories found</p>
          <p className="text-xs text-slate-500 mt-1">Add categories to organize your menu items.</p>
          {canCreate && (
            <Button size="sm" className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700" onClick={openCreate} leftIcon={<Plus size={16} />}>
              Add Category
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition duration-200"
            >
              {/* Card Image */}
              <div className="relative h-40 bg-slate-100 overflow-hidden border-b border-slate-100">
                <img
                  src={getImageUrl(category.imageUrl)}
                  alt={category.name}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                <div className="absolute top-3 right-3">
                  <StatusChip status={category.status ?? "ACTIVE"} />
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Order: {category.displayOrder ?? 0}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{category.name}</h3>
                  <p className="text-xs text-slate-550 mt-1 line-clamp-2 leading-relaxed">
                    {category.description || "No description provided"}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Menu Items: <strong className="text-slate-800">{category._count?.items ?? 0}</strong>
                  </span>

                  {/* Actions — only shown when permitted */}
                  <div className="flex items-center gap-1.5">
                    {canUpdate && (
                      <button
                        onClick={() => openEdit(category)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                        title="Edit Category"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                    {canUpdate && (
                      <button
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: category.id,
                            status: category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                          })
                        }
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                        title={category.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      >
                        {category.status === "ACTIVE" ? <PowerOff size={13} className="text-amber-500" /> : <Power size={13} className="text-emerald-500" />}
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 hover:text-red-750 transition"
                        title="Delete Category"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
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
                {editing ? "Edit Category" : "Add Category"}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Appetizers, Desserts"
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
                  placeholder="Provide a short description..."
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
                  Category Image
                </label>
                <div className="flex flex-col gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                  {previewUrl ? (
                    <div className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-full w-full object-cover animate-fade-in"
                        crossOrigin="anonymous"
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
