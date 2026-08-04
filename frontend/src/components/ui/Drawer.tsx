import type { ReactNode } from "react";
export function Drawer({ isOpen, children }: { isOpen: boolean; children: ReactNode }) {
  if (!isOpen) return null;
  return <aside className="fixed inset-y-0 right-0 z-50 w-80 bg-white p-4 shadow-glass dark:bg-dark">{children}</aside>;
}
