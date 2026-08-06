import { Card, EmptyState } from "@/components/ui";

type RevenuePoint = { label: string; value: number };

export function RevenueChart({ points }: { points?: RevenuePoint[] }) {
  const max = Math.max(0, ...(points ?? []).map((point) => point.value));

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Revenue Overview</h3>
      </div>
      {!points?.length ? (
        <EmptyState title="No revenue data" description="The selected period did not return revenue points yet." />
      ) : (
        <div className="flex h-64 items-end gap-3">
          {points.map((point) => (
            <div key={point.label} className="flex-1">
              <div className="mb-2 text-center text-xs text-slate-500 dark:text-slate-400">{point.label}</div>
              <div
                className="rounded-t-2xl bg-gradient-to-t from-emerald-600 to-emerald-400"
                style={{ height: max ? `${(point.value / max) * 100}%` : "4px", minHeight: 4 }}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

