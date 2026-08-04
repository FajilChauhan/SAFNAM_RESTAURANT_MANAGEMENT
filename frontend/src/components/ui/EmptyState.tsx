import type { ReactNode } from "react";
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</div>
      <div className="max-w-md text-sm text-slate-600 dark:text-slate-400">{description}</div>
      {action}
    </div>
  );
}
