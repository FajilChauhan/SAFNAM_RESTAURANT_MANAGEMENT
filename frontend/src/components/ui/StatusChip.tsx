import { Badge } from "./Badge";

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, "success" | "danger" | "warning" | "info" | "gold" | "muted"> = {
    PENDING: "warning",
    CONFIRMED: "info",
    CHECKED_IN: "success",
    CHECKED_OUT: "muted",
    CANCELLED: "danger",
    PREPARING: "gold",
    READY: "success",
    SERVED: "muted",
    AVAILABLE: "success",
    OCCUPIED: "danger",
    RESERVED: "info",
    MAINTENANCE: "warning",
  };

  return <Badge variant={map[status] ?? "muted"}>{status}</Badge>;
}
