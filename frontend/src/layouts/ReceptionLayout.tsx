import type { ReactNode } from "react";
import { LayoutTemplate } from "lucide-react";
export function ReceptionLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-surface p-4 dark:bg-dark">{children}</div>;
}
