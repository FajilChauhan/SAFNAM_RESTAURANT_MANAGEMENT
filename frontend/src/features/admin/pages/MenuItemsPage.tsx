import { useMemo, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { menuApi } from "@/api/menu.api";
import { Button, EmptyState, Input, Modal, PageHeader, Select, StatusChip } from "@/components/ui";
import { formatCurrency, getErrorMessage } from "@/utils/formatters";
import { toast } from "@/utils/toast";

type MenuItem = {
  id: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: string | number;
  preparationTimeMin?: number;
  imageUrl?: string;
  foodType?: string;
  spicyLevel?: string;
  status?: string;
  isTodaySpecial?: boolean;
  isAvailable?: boolean;
  category?: { id?: string; name: string };
};
type Category = { id: string; name: string; status?: string };
type Form = {
  categoryId: string;
  name: string;
  description: string;
  price: string;
  preparationTimeMin: string;
  imageUrl: string;
  imageFile: File | null;
  foodType: string;
  spicyLevel: string;
  status: string;
  isTodaySpecial: boolean;
  isAvailable: boolean;
};
const emptyForm: Form = { categoryId: "", name: "", description: "", price: "", preparationTimeMin: "15", imageUrl: "", imageFile: null, foodType: "VEG", spicyLevel: "NONE", status: "ACTIVE", isTodaySpecial: false, isAvailable: true };

export default function MenuItemsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [error, setError] = useState("");

  const categoriesQuery = useQuery({ queryKey: ["admin", "menu", "categories"], queryFn: async () => (await menuApi.getCategories()).data.data.categories as Category[] });
  const itemsQuery = useQuery({ queryKey: ["admin", "menu", "items"], queryFn: async () => (await menuApi.getItems()).data.data.items as MenuItem[] });

  const categories = useMemo(() => (categoriesQuery.data ?? []).filter((item) => item.status !== "INACTIVE"), [categoriesQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.set("categoryId", form.categoryId);
      fd.set("name", form.name.trim());
      if (form.description.trim()) fd.set("description", form.description.trim());
      fd.set("price", form.price);
      fd.set("preparationTimeMin", form.preparationTimeMin);
      if (form.imageUrl.trim()) fd.set("imageUrl", form.imageUrl.trim());
      if (form.imageFile) fd.set("image", form.imageFile);
      fd.set("foodType", form.foodType);
      fd.set("spicyLevel", form.spicyLevel);
      fd.set("status", form.status);
      fd.set("isTodaySpecial", String(form.isTodaySpecial));
      fd.set("isAvailable", String(form.isAvailable));
      return editing ? menuApi.updateItem(editing.id, fd) : menuApi.createItem(fd);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "menu", "items"] });
      toast.success(editing ? "Menu item updated successfully." : "Menu item created successfully.");
      closeModal();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteItem(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "menu", "items"] }); toast.success("Menu item deleted successfully."); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const availabilityMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => menuApi.updateAvailability(id, value),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "menu", "items"] }); toast.success("Menu availability updated."); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      const fd = new FormData();
      fd.set("status", status);
      return menuApi.updateItem(id, fd);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "menu", "items"] }); toast.success("Menu item status updated."); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
    setError("");
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
    setError("");
    setIsOpen(true);
  };
  const closeModal = () => { setIsOpen(false); setEditing(null); setForm(emptyForm); setError(""); };

  const items = itemsQuery.data ?? [];
  const canSave = form.categoryId && form.name.trim().length >= 2 && Number(form.price) > 0 && Number(form.preparationTimeMin) > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Menu Items" subtitle="Manage food items, prices, and availability" />
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex justify-end"><Button onClick={openCreate} leftIcon={<Plus size={16} />}>Add Menu Item</Button></div>
        {!categories.length && !categoriesQuery.isLoading ? <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Create an active category before adding menu items.</p> : null}
        {itemsQuery.isError ? (
          <EmptyState title="Unable to load menu items" description={getErrorMessage(itemsQuery.error)} />
        ) : !items.length && !itemsQuery.isLoading ? (
          <EmptyState title="No menu items" description="Menu items will appear here after you add real SAFNAM foods." />
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr><th className="rounded-l-xl px-4 py-3">Item</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="rounded-r-xl px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="px-4 py-4"><div className="font-semibold text-slate-900">{item.name}</div><div className="text-xs text-slate-500">{item.preparationTimeMin ?? 0} mins {item.isTodaySpecial ? "· Today's special" : ""}</div></td>
                    <td className="px-4 py-4 text-slate-600">{item.category?.name ?? "-"}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{formatCurrency(Number(item.price ?? 0))}</td>
                    <td className="px-4 py-4 text-slate-600">{item.foodType ?? "-"}</td>
                    <td className="px-4 py-4"><StatusChip status={item.isAvailable ? "AVAILABLE" : "UNAVAILABLE"} /></td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(item)}>Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => availabilityMutation.mutate({ id: item.id, value: !item.isAvailable })}>{item.isAvailable ? "Disable" : "Enable"}</Button>
                        <Button size="sm" variant="ghost" onClick={() => statusMutation.mutate({ id: item.id, status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}>{item.status === "ACTIVE" ? "Deactivate" : "Activate"}</Button>
                        <Button size="sm" variant="danger" onClick={() => window.confirm(`Delete ${item.name}?`) && deleteMutation.mutate(item.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} title={editing ? "Edit Menu Item" : "Add Menu Item"}>
        <div className="space-y-4">
          {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <Field label="Category"><Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></Field>
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Description"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Price"><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field><Field label="Preparation Minutes"><Input type="number" value={form.preparationTimeMin} onChange={(e) => setForm({ ...form, preparationTimeMin: e.target.value })} /></Field></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Food Type"><Select value={form.foodType} onChange={(e) => setForm({ ...form, foodType: e.target.value })}><option value="VEG">Veg</option><option value="NON_VEG">Non-Veg</option></Select></Field>
            <Field label="Spicy Level"><Select value={form.spicyLevel} onChange={(e) => setForm({ ...form, spicyLevel: e.target.value })}><option value="NONE">None</option><option value="MILD">Mild</option><option value="MEDIUM">Medium</option><option value="HOT">Hot</option><option value="EXTRA_HOT">Extra Hot</option></Select></Field>
          </div>
          <Field label="Image URL"><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></Field>
          <Field label="Upload Image"><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} /> Available</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.isTodaySpecial} onChange={(e) => setForm({ ...form, isTodaySpecial: e.target.checked })} /> Today's Special</label>
          </div>
          <div className="flex justify-end gap-3"><Button variant="ghost" onClick={closeModal}>Cancel</Button><Button disabled={!canSave} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>Save</Button></div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}
