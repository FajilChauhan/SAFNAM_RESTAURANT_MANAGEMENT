import { useQuery } from "@tanstack/react-query";
import { BedDouble, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { bookingApi, type RoomDateAvailability } from "@/api/booking.api";
import { cn } from "@/utils/cn";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RoomAvailabilityPanelProps {
  roomId: string;
  checkIn: string;   // YYYY-MM-DD
  checkOut: string;  // YYYY-MM-DD
  /** Notifies parent whether the room is available so it can block form submission */
  onAvailabilityChange?: (available: boolean) => void;
  className?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function RoomAvailabilityPanel({
  roomId,
  checkIn,
  checkOut,
  onAvailabilityChange,
  className,
}: RoomAvailabilityPanelProps) {
  const enabled =
    Boolean(roomId) &&
    Boolean(checkIn) &&
    Boolean(checkOut) &&
    new Date(checkOut) > new Date(checkIn);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["booking-room-avail", roomId, checkIn, checkOut],
    queryFn: async () => {
      const { data } = await bookingApi.getRoomDateAvailability(roomId, checkIn, checkOut);
      const avail = data.data.availability;
      onAvailabilityChange?.(avail.available);
      return avail;
    },
    enabled,
    staleTime: 15_000,
  });

  if (!enabled) return null;

  if (isLoading) {
    return (
      <div className={cn("rounded-2xl border border-slate-100 bg-slate-50 p-4", className)}>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={14} className="animate-spin" />
          Checking room availability…
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={cn("rounded-2xl border border-red-100 bg-red-50 p-4", className)}>
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={14} />
          Could not check availability. Please try again.
        </div>
      </div>
    );
  }

  const avail: RoomDateAvailability = data;

  return (
    <div className={cn("rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <BedDouble size={14} className="text-slate-500" />
          <span className="text-sm font-semibold text-slate-800">
            Room {avail.room.roomNumber} · {avail.room.roomType}
          </span>
          {isFetching && <Loader2 size={12} className="animate-spin text-slate-400" />}
        </div>
        <span className="text-xs text-slate-500">Cap. {avail.room.capacity}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Requested stay period */}
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2">
          <CheckCircle size={12} className="text-slate-400" />
          <span>Requested Stay:</span>
          <span className="font-semibold">{fmtDate(checkIn)}</span>
          <span className="text-slate-400">→</span>
          <span className="font-semibold">{fmtDate(checkOut)}</span>
        </div>

        {/* Active occupancy — highest priority */}
        {avail.activeOccupancy && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-sm font-bold text-red-700">🔴 Room Currently Occupied</p>
            </div>
            <div className="text-xs text-red-600 space-y-0.5 ml-4">
              <p><span className="font-medium">Guest:</span> {avail.activeOccupancy.guestName}</p>
              <p><span className="font-medium">Checked In:</span> {fmtDateTime(avail.activeOccupancy.checkedInAt)}</p>
              <p><span className="font-medium">Expected Checkout:</span> {fmtDateTime(avail.activeOccupancy.expectedCheckoutAt)}</p>
              <p><span className="font-medium">Payment:</span> {avail.activeOccupancy.paymentStatus}</p>
              <p className="text-xs text-red-400 mt-0.5">{avail.activeOccupancy.bookingNumber}</p>
            </div>
          </div>
        )}

        {/* Conflicting future bookings */}
        {!avail.activeOccupancy && avail.conflictingBookings.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
              Conflicting Bookings
            </p>
            {avail.conflictingBookings.map((b) => (
              <div
                key={b.bookingId}
                className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-red-700">{b.bookingNumber}</span>
                  <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                    {b.status}
                  </span>
                </div>
                <p className="text-xs text-red-500 mt-0.5">
                  {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)} · {b.customerName}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Availability status badge */}
        {avail.available ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
            <p className="text-sm font-semibold text-emerald-700">
              🟢 Available for selected dates
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
            <p className="text-sm font-semibold text-red-700">
              Not available — please select different dates
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
