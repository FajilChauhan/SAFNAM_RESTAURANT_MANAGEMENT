import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none transition focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100", className)} {...props} />;
}
