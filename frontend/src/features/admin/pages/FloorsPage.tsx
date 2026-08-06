import { PageHeader } from "@/components/ui";
import { useFloors } from "../hooks/useTables";

export default function FloorsPage() {
  const { data } = useFloors();
  return (
    <div className="space-y-6">
      <PageHeader title="Floors" subtitle="Manage floor layout" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(data ?? []).map((floor) => (
          <div key={floor.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{floor.name}</p>
            <p className="text-sm text-slate-500">Level {floor.level}</p>
            <p className="text-sm text-slate-500">{floor.tableCount ?? 0} tables</p>
          </div>
        ))}
      </div>
    </div>
  );
}

