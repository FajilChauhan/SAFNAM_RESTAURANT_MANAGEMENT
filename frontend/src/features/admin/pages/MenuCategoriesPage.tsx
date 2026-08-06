import { PageHeader } from "@/components/ui";
import { useMenuCategories } from "../hooks/useMenuAdmin";

export default function MenuCategoriesPage() {
  const { data } = useMenuCategories();
  return (
    <div className="space-y-6">
      <PageHeader title="Menu Categories" subtitle="Manage restaurant category structure" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(data ?? []).map((category) => (
          <div key={category.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800" />
            <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">{category.name}</p>
            <p className="text-sm text-slate-500">{category.description ?? "No description"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

