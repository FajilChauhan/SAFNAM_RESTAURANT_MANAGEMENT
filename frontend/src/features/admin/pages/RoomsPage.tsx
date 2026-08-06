import { PageHeader, StatusChip } from "@/components/ui";
import { useRooms } from "../hooks/useRooms";

export default function RoomsPage() {
  const { data } = useRooms();
  return (
    <div className="space-y-6">
      <PageHeader title="Rooms" subtitle="Manage hotel room inventory" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(data ?? []).map((room) => (
          <div key={room.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="h-40 bg-gradient-to-br from-emerald-100 to-amber-100 dark:from-emerald-950 dark:to-amber-950" />
            <div className="p-4">
              <p className="font-bold text-slate-900 dark:text-slate-100">{room.roomNumber}</p>
              <p className="text-sm text-slate-500">{room.roomType}</p>
              <p className="text-sm text-slate-500">{room.capacity} guests</p>
              <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">₹{room.pricePerDay}/night</p>
              <div className="mt-3"><StatusChip status={room.status} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

