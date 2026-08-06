import type { ReactNode } from "react";
import { EmptyState, Button } from "@/components/ui";
import { AlertTriangle } from "lucide-react";

export function AdminSectionFallback({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const action: ReactNode = onAction && actionLabel ? (
    <Button variant="outline" onClick={onAction}>
      {actionLabel}
    </Button>
  ) : undefined;

  return (
    <EmptyState
      title={title}
      description={description}
      action={<div className="mt-4 flex items-center gap-3">{action}</div>}
    />
  );
}

export function AdminErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="grid place-items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-950/20">
      <AlertTriangle className="h-10 w-10 text-red-500" />
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Something went wrong</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{message}</p>
      </div>
      <Button variant="danger" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

