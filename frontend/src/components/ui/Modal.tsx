import type { ReactNode } from "react";

export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-glass dark:bg-dark" onClick={(e) => e.stopPropagation()}>
        {title ? <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3> : null}
        {children}
      </div>
    </div>
  );
}
