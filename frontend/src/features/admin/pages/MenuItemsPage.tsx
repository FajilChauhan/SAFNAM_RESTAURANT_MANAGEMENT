import { useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2, Power, PowerOff, Upload, X, HelpCircle, Loader2, Sparkles, Flame } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { menuApi } from "@/api/menu.api";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { getErrorMessage, formatCurrency } from "@/utils/formatters";
import { toast } from "@/utils/toast";
import { Link } from "react-router-dom";

type MenuItem = {
  id: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: string | number;
  preparationTimeMin?: number;
  imageUrl?: string;
  foodType?: "VEG" | "NON_VEG";
  spicyLevel?: "NONE" | "MILD" | "MEDIUM" | "HOT" | "EXTRA_HOT";
  status?: "ACTIVE" | "INACTIVE";
  isTodaySpecial?: boolean;
  isAvailable?: boolean;
  category?: { id?: string; name: string };
};

type Category = {
  id: string;
  name: string;
  status?: string;
};

type MenuItemForm = {
  categoryId: string;
  name: string;
  description: string;
  price: string;
  preparationTimeMin: string;
  imageUrl: string;
  imageFile: File | null;
  foodType: "VEG" | "NON_VEG";
  spicyLevel: "NONE" | "MILD" | "MEDIUM" | "HOT" | "EXTRA_HOT";
  status: "ACTIVE" | "INACTIVE";
  isTodaySpecial: boolean;
  isAvailable: boolean;
};

const emptyForm = (defaultCategoryId = ""): MenuItemForm => ({
  categoryId: defaultCategoryId,
  name: "",
  description: "",
  price: "",
  preparationTimeMin: "15",
  imageUrl: "",
  imageFile: null,
  foodType: "VEG",
  spicyLevel: "NONE",
  status: "ACTIVE",
  isTodaySpecial: false,
  isAvailable: true,
});

export default function MenuItemsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuItemForm>(emptyForm());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [foodTypeFilter, setFoodTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [availFilter, setAvailFilter] = useState("");
  const [formError, setFormError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Queries
  const categoriesQuery = useQuery({
    queryKey: ["admin", "menu", "categories"],
    queryFn: async () => {
      const res = await menuApi.getCategories();
      return res.data.data.categories as Category[];
    },
  });

  const itemsQuery = useQuery({
    queryKey: ["admin", "menu", "items"],
    queryFn: async () => {
      const res = await menuApi.getItems();
      return res.data.data.items as MenuItem[];
    },
  });

  const activeCategories = useMemo(() => {
    return (categoriesQuery.data ?? []).filter((c) => c.status !== "INACTIVE");
  }, [categoriesQuery.data]);

  const items = itemsQuery.data ?? [];

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(search.toLowerCase());
      const descMatch = (item.description ?? "").toLowerCase().includes(search.toLowerCase());
      const searchMatch = nameMatch || descMatch;

      const catId = item.categoryId ?? item.category?.id ?? "";
      const catMatch = !categoryFilter || catId === categoryFilter;
      const typeMatch = !foodTypeFilter || item.foodType === foodTypeFilter;
      const statusMatch = !statusFilter || item.status === statusFilter;
      
      let availMatch = true;
      if (availFilter === "AVAILABLE") availMatch = Boolean(item.isAvailable);
      if (availFilter === "UNAVAILABLE") availMatch = !item.isAvailable;

      return searchMatch && catMatch && typeMatch && statusMatch && availMatch;
    });
  }, [items, search, categoryFilter, foodTypeFilter, statusFilter, availFilter]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async () => {
      setFormError("");
      const payload = new FormData();
      payload.append("categoryId", form.categoryId);
      payload.append("name", form.name.trim());
      payload.append("description", form.description.trim());
      payload.append("price", String(Number(form.price)));
      payload.append("preparationTimeMin", String(Number(form.preparationTimeMin)));
      payload.append("foodType", form.foodType);
      payload.append("spicyLevel", form.spicyLevel);
      payload.append("status", form.status);
      payload.append("isTodaySpecial", String(form.isTodaySpecial));
      payload.append("isAvailable", String(form.isAvailable));

      if (form.imageFile) {
        payload.append("image", form.imageFile);
      } else if (form.imageUrl.trim()) {
        payload.append("imageUrl", form.imageUrl.trim());
      } else if (editing?.imageUrl) {
        // Keep existing image
        payload.append("imageUrl", editing.imageUrl);
      }

      if (editing) {
        return menuApi.updateItem(editing.id, payload);
      } else {
        return menuApi.createItem(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu", "items"] });
      toast.success(editing ? "Menu item updated successfully." : "Menu item created successfully.");
      closeModal();
    },
    onError: (err) => {
      setFormError(getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu", "items"] });
      toast.success("Menu item deleted successfully.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const availabilityMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => menuApi.updateAvailability(id, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu", "items"] });
      toast.success("Menu availability updated.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" }) => {
      const payload = new FormData();
      payload.append("status", status);
      return menuApi.updateItem(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu", "items"] });
      toast.success("Menu item status updated.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Image Helper
  const getImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    return `${baseUrl.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setForm((prev) => ({ ...prev, imageFile: file, imageUrl: "" }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setForm((prev) => ({ ...prev, imageUrl: url, imageFile: null }));
    setPreviewUrl(url ? getImageUrl(url) : null);
  };

  const clearImage = () => {
    setForm((prev) => ({ ...prev, imageFile: null, imageUrl: "" }));
    setPreviewUrl(null);
  };

  // Modals Handlers
  const openCreate = () => {
    if (activeCategories.length === 0) {
      toast.error("Create at least one active category first.");
      return;
    }
    setEditing(null);
    setForm(emptyForm(activeCategories[0].id));
    setPreviewUrl(null);
    setFormError("");
    setIsOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({
      categoryId: item.categoryId ?? item.category?.id ?? "",
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      preparationTimeMin: String(item.preparationTimeMin ?? 15),
      imageUrl: item.imageUrl ?? "",
      imageFile: null,
      foodType: item.foodType ?? "VEG",
      spicyLevel: item.spicyLevel ?? "NONE",
      status: item.status ?? "ACTIVE",
      isTodaySpecial: Boolean(item.isTodaySpecial),
      isAvailable: item.isAvailable ?? true,
    });
    setPreviewUrl(item.imageUrl ? getImageUrl(item.imageUrl) : null);
    setFormError("");
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setForm(emptyForm());
    setPreviewUrl(null);
    setFormError("");
  };

  const handleDelete = (item: MenuItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const isFormValid =
    form.categoryId &&
    form.name.trim().length >= 2 &&
    Number(form.price) >= 0 &&
    Number(form.preparationTimeMin) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Menu Items</h1>
          <p className="text-sm text-slate-500">Create and manage the SAFNAM food menu</p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus size={16} />}>
          Add Menu Item
        </Button>
      </div>

      {/* Warnings */}
      {activeCategories.length === 0 && !categoriesQuery.isLoading && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-amber-800 font-medium">
            ⚠️ No active categories available. You must create an active category before you can add menu items.
          </p>
          <Link to="/admin/categories" className="inline-flex shrink-0">
            <Button size="sm" variant="outline">
              Manage Categories
            </Button>
          </Link>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All Categories</option>
            {(categoriesQuery.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Food Type */}
          <select
            value={foodTypeFilter}
            onChange={(e) => setFoodTypeFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All Food Types</option>
            <option value="VEG">Veg</option>
            <option value="NON_VEG">Non-Veg</option>
          </select>

          {/* Availability */}
          <select
            value={availFilter}
            onChange={(e) => setAvailFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All Availability</option>
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {itemsQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
            <p className="text-sm text-slate-500">Loading menu items...</p>
          </div>
        ) : itemsQuery.isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-semibold text-slate-700">Unable to load menu items</p>
            <p className="text-xs text-slate-500 mt-1">{getErrorMessage(itemsQuery.error)}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => itemsQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <HelpCircle className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No menu items found</p>
            <p className="text-xs text-slate-500 mt-1">Get started by creating real foods for SAFNAM.</p>
            <Button size="sm" className="mt-4" onClick={openCreate} leftIcon={<Plus size={16} />}>
              Add Menu Item
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3.5 font-semibold">Image</th>
                  <th className="px-6 py-3.5 font-semibold">Item Name</th>
                  <th className="px-6 py-3.5 font-semibold">Category</th>
                  <th className="px-6 py-3.5 font-semibold">Type</th>
                  <th className="px-6 py-3.5 font-semibold">Price</th>
                  <th className="px-6 py-3.5 font-semibold">Availability</th>
                  <th className="px-6 py-3.5 font-semibold">Special</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-100 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            src={getImageUrl(item.imageUrl)}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <HelpCircle className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">
                          {item.description || "No description"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-650 font-medium">
                      {item.category?.name ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {/* Food Type Indicator (Veg: green box/circle, Non-Veg: red/brown) */}
                        <div
                          className={`h-4 w-4 border-2 flex items-center justify-center flex-shrink-0 ${
                            item.foodType === "VEG" ? "border-emerald-600" : "border-red-800"
                          }`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.foodType === "VEG" ? "bg-emerald-600" : "bg-red-800"
                            }`}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">
                          {item.foodType === "VEG" ? "Veg" : "Non-Veg"}
                        </span>
                        {item.spicyLevel && item.spicyLevel !== "NONE" && (
                          <div className="flex items-center gap-0.5 text-amber-600 ml-1" title={`Spicy Level: ${item.spicyLevel}`}>
                            <Flame size={12} className="fill-amber-500" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrency(Number(item.price))}
                    </td>
                    <td className="px-6 py-4">
                      <StatusChip status={item.isAvailable ? "AVAILABLE" : "UNAVAILABLE"} />
                    </td>
                    <td className="px-6 py-4">
                      {item.isTodaySpecial ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-100">
                          <Sparkles size={11} className="fill-amber-400" /> Special
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusChip status={item.status ?? "ACTIVE"} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                          title="Edit Item"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() =>
                            availabilityMutation.mutate({
                              id: item.id,
                              value: !item.isAvailable,
                            })
                          }
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                          title={item.isAvailable ? "Set Unavailable" : "Set Available"}
                        >
                          {item.isAvailable ? <PowerOff size={14} className="text-amber-500" /> : <Power size={14} className="text-emerald-500" />}
                        </button>
                        <button
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: item.id,
                              status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                            })
                          }
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                          title={item.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        >
                          {item.status === "ACTIVE" ? <PowerOff size={14} className="text-red-400" /> : <Power size={14} className="text-emerald-500" />}
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg border border-slate-200 text-red-650 hover:bg-red-50 hover:text-red-700 transition"
                          title="Delete Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editing ? "Edit Menu Item" : "Add Menu Item"}
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
                  Item Category *
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {activeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Butter Chicken, Paneer Tikka"
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
                  placeholder="Describe the taste, ingredients, or preparation..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Price (INR) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="250"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Prep Time (minutes) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.preparationTimeMin}
                    onChange={(e) => setForm({ ...form, preparationTimeMin: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Food Type
                  </label>
                  <select
                    value={form.foodType}
                    onChange={(e) => setForm({ ...form, foodType: e.target.value as "VEG" | "NON_VEG" })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="VEG">Veg</option>
                    <option value="NON_VEG">Non-Veg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Spicy Level
                  </label>
                  <select
                    value={form.spicyLevel}
                    onChange={(e) => setForm({ ...form, spicyLevel: e.target.value as any })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="NONE">None</option>
                    <option value="MILD">Mild</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HOT">Hot</option>
                    <option value="EXTRA_HOT">Extra Hot</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                  />
                  <span>Is Available</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isTodaySpecial}
                    onChange={(e) => setForm({ ...form, isTodaySpecial: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                  />
                  <span>Today's Special</span>
                </label>
              </div>

              {/* Status */}
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

              {/* Image Upload/Link Section */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Item Image
                </label>
                <div className="flex flex-col gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                  {previewUrl ? (
                    <div className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-full w-full object-cover animate-fade-in"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500";
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
