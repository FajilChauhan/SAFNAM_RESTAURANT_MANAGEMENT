import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type BadgeVariant = "success" | "danger" | "warning" | "info" | "gold" | "muted";

export function Badge({ variant = "muted", children }: { variant?: BadgeVariant; children: ReactNode }) {
  const variants: Record<BadgeVariant, string> = {
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    warning: "bg-warning/10 text-warning",
    info: "bg-primary-100 text-primary-700",
    gold: "bg-secondary-100 text-secondary-800",
    muted: "bg-slate-100 text-slate-600",
  };
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", variants[variant])}>{children}</span>;
}
