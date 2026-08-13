import { Badge } from "./Badge";

const STATUS_MAP: Record<string, "success" | "danger" | "warning" | "info" | "gold" | "muted"> = {
  // Booking statuses
  PENDING: "warning",
  CONFIRMED: "info",
  CHECKED_IN: "success",
  COMPLETED: "muted",
  CANCELLED: "danger",
  NO_SHOW: "danger",
  // Order/kitchen statuses
  PREPARING: "gold",
  READY: "success",
  SERVED: "muted",
  // Table/room statuses
  AVAILABLE: "success",
  OCCUPIED: "danger",
  RESERVED: "info",
  MAINTENANCE: "warning",
  CLEANING: "warning",
  OUT_OF_SERVICE: "danger",
  // User statuses
  ACTIVE: "success",
  BLOCKED: "danger",
  INACTIVE: "muted",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked In",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  MAINTENANCE: "Maintenance",
  CLEANING: "Cleaning",
  OUT_OF_SERVICE: "Out of Service",
  ACTIVE: "Active",
  BLOCKED: "Blocked",
  INACTIVE: "Inactive",
};

export function StatusChip({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_MAP[status] ?? "muted"}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
