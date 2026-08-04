import type { ReactNode } from "react";
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl text-slate-900 dark:text-slate-100">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}
