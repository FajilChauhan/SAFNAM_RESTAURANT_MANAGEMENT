import { Card } from "@/components/ui";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { label: string; direction: "up" | "down" };
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
            <Icon size={24} />
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        {trend ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
              trend.direction === "up"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
            }`}
          >
            {trend.direction === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.label}
          </span>
        ) : null}
      </div>
    </Card>
  );
}

