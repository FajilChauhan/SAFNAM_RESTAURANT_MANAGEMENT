import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";

export const formatMoney = (value?: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value ?? 0);

export const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString() : "-");

export function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-[60vh] bg-gray-50 p-6 dark:bg-gray-950">
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm dark:border-red-500/20 dark:bg-gray-900">
          <div className="mb-4 text-5xl">!</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Failed to load dashboard</h2>
          <p className="mt-2 text-gray-500">Could not connect to server</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-xl bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton({ dark = false, columns = 4 }: { dark?: boolean; columns?: number }) {
  return (
    <div className={cn("min-h-screen p-6", dark ? "bg-gray-950" : "bg-gray-50")}>
      <div className={cn("mb-6 h-36 animate-pulse rounded-3xl", dark ? "bg-gray-800" : "bg-white")} />
      <div className={cn("grid gap-4", columns === 3 ? "md:grid-cols-3" : "md:grid-cols-4")}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className={cn("h-28 animate-pulse rounded-2xl", dark ? "bg-gray-800" : "bg-white")} />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={cn("h-80 animate-pulse rounded-2xl", dark ? "bg-gray-800" : "bg-white")} />
        <div className={cn("h-80 animate-pulse rounded-2xl", dark ? "bg-gray-800" : "bg-white")} />
      </div>
    </div>
  );
}

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
        className={cn("rounded-xl border px-3 py-2", dark ? "border-gray-700 hover:bg-gray-900" : "border-gray-200 hover:bg-white")}
      >
        <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
      </button>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "emerald",
  dark = false,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: "emerald" | "amber" | "blue" | "purple" | "red" | "gray";
  dark?: boolean;
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
    red: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <div className={cn("rounded-2xl border p-5 shadow-sm", dark ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-white")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn("text-sm", dark ? "text-gray-400" : "text-gray-500")}>{label}</p>
          <div className={cn("mt-2 text-2xl font-bold", dark ? "text-white" : "text-gray-900")}>{value}</div>
        </div>
        {icon ? <div className={cn("rounded-2xl p-3", tones[tone])}>{icon}</div> : null}
      </div>
      {sub ? <p className={cn("mt-3 text-xs", dark ? "text-gray-500" : "text-gray-500")}>{sub}</p> : null}
    </div>
  );
}

export function StatusPill({ status }: { status?: string }) {
  const normalized = status?.toUpperCase() ?? "UNKNOWN";
  const color =
    normalized.includes("PAID") || normalized.includes("READY") || normalized.includes("SUCCESS") || normalized.includes("AVAILABLE")
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
      : normalized.includes("PENDING") || normalized.includes("RESERVED") || normalized.includes("PROCESSING")
        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
        : normalized.includes("OCCUPIED") || normalized.includes("FAILED")
          ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", color)}>{normalized}</span>;
}
