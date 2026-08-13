import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { menuApi } from "@/api/menu.api";
import { Button, EmptyState, Input, Modal, PageHeader, Select, StatusChip } from "@/components/ui";
import { getErrorMessage } from "@/utils/formatters";
import { toast } from "@/utils/toast";

type Category = { id: string; name: string; description?: string; imageUrl?: string; displayOrder?: number; status?: string };
type Form = { name: string; description: string; displayOrder: string; status: string; imageUrl: string; imageFile: File | null };
const emptyForm: Form = { name: "", description: "", displayOrder: "0", status: "ACTIVE", imageUrl: "", imageFile: null };

export default function MenuCategoriesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [error, setError] = useState("");

  const categoriesQuery = useQuery({ queryKey: ["admin", "menu", "categories"], queryFn: async () => (await menuApi.getCategories()).data.data.categories as Category[] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.set("name", form.name.trim());
      if (form.description.trim()) payload.set("description", form.description.trim());
      payload.set("displayOrder", String(Number(form.displayOrder || 0)));
      payload.set("status", form.status);
      if (form.imageUrl.trim()) payload.set("imageUrl", form.imageUrl.trim());
      if (form.imageFile) payload.set("image", form.imageFile);
      return editing ? menuApi.updateCategory(editing.id, payload) : menuApi.createCategory(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "menu", "categories"] });
      toast.success(editing ? "Category updated successfully." : "Category created successfully.");
      closeModal();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteCategory(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "menu", "categories"] }); toast.success("Category deleted successfully."); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => menuApi.updateCategory(id, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "menu", "categories"] }); toast.success("Category status updated."); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(""); setIsOpen(true); };
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
    setError("");
    setIsOpen(true);
  };
  const closeModal = () => { setIsOpen(false); setEditing(null); setForm(emptyForm); setError(""); };

  const categories = categoriesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" subtitle="Manage SAFNAM menu category structure" />
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex justify-end"><Button onClick={openCreate} leftIcon={<Plus size={16} />}>Add Category</Button></div>
        {categoriesQuery.isError ? (
          <EmptyState title="Unable to load categories" description={getErrorMessage(categoriesQuery.error)} />
        ) : !categories.length && !categoriesQuery.isLoading ? (
          <EmptyState title="No categories" description="Create categories before adding menu items." />
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <article key={category.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                {category.imageUrl ? <img src={category.imageUrl} alt={category.name} className="h-28 w-full rounded-xl object-cover" /> : <div className="h-28 rounded-xl bg-slate-100" />}
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{category.name}</p>
                    <p className="line-clamp-2 text-sm text-slate-500">{category.description ?? "No description"}</p>
                  </div>
                  <StatusChip status={category.status ?? "ACTIVE"} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(category)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => statusMutation.mutate({ id: category.id, status: category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}>{category.status === "ACTIVE" ? "Deactivate" : "Activate"}</Button>
                  <Button size="sm" variant="danger" onClick={() => window.confirm(`Delete ${category.name}?`) && deleteMutation.mutate(category.id)}>Delete</Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} title={editing ? "Edit Category" : "Add Category"}>
        <div className="space-y-4">
          {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Description"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Display Order"><Input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} /></Field>
            <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></Select></Field>
          </div>
          <Field label="Image URL"><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></Field>
          <Field label="Upload Image"><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })} /></Field>
          <div className="flex justify-end gap-3"><Button variant="ghost" onClick={closeModal}>Cancel</Button><Button disabled={form.name.trim().length < 2} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>Save</Button></div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}
