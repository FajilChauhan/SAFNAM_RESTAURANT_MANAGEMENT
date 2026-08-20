import type { ReactNode } from "react";

export interface StatItem {
  label: string;
  value: string | number;
  color?: string;      // e.g. "bg-emerald-50 border-emerald-100"
  textColor?: string;  // e.g. "text-emerald-700"
  sub?: string;
  icon?: ReactNode;
}

interface StatsGridProps {
  stats: StatItem[];
  /** Override number of columns on lg breakpoint, default = stats.length capped at 5 */
  cols?: 2 | 3 | 4 | 5;
  isLoading?: boolean;
}

const colMap: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-5",
};

export function StatsGrid({ stats, cols, isLoading }: StatsGridProps) {
  const effectiveCols = cols ?? (Math.min(stats.length, 5) as 2 | 3 | 4 | 5);
  const gridClass = colMap[effectiveCols] ?? colMap[4];

  return (
    <div className={`grid grid-cols-2 gap-4 ${gridClass}`}>
      {stats.map((s, idx) => (
        <div
          key={idx}
          className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between ${s.color ?? "bg-gray-50 border-gray-200"}`}
        >
          {isLoading ? (
            <div className="h-7 w-16 animate-pulse rounded bg-gray-200 mb-1" />
          ) : (
            <p className={`text-2xl md:text-3xl font-bold tracking-tight ${s.textColor ?? "text-gray-900"}`}>
              {s.value}
            </p>
          )}
          <p className="text-slate-600 font-medium text-xs md:text-sm mt-1">{s.label}</p>
          {s.sub && <p className="text-slate-400 text-xs mt-0.5">{s.sub}</p>}
        </div>
      ))}
    </div>
  );
}
