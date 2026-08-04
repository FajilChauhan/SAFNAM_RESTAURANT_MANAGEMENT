import type { SelectHTMLAttributes } from "react";
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-950" {...props} />;
}
