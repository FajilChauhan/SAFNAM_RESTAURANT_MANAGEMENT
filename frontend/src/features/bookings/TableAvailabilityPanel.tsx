import { useQuery } from "@tanstack/react-query";
import { Clock, Loader2, AlertCircle, CheckCircle, CalendarX } from "lucide-react";
import { bookingApi, type TableSlotAvailability, type TableSlotBooking } from "@/api/booking.api";
import { cn } from "@/utils/cn";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(t: string) {
  if (!t) return "-";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TableAvailabilityPanelProps {
  tableId: string;
  date: string;
  /** Called when user clicks an available slot — auto-populates start/end time */
  onSlotSelect?: (startTime: string, endTime: string) => void;
  /** Highlight the currently selected slot */
  selectedStartTime?: string;
  selectedEndTime?: string;
  className?: string;
}

// ─── Slot row sub-component ───────────────────────────────────────────────────
function SlotRow({
  startTime,
  endTime,
  type,
  booking,
  isSelected,
  onClick,
}: {
  startTime: string;
  endTime: string;
  type: "available" | "booked" | "occupied";
  booking?: TableSlotBooking;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  const label = `${fmtTime(startTime)} – ${fmtTime(endTime)}`;

  if (type === "available") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition",
          isSelected
            ? "border-emerald-500 bg-emerald-100 text-emerald-800 font-semibold ring-1 ring-emerald-400"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer",
        )}
      >
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          {label}
        </span>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
          {isSelected ? "Selected ✓" : "Available"}
        </span>
      </button>
    );
  }

  if (type === "occupied") {
    return (
      <div className="w-full flex flex-col gap-0.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            {label}
          </span>
          <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
            Occupied
          </span>
        </div>
        {booking && (
          <p className="text-xs text-amber-600 ml-4 mt-0.5">
            {booking.bookingNumber} · {booking.customerName}
          </p>
        )}
      </div>
    );
  }

  // booked / reserved
  return (
    <div className="w-full flex flex-col gap-0.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-red-700">
          <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
          {label}
        </span>
        <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
          Booked
        </span>
      </div>
      {booking && (
        <p className="text-xs text-red-500 ml-4 mt-0.5">
          {booking.bookingNumber} · {booking.customerName}
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function TableAvailabilityPanel({
  tableId,
  date,
  onSlotSelect,
  selectedStartTime,
  selectedEndTime,
  className,
}: TableAvailabilityPanelProps) {
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["booking-slot-avail", tableId, date],
    queryFn: async () => {
      const { data } = await bookingApi.getTableSlotAvailability(tableId, date);
      return data.data.availability;
    },
    enabled: Boolean(tableId) && Boolean(date),
    staleTime: 15_000,
  });

  if (!tableId || !date) return null;

  if (isLoading) {
    return (
      <div className={cn("rounded-2xl border border-slate-100 bg-slate-50 p-4", className)}>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={14} className="animate-spin" />
          Loading table availability…
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={cn("rounded-2xl border border-red-100 bg-red-50 p-4", className)}>
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={14} />
          Could not load availability. Please try again.
        </div>
      </div>
    );
  }

  const avail: TableSlotAvailability = data;

  // Build unified timeline
  type Entry = {
    startTime: string;
    endTime: string;
    type: "available" | "booked" | "occupied";
    booking?: TableSlotBooking;
  };

  const timeline: Entry[] = [];

  for (const slot of avail.availableSlots) {
    timeline.push({ startTime: slot.startTime, endTime: slot.endTime, type: "available" });
  }
  for (const b of avail.bookings) {
    timeline.push({
      startTime: b.startTime,
      endTime: b.endTime,
      type: b.status === "CHECKED_IN" ? "occupied" : "booked",
      booking: b,
    });
  }
  timeline.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  return (
    <div className={cn("rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-slate-500" />
          <span className="text-sm font-semibold text-slate-800">
            Table {avail.table.tableNumber} · {avail.table.floor.name}
          </span>
          {isFetching && <Loader2 size={12} className="animate-spin text-slate-400" />}
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {fmtTime(avail.openingTime)} – {fmtTime(avail.closingTime)}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Active occupancy banner */}
        {avail.activeOccupancy && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-sm font-bold text-red-700">🔴 Currently Occupied</p>
            </div>
            <div className="text-xs text-red-600 space-y-0.5 ml-4">
              <p><span className="font-medium">Guest:</span> {avail.activeOccupancy.customerName}</p>
              <p><span className="font-medium">Since:</span> {fmtDateTime(avail.activeOccupancy.occupiedAt)}</p>
              <p><span className="font-medium">Expected Release:</span> {fmtTime(avail.activeOccupancy.expectedEndTime)}</p>
              <p className="text-xs text-red-400 mt-0.5">{avail.activeOccupancy.bookingNumber}</p>
            </div>
          </div>
        )}

        {/* Business hours note */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <CheckCircle size={11} className="text-slate-400" />
          Restaurant hours: {fmtTime(avail.openingTime)} — {fmtTime(avail.closingTime)}
          {onSlotSelect && (
            <span className="ml-auto text-emerald-600 font-medium">Click a slot to select it</span>
          )}
        </div>

        {/* Slots timeline */}
        {timeline.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-3 justify-center">
            <CalendarX size={14} />
            No time slots in business hours for this date.
          </div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
            {timeline.map((entry, i) => (
              <SlotRow
                key={i}
                startTime={entry.startTime}
                endTime={entry.endTime}
                type={entry.type}
                booking={entry.booking}
                isSelected={
                  entry.type === "available" &&
                  entry.startTime === selectedStartTime &&
                  entry.endTime === selectedEndTime
                }
                onClick={
                  entry.type === "available" && onSlotSelect
                    ? () => onSlotSelect(entry.startTime, entry.endTime)
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-400">Legend:</span>
          {[
            { color: "bg-emerald-500", label: "Available" },
            { color: "bg-red-500", label: "Booked" },
            { color: "bg-amber-500", label: "Occupied" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={cn("h-2 w-2 rounded-full", color)} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
