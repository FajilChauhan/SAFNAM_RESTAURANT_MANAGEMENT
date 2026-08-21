import { useState, useMemo } from "react";
import {
  Plus, Search, Edit2, Trash2, Power, PowerOff,
  Upload, X, HelpCircle, Loader2, BedDouble, CheckCircle2, AlertTriangle, Activity
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { roomApi } from "@/api/room.api";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatCurrency, getErrorMessage } from "@/utils/formatters";
import { toast } from "@/utils/toast";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";

// ─── Types ────────────────────────────────────────────────────────────────────
type RoomStatus = "AVAILABLE" | "RESERVED" | "OCCUPIED" | "CLEANING" | "OUT_OF_SERVICE";

type Room = {
  id: string;
  roomNumber: string;
  roomType: string;
  capacity: number;
  pricePerDay: string | number;
  description?: string;
  imageUrl?: string | null;
  status: RoomStatus;
};

type RoomForm = {
  roomNumber: string;
  roomType: string;
  capacity: string;
  pricePerDay: string;
  description: string;
  imageUrl: string;
  imageFile: File | null;
  status: RoomStatus;
};

const emptyForm: RoomForm = {
  roomNumber: "",
  roomType: "",
  capacity: "2",
  pricePerDay: "",
  description: "",
  imageUrl: "",
  imageFile: null,
  status: "AVAILABLE",
};

const ROOM_TYPES = [
  "Standard",
  "Deluxe",
  "Suite",
  "Family",
  "Presidential",
  "Executive",
  "Banquet Hall",
  "Private Dining",
  "Other",
];

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80";

// ─── Image URL helper ─────────────────────────────────────────────────────────
const getImageUrl = (url?: string | null): string => {
  if (!url) return FALLBACK_IMAGE;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function RoomsPage() {
  const queryClient = useQueryClient();
  const { hasPermission, user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const canCreate = isAdmin || hasPermission("operations.rooms.create");
  const canUpdate = isAdmin || hasPermission("operations.rooms.update");
  const canDelete = isAdmin || hasPermission("operations.rooms.delete");

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImageDeleted, setIsImageDeleted] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ── Query ──────────────────────────────────────────────────────────────────
  const roomsQuery = useQuery({
    queryKey: ["admin", "rooms"],
    queryFn: async () => {
      const res = await roomApi.getRooms();
      return res.data.data.rooms as Room[];
    },
  });

  const rooms = roomsQuery.data ?? [];

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const q = search.toLowerCase();
      const textMatch =
        r.roomNumber.toLowerCase().includes(q) ||
        r.roomType.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q);
      const statusMatch = !statusFilter || r.status === statusFilter;
      return textMatch && statusMatch;
    });
  }, [rooms, search, statusFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    return {
      total: rooms.length,
      available: rooms.filter((r) => r.status === "AVAILABLE").length,
      occupied: rooms.filter((r) => r.status === "OCCUPIED").length,
      cleaningOrOos: rooms.filter((r) => r.status === "CLEANING" || r.status === "OUT_OF_SERVICE").length,
    };
  }, [rooms]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      setFormError("");
      const payload = new FormData();
      payload.append("roomNumber", form.roomNumber.trim());
      payload.append("roomType", form.roomType.trim());
      payload.append("capacity", String(Number(form.capacity)));
      payload.append("pricePerDay", String(Number(form.pricePerDay)));
      payload.append("status", form.status);
      if (form.description.trim()) payload.append("description", form.description.trim());

      if (form.imageFile) {
        payload.append("image", form.imageFile);
      } else if (isImageDeleted) {
        payload.append("imageUrl", "");
      } else if (form.imageUrl.trim()) {
        payload.append("imageUrl", form.imageUrl.trim());
      } else if (editing?.imageUrl) {
        // preserve existing image — don't send imageUrl so backend keeps it
      }

      return editing
        ? roomApi.updateRoom(editing.id, payload)
        : roomApi.createRoom(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "rooms"] });
      toast.success(editing ? "Room updated successfully." : "Room created successfully.");
      closeModal();
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roomApi.deleteRoom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "rooms"] });
      toast.success("Room deleted successfully.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RoomStatus }) =>
      roomApi.updateRoom(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "rooms"] });
      toast.success("Room status updated.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // ── Image handlers ─────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setForm((f) => ({ ...f, imageFile: file, imageUrl: "" }));
      setPreviewUrl(URL.createObjectURL(file));
      setIsImageDeleted(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setForm((f) => ({ ...f, imageUrl: url, imageFile: null }));
    setPreviewUrl(url ? getImageUrl(url) : null);
    setIsImageDeleted(!url);
  };

  const clearImage = () => {
    setForm((f) => ({ ...f, imageFile: null, imageUrl: "" }));
    setPreviewUrl(null);
    setIsImageDeleted(true);
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setPreviewUrl(null);
    setIsImageDeleted(false);
    setFormError("");
    setIsOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditing(room);
    setForm({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      capacity: String(room.capacity),
      pricePerDay: String(room.pricePerDay),
      description: room.description ?? "",
      imageUrl: room.imageUrl ?? "",
      imageFile: null,
      status: room.status,
    });
    setPreviewUrl(room.imageUrl ? getImageUrl(room.imageUrl) : null);
    setIsImageDeleted(false);
    setFormError("");
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setPreviewUrl(null);
    setIsImageDeleted(false);
    setFormError("");
  };

  const handleDelete = (room: Room) => {
    if (window.confirm(`Delete room "${room.roomNumber}"? This cannot be undone.`)) {
      deleteMutation.mutate(room.id);
    }
  };

  const isFormValid =
    form.roomNumber.trim().length > 0 &&
    form.roomType.trim().length >= 2 &&
    Number(form.capacity) > 0 &&
    Number(form.pricePerDay) >= 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="Rooms"
        subtitle="Manage room inventory and availability"
        actions={
          canCreate ? (
            <Button
              onClick={openCreate}
              leftIcon={<Plus size={16} />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Add Room
            </Button>
          ) : undefined
        }
      />

      {/* ── Stats Grid ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <BedDouble className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Rooms</p>
            <h3 className="text-2xl font-bold text-gray-905 mt-0.5">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Available Rooms</p>
            <h3 className="text-2xl font-bold text-gray-905 mt-0.5">{stats.available}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Occupied Rooms</p>
            <h3 className="text-2xl font-bold text-gray-905 mt-0.5">{stats.occupied}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl text-red-650">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cleaning / OOS</p>
            <h3 className="text-2xl font-bold text-gray-905 mt-0.5">{stats.cleaningOrOos}</h3>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 max-sm:w-full max-w-sm">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 min-w-[160px]"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="CLEANING">Cleaning</option>
          <option value="OUT_OF_SERVICE">Out of Service</option>
        </select>
      </div>

      {/* ── Room Grid ───────────────────────────────────────────────────── */}
      {roomsQuery.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-gray-105 p-5 space-y-4 animate-pulse">
              <div className="h-48 bg-gray-100 rounded-xl" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : roomsQuery.isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-semibold text-gray-750">Unable to load rooms</p>
          <p className="text-xs text-gray-400 mt-1">{getErrorMessage(roomsQuery.error)}</p>
          <Button variant="outline" size="sm" className="mt-4 border border-gray-200 text-gray-650 hover:bg-gray-50" onClick={() => roomsQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <HelpCircle className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">No rooms found</p>
          <p className="text-xs text-gray-400 mt-1">Add rooms to manage reservations and occupancy.</p>
          {canCreate && (
            <Button
              size="sm"
              className="mt-5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-semibold text-sm shadow-sm"
              onClick={openCreate}
              leftIcon={<Plus size={16} />}
            >
              Add Room
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => (
            <motion.div
              key={room.id}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all group"
            >
              {/* Card Image */}
              <div className="relative h-48 bg-gray-50 overflow-hidden border-b border-gray-100">
                <img
                  src={getImageUrl(room.imageUrl)}
                  alt={`Room ${room.roomNumber}`}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                <div className="absolute top-3 right-3">
                  <StatusChip status={room.status} />
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                  <BedDouble size={11} />
                  {room.roomType}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-base">Room {room.roomNumber}</h3>
                    <span className="text-sm font-bold text-emerald-650">
                      {formatCurrency(Number(room.pricePerDay ?? 0))}<span className="font-normal text-gray-400 text-xs">/day</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Capacity: <strong className="text-gray-800">{room.capacity} guests</strong>
                  </p>
                  {room.description && (
                    <p className="text-xs text-gray-500 mt-2.5 line-clamp-2 leading-relaxed">
                      {room.description}
                    </p>
                  )}
                </div>

                {/* Actions — only shown when permitted */}
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canUpdate && (
                    <button
                      onClick={() => openEdit(room)}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-650 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      title="Edit Room"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                  {canUpdate && (
                    <button
                      onClick={() =>
                        statusMutation.mutate({
                          id: room.id,
                          status:
                            room.status === "OUT_OF_SERVICE" ? "AVAILABLE" : "OUT_OF_SERVICE",
                        })
                      }
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-650 hover:bg-gray-50 transition-colors"
                      title={room.status === "OUT_OF_SERVICE" ? "Activate" : "Deactivate"}
                    >
                      {room.status === "OUT_OF_SERVICE" ? (
                        <Power size={13} className="text-emerald-500" />
                      ) : (
                        <PowerOff size={13} className="text-amber-500" />
                      )}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(room)}
                      className="p-1.5 rounded-lg border border-gray-200 text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Room"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {editing ? `Edit Room ${editing.roomNumber}` : "Add Room"}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {formError && (
                  <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700 flex items-start gap-2">
                    <span>⚠️</span>
                    <span>{formError}</span>
                  </div>
                )}

                {/* Room Number + Room Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Room Number *
                    </label>
                    <input
                      type="text"
                      placeholder="101"
                      value={form.roomNumber}
                      onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                      className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-850 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Room Type *
                    </label>
                    <select
                      value={form.roomType}
                      onChange={(e) => setForm({ ...form, roomType: e.target.value })}
                      className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-850 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    >
                      <option value="">Select room type</option>
                      {ROOM_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Capacity + Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Capacity (guests) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="2"
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                      className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-850 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Price per Day (₹) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="2500"
                      value={form.pricePerDay}
                      onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })}
                      className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-850 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe the room amenities, view, features..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-850 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 resize-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as RoomStatus })}
                    className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-850 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                  </select>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Room Image
                  </label>
                  <div className="flex flex-col gap-3 p-4 rounded-xl border border-gray-150 bg-gray-50">
                    {previewUrl ? (
                      <div className="relative h-36 w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                        <Upload className="h-6 w-6 text-gray-400 mb-1" />
                        <span className="text-xs font-semibold text-gray-705">Choose file or drag here</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WEBP (Max 2MB)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    )}
                    <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Or link image URL
                    </div>
                    <input
                      type="text"
                      placeholder="https://example.com/room.jpg"
                      value={form.imageUrl}
                      onChange={handleUrlChange}
                      className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-xs text-gray-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-100 pt-4 mt-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={closeModal} className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm">
                  Cancel
                </Button>
                <Button
                  disabled={!isFormValid}
                  loading={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {editing ? "Update Room" : "Create Room"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

