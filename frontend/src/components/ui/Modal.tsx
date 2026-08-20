import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  panelClassName,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  panelClassName?: string;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className={cn("w-full max-w-lg rounded-3xl bg-white p-6 shadow-glass dark:bg-dark", panelClassName)} onClick={(e) => e.stopPropagation()}>
        {title ? <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3> : null}
        {children}
      </div>
    </div>
  );
}
