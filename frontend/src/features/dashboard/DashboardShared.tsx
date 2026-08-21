import type { ReactNode } from "react";
import { RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

export const formatMoney = (value?: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value ?? 0);

export const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString() : "-");

// Error State
export function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Failed to load dashboard</h2>
        <p className="mt-2 text-sm text-gray-500">Could not connect to the server. Please try again.</p>
        <button
          type="button"
          onClick={onRetry}
          className="mx-auto mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
        >
          <RefreshCw size={15} />
          Try Again
        </button>
      </div>
    </div>
  );
}

// Loading Skeleton
export function DashboardSkeleton({ dark = false, columns = 4 }: { dark?: boolean; columns?: number }) {
  const bg = dark ? "bg-gray-800" : "bg-gray-200";
  const card = dark ? "bg-gray-800/60" : "bg-white";
  return (
    <div className={cn("space-y-6 animate-pulse", dark ? "p-4" : "")}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className={cn("h-7 rounded-xl w-48", bg)} />
          <div className={cn("h-4 rounded w-64", dark ? "bg-gray-800" : "bg-gray-100")} />
        </div>
        <div className={cn("h-9 rounded-xl w-24", bg)} />
      </div>
      <div className={cn("grid gap-4", columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className={cn("h-32 rounded-2xl", bg)} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className={cn("lg:col-span-2 h-72 rounded-2xl", bg)} />
        <div className={cn("h-72 rounded-2xl", bg)} />
      </div>
      <div className={cn("rounded-2xl p-5 border", card, dark ? "border-gray-700" : "border-gray-100")}>
        <div className={cn("h-6 rounded-xl w-36 mb-4", bg)} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 py-4 border-b border-gray-50 last:border-0">
            <div className={cn("w-8 h-8 rounded-xl flex-shrink-0", bg)} />
            <div className="flex-1 space-y-2">
              <div className={cn("h-4 rounded w-48", bg)} />
              <div className={cn("h-3 rounded w-32", dark ? "bg-gray-800" : "bg-gray-100")} />
            </div>
            <div className={cn("h-6 rounded-full w-20 self-center", bg)} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Refresh Line
export function RefreshLine({
  generatedAt,
  isFetching,
  onRefresh,
  dark = false,
}: {
  generatedAt?: string;
  isFetching: boolean;
  onRefresh: () => void;
  dark?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-end gap-3 text-xs", dark ? "text-gray-400" : "text-gray-500")}>
      <span>Last updated: {generatedAt ? new Date(generatedAt).toLocaleTimeString() : "-"}</span>
      <button
        type="button"
        onClick={onRefresh}
        className={cn(
          "rounded-xl border p-2 transition-all hover:scale-105",
          dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-50",
        )}
      >
        <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
      </button>
    </div>
  );
}

// Stat Card
export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "emerald",
  dark = false,
  trend,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: "emerald" | "amber" | "blue" | "purple" | "red" | "gray" | "orange";
  dark?: boolean;
  trend?: number | null;
}) {
  const iconTones: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    gray: "bg-gray-100 text-gray-600",
    orange: "bg-orange-50 text-orange-600",
  };
  const darkIconTones: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    blue: "bg-blue-500/10 text-blue-400",
    purple: "bg-purple-500/10 text-purple-400",
    red: "bg-red-500/10 text-red-400",
    gray: "bg-gray-800 text-gray-400",
    orange: "bg-orange-500/10 text-orange-400",
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md",
        dark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white",
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", dark ? darkIconTones[tone] : iconTones[tone])}>
          {icon}
        </div>
        {trend !== null && trend !== undefined && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
              trend >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600",
            )}
          >
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className={cn("text-2xl font-bold", dark ? "text-white" : "text-gray-900")}>{value}</div>
      <p className={cn("mt-1 text-sm", dark ? "text-gray-400" : "text-gray-500")}>{label}</p>
      {sub && <p className={cn("mt-0.5 text-xs", dark ? "text-gray-500" : "text-gray-400")}>{sub}</p>}
    </motion.div>
  );
}

// Status Pill
export function StatusPill({ status }: { status?: string }) {
  const normalized = status?.toUpperCase() ?? "UNKNOWN";
  const colorMap: [RegExp, string][] = [
    [/PAID|SUCCESS|AVAILABLE|ACTIVE|CHECKED_IN/, "bg-green-100 text-green-700"],
    [/CONFIRMED/, "bg-blue-100 text-blue-700"],
    [/PENDING|RESERVED|PROCESSING/, "bg-amber-100 text-amber-700"],
    [/PREPARING/, "bg-blue-100 text-blue-700"],
    [/READY/, "bg-emerald-100 text-emerald-700"],
    [/OCCUPIED|FAILED|CANCELLED|INACTIVE/, "bg-red-100 text-red-700"],
    [/SERVED|CHECKED_OUT|COMPLETED/, "bg-gray-100 text-gray-600"],
    [/CLEANING|MAINTENANCE/, "bg-yellow-100 text-yellow-700"],
  ];
  let color = "bg-gray-100 text-gray-600";
  for (const [pattern, cls] of colorMap) {
    if (pattern.test(normalized)) { color = cls; break; }
  }
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", color)}>
      {normalized.replace(/_/g, " ")}
    </span>
  );
}
