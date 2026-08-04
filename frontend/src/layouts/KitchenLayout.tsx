import type { ReactNode } from "react";
export function KitchenLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-surface p-4 dark:bg-dark">{children}</div>;
}
