import { PageHeader, StatusChip } from "@/components/ui";
import { useTables } from "../hooks/useTables";

export default function TablesPage() {
  const { data } = useTables();
  return (
    <div className="space-y-6">
      <PageHeader title="Tables" subtitle="Manage seating layout and availability" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {(data ?? []).map((table) => (
          <div key={table.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">T-{table.tableNumber}</p>
            <p className="text-sm text-slate-500">Capacity: {table.capacity}</p>
            <div className="mt-3"><StatusChip status={table.status} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

