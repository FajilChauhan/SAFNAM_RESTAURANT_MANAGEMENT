import type { ReactNode } from "react";
export function Tooltip({ children }: { children: ReactNode }) {
  return <span title={typeof children === "string" ? children : undefined}>{children}</span>;
}
