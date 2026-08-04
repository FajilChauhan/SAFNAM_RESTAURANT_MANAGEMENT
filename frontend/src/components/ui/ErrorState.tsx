import type { ReactNode } from "react";
export function ErrorState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-8 text-center">
      <div className="font-semibold text-danger">{message}</div>
      {action}
    </div>
  );
}
