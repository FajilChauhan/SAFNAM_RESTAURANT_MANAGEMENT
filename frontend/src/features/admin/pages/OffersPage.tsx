import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  BedDouble,
  Calendar,
  Check,
  CheckCircle,
  Copy,
  Edit2,
  Gift,
  Hash,
  ImageIcon,
  Layers,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  TrendingUp,
  Utensils,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminOffer } from "@/api/admin.api";
import { floorApi } from "@/api/floor.api";
import { roomApi } from "@/api/room.api";
import { cn } from "@/utils/cn";
import { formatCurrency, getErrorMessage } from "@/utils/formatters";
import { toast } from "@/utils/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type OfferForm = {
  title: string;
  description: string;
  code: string;
  type: AdminOffer["type"];
  applicableTo: AdminOffer["applicableTo"];
  discountType: AdminOffer["discountType"];
  discountValue: string;
  minSpend: string;
  maxDiscount: string;
  imageUrl: string;
  imageFile: File | null;
  startsAt: string;
  endsAt: string;
  status: AdminOffer["status"];
  allFloors: boolean;
  selectedFloorIds: string[];
  allRoomTypes: boolean;
  selectedRoomTypes: string[];
};

const emptyOffer: OfferForm = {
  title: "",
  description: "",
  code: "",
  type: "TODAY",
  applicableTo: "BOTH",
  discountType: "PERCENTAGE",
  discountValue: "",
  minSpend: "0",
  maxDiscount: "",
  imageUrl: "",
  imageFile: null,
  startsAt: "",
  endsAt: "",
  status: "ACTIVE",
  allFloors: true,
  selectedFloorIds: [],
  allRoomTypes: true,
  selectedRoomTypes: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getApplicableStyle(type: AdminOffer["applicableTo"]) {
  if (type === "TABLE") return "bg-emerald-100 text-emerald-700";
  if (type === "ROOM") return "bg-blue-100 text-blue-700";
  return "bg-purple-100 text-purple-700";
}

function getApplicableLabel(type: AdminOffer["applicableTo"]) {
  if (type === "TABLE") return "Table";
  if (type === "ROOM") return "Room";
  return "Table & Room";
}

function getTypeStyle(type: AdminOffer["type"]) {
  const map: Record<string, { text: string; label: string }> = {
    TODAY: { text: "text-blue-600", label: "Today" },
    COUPON: { text: "text-purple-600", label: "Coupon" },
    BIRTHDAY: { text: "text-pink-600", label: "Birthday" },
    FESTIVAL: { text: "text-orange-600", label: "Festival" },
  };
  return map[type] ?? { text: "text-gray-500", label: type };
}

function getGradientByType(type: AdminOffer["applicableTo"]) {
  if (type === "TABLE") return "from-emerald-400 to-emerald-600";
  if (type === "ROOM") return "from-blue-400 to-blue-600";
  return "from-purple-400 to-purple-600";
}

function getImageUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}

function toInputDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function formatDiscount(offer: AdminOffer) {
  return offer.discountType === "PERCENTAGE"
    ? `${offer.discountValue}% OFF`
    : `${formatCurrency(Number(offer.discountValue))} OFF`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OffersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [filterType, setFilterType] = useState<"ALL" | AdminOffer["applicableTo"]>("ALL");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<AdminOffer | null>(null);
  const [form, setForm] = useState<OfferForm>(emptyOffer);
  const [formError, setFormError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // ─── Queries ───────────────────────────────────────────────────────────────

  const offersQuery = useQuery({
    queryKey: ["admin", "offers", search, filterType, filterStatus],
    queryFn: async () =>
      (
        await adminApi.offers.list({
          limit: 100,
          search: search || undefined,
          applicableTo: filterType === "ALL" ? undefined : filterType,
          status: filterStatus === "ALL" ? undefined : filterStatus,
        })
      ).data.data.offers,
  });

  const floorsQuery = useQuery({
    queryKey: ["admin", "floors", "all"],
    queryFn: async () => {
      const { data } = await floorApi.getFloors();
      return (data as { data: { floors: Array<{ id: string; name: string }> } }).data.floors;
    },
    staleTime: 120_000,
  });

  const roomTypesQuery = useQuery({
    queryKey: ["admin", "room-types"],
    queryFn: async () => {
      const { data } = await roomApi.getTypes();
      return data.data.types;
    },
    staleTime: 120_000,
  });

  const floors = floorsQuery.data ?? [];
  const roomTypes = roomTypesQuery.data ?? [];
  const offers = offersQuery.data ?? [];

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.set("title", form.title.trim());
      if (form.description.trim()) payload.set("description", form.description.trim());
      if (form.code.trim()) payload.set("code", form.code.trim().toUpperCase());
      payload.set("type", form.type);
      payload.set("applicableTo", form.applicableTo);
      payload.set("discountType", form.discountType);
      payload.set("discountValue", String(Number(form.discountValue)));
      payload.set("minSpend", String(Number(form.minSpend || 0)));
      if (form.maxDiscount) payload.set("maxDiscount", String(Number(form.maxDiscount)));
      if (form.imageUrl.trim()) payload.set("imageUrl", form.imageUrl.trim());
      if (form.imageFile) payload.set("image", form.imageFile);
      payload.set("startsAt", new Date(form.startsAt).toISOString());
      payload.set("endsAt", new Date(form.endsAt).toISOString());
      payload.set("status", form.status);

      const needsFloors = form.applicableTo === "TABLE" || form.applicableTo === "BOTH";
      const needsRooms = form.applicableTo === "ROOM" || form.applicableTo === "BOTH";

      if (needsFloors) {
        payload.set("allFloors", String(form.allFloors));
        if (!form.allFloors) form.selectedFloorIds.forEach((id) => payload.append("floorIds[]", id));
      }
      if (needsRooms) {
        payload.set("allRoomTypes", String(form.allRoomTypes));
        if (!form.allRoomTypes) form.selectedRoomTypes.forEach((rt) => payload.append("roomTypes[]", rt));
      }

      return editing ? adminApi.offers.update(editing.id, payload) : adminApi.offers.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "offers"] });
      toast.success(editing ? "Offer updated successfully." : "Offer created successfully.");
      closeModal();
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.offers.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "offers"] });
      toast.success("Offer deleted.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminOffer["status"] }) =>
      adminApi.offers.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "offers"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // ─── Derived ───────────────────────────────────────────────────────────────

  const activeCount = offers.filter((o) => o.status === "ACTIVE").length;
  const tableCount = offers.filter((o) => o.applicableTo === "TABLE" || o.applicableTo === "BOTH").length;
  const roomCount = offers.filter((o) => o.applicableTo === "ROOM" || o.applicableTo === "BOTH").length;

  const needsFloors = form.applicableTo === "TABLE" || form.applicableTo === "BOTH";
  const needsRooms = form.applicableTo === "ROOM" || form.applicableTo === "BOTH";

  const canSave = useMemo(() => {
    if (form.title.trim().length < 2) return false;
    if (Number(form.discountValue) <= 0) return false;
    if (!form.startsAt || !form.endsAt) return false;
    if (new Date(form.endsAt) < new Date(form.startsAt)) return false;
    if (form.discountType === "PERCENTAGE" && Number(form.discountValue) > 100) return false;
    if (needsFloors && !form.allFloors && form.selectedFloorIds.length === 0) return false;
    if (needsRooms && !form.allRoomTypes && form.selectedRoomTypes.length === 0) return false;
    return true;
  }, [form, needsFloors, needsRooms]);

  // ─── Modal handlers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null);
    setForm(emptyOffer);
    setPreviewUrl(null);
    setFormError("");
    setIsOpen(true);
  };

  const openEdit = (offer: AdminOffer) => {
    setEditing(offer);
    setForm({
      title: offer.title,
      description: offer.description ?? "",
      code: offer.code ?? "",
      type: offer.type,
      applicableTo: offer.applicableTo ?? "BOTH",
      discountType: offer.discountType,
      discountValue: String(offer.discountValue),
      minSpend: String(offer.minSpend ?? 0),
      maxDiscount: offer.maxDiscount ? String(offer.maxDiscount) : "",
      imageUrl: offer.imageUrl ?? "",
      imageFile: null,
      startsAt: toInputDateTime(offer.startsAt),
      endsAt: toInputDateTime(offer.endsAt),
      status: offer.status,
      allFloors: offer.allFloors ?? true,
      selectedFloorIds: offer.floors?.map((f) => f.floor.id) ?? [],
      allRoomTypes: offer.allRoomTypes ?? true,
      selectedRoomTypes: offer.roomTypes?.map((rt) => rt.roomType) ?? [],
    });
    setPreviewUrl(getImageUrl(offer.imageUrl));
    setFormError("");
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setForm(emptyOffer);
    setPreviewUrl(null);
    setFormError("");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const set = <K extends keyof OfferForm>(key: K, val: OfferForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Create and manage SAFNAM Restaurant promotional offers
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5
            text-sm font-semibold text-white shadow-sm transition-all
            hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={18} />
          Create Offer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Offers", value: activeCount, icon: Percent, color: "bg-emerald-50 text-emerald-600", border: "border-emerald-100" },
          { label: "Table Eligible", value: tableCount, icon: Utensils, color: "bg-amber-50 text-amber-600", border: "border-amber-100" },
          { label: "Room Eligible", value: roomCount, icon: BedDouble, color: "bg-blue-50 text-blue-600", border: "border-blue-100" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl border bg-white p-5 shadow-sm", s.border)}>
            <div className={cn("mb-4 flex h-11 w-11 items-center justify-center rounded-xl", s.color)}>
              <s.icon size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="mt-1 text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters + Grid */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        {/* Filter bar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, code, or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4
                text-sm text-gray-900 placeholder:text-gray-400
                focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>

          {/* Status pills */}
          <div className="flex gap-2">
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-xs font-medium transition-all",
                  filterStatus === f
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
                )}
              >
                {f === "ALL" ? "All Status" : f}
              </button>
            ))}
          </div>

          {/* Type pills */}
          <div className="flex gap-2">
            {(["ALL", "TABLE", "ROOM", "BOTH"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-xs font-medium transition-all",
                  filterType === f
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
                )}
              >
                {f === "ALL" ? "All Types" : f}
              </button>
            ))}
          </div>

          {/* Reset */}
          <button
            onClick={() => { setSearch(""); setFilterStatus("ALL"); setFilterType("ALL"); }}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200
              bg-white px-3 py-1.5 text-xs font-medium text-gray-600
              hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <RefreshCw size={12} />
            Reset
          </button>
        </div>

        {/* Grid */}
        {offersQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : offersQuery.isError ? (
          <div className="py-16 text-center">
            <AlertCircle size={40} className="mx-auto mb-3 text-red-300" />
            <p className="font-medium text-gray-500">{getErrorMessage(offersQuery.error)}</p>
            <button
              onClick={() => offersQuery.refetch()}
              className="mt-4 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-all"
            >
              Retry
            </button>
          </div>
        ) : !offers.length ? (
          <div className="py-16 text-center">
            <Gift size={48} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-400">No offers found</p>
            <p className="mt-1 text-sm text-gray-300">Create your first promotional offer to get started</p>
            <button
              onClick={openCreate}
              className="mx-auto mt-4 flex items-center gap-2 rounded-xl bg-emerald-600
                px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-all"
            >
              <Plus size={16} />
              Create Offer
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                copiedCode={copiedCode}
                onEdit={openEdit}
                onStatus={(id, status) => statusMutation.mutate({ id, status })}
                onDelete={(id) => window.confirm(`Delete offer "${offer.title}"?`) && deleteMutation.mutate(id)}
                onCopy={copyCode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        />
      )}

      {/* Create / Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl
              border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editing ? "Edit Offer" : "Create Offer"}
                </h2>
                <p className="mt-0.5 text-sm text-gray-400">
                  {editing ? "Update promotional offer details" : "Add a new promotional offer"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-xl
                  bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="max-h-[72vh] overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                {formError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200
                    bg-red-50 px-4 py-3 text-sm text-red-600">
                    <AlertCircle size={16} />
                    {formError}
                  </div>
                )}

                {/* Basic Info */}
                <Section title="Offer Details">
                  <Field label="Offer Name *">
                    <input
                      value={form.title}
                      onChange={(e) => set("title", e.target.value)}
                      placeholder="e.g. Weekend Special"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Description">
                    <input
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Short offer description"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Coupon Code">
                    <input
                      value={form.code}
                      onChange={(e) => set("code", e.target.value.toUpperCase())}
                      placeholder="e.g. SAVE20 (optional)"
                      className={inputCls}
                    />
                  </Field>
                </Section>

                {/* Applies To */}
                <Section title="Applies To">
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { value: "TABLE", label: "Table", icon: <Utensils size={15} /> },
                        { value: "ROOM", label: "Room", icon: <BedDouble size={15} /> },
                        { value: "BOTH", label: "Both", icon: <Gift size={15} /> },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set("applicableTo", opt.value)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition-all",
                          form.applicableTo === opt.value
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                        )}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Floor Scope */}
                {needsFloors && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Layers size={14} className="text-amber-600" />
                      <span className="text-sm font-semibold text-amber-900">Table — Floor Scope</span>
                    </div>
                    <CheckToggle
                      checked={form.allFloors}
                      label="All Floors"
                      onChange={() => set("allFloors", !form.allFloors)}
                    />
                    {!form.allFloors && (
                      <div className="mt-3">
                        {floorsQuery.isLoading ? (
                          <p className="animate-pulse text-xs text-gray-400">Loading floors…</p>
                        ) : floors.length === 0 ? (
                          <p className="text-xs text-gray-400">No floors yet. Create floors first.</p>
                        ) : (
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {floors.map((floor) => {
                              const checked = form.selectedFloorIds.includes(floor.id);
                              return (
                                <button
                                  key={floor.id}
                                  type="button"
                                  onClick={() =>
                                    set(
                                      "selectedFloorIds",
                                      checked
                                        ? form.selectedFloorIds.filter((id) => id !== floor.id)
                                        : [...form.selectedFloorIds, floor.id],
                                    )
                                  }
                                  className={cn(
                                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                                    checked
                                      ? "border-amber-400 bg-amber-50 text-amber-800"
                                      : "border-gray-200 bg-white text-gray-700 hover:border-amber-200",
                                  )}
                                >
                                  <CheckBox checked={checked} color="amber" />
                                  {floor.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {form.selectedFloorIds.length === 0 && (
                          <p className="mt-2 text-xs font-medium text-red-500">Select at least one floor.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Room Type Scope */}
                {needsRooms && (
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <BedDouble size={14} className="text-sky-600" />
                      <span className="text-sm font-semibold text-sky-900">Room — Category Scope</span>
                    </div>
                    <CheckToggle
                      checked={form.allRoomTypes}
                      label="All Room Categories"
                      onChange={() => set("allRoomTypes", !form.allRoomTypes)}
                    />
                    {!form.allRoomTypes && (
                      <div className="mt-3">
                        {roomTypesQuery.isLoading ? (
                          <p className="animate-pulse text-xs text-gray-400">Loading categories…</p>
                        ) : roomTypes.length === 0 ? (
                          <p className="text-xs text-gray-400">No room categories yet. Create rooms first.</p>
                        ) : (
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {roomTypes.map((rt) => {
                              const checked = form.selectedRoomTypes.includes(rt);
                              return (
                                <button
                                  key={rt}
                                  type="button"
                                  onClick={() =>
                                    set(
                                      "selectedRoomTypes",
                                      checked
                                        ? form.selectedRoomTypes.filter((t) => t !== rt)
                                        : [...form.selectedRoomTypes, rt],
                                    )
                                  }
                                  className={cn(
                                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                                    checked
                                      ? "border-sky-400 bg-sky-50 text-sky-800"
                                      : "border-gray-200 bg-white text-gray-700 hover:border-sky-200",
                                  )}
                                >
                                  <CheckBox checked={checked} color="sky" />
                                  {rt}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {form.selectedRoomTypes.length === 0 && (
                          <p className="mt-2 text-xs font-medium text-red-500">Select at least one category.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Discount */}
                <Section title="Discount">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Discount Type">
                      <select
                        value={form.discountType}
                        onChange={(e) => set("discountType", e.target.value as OfferForm["discountType"])}
                        className={selectCls}
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED">Fixed Amount (₹)</option>
                      </select>
                    </Field>
                    <Field label={`Value${form.discountType === "PERCENTAGE" ? " (max 100)" : " (₹)"}`}>
                      <input
                        type="number"
                        min="0"
                        max={form.discountType === "PERCENTAGE" ? 100 : undefined}
                        value={form.discountValue}
                        onChange={(e) => set("discountValue", e.target.value)}
                        placeholder="0"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Min Spend (₹)">
                      <input
                        type="number"
                        min="0"
                        value={form.minSpend}
                        onChange={(e) => set("minSpend", e.target.value)}
                        placeholder="0"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Max Discount Cap (₹)">
                      <input
                        type="number"
                        min="0"
                        value={form.maxDiscount}
                        onChange={(e) => set("maxDiscount", e.target.value)}
                        placeholder="Optional"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </Section>

                {/* Settings */}
                <Section title="Settings">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Offer Type">
                      <select
                        value={form.type}
                        onChange={(e) => set("type", e.target.value as OfferForm["type"])}
                        className={selectCls}
                      >
                        <option value="TODAY">Today</option>
                        <option value="COUPON">Coupon</option>
                        <option value="BIRTHDAY">Birthday</option>
                        <option value="FESTIVAL">Festival</option>
                      </select>
                    </Field>
                    <Field label="Status">
                      <select
                        value={form.status}
                        onChange={(e) => set("status", e.target.value as OfferForm["status"])}
                        className={selectCls}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Valid From *">
                      <input
                        type="datetime-local"
                        value={form.startsAt}
                        onChange={(e) => set("startsAt", e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Valid Until *">
                      <input
                        type="datetime-local"
                        value={form.endsAt}
                        onChange={(e) => set("endsAt", e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </Section>

                {/* Image */}
                <Section title="Offer Image">
                  <div className="grid gap-3 sm:grid-cols-[1fr_130px] sm:items-end">
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2
                      rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-6
                      text-center text-sm text-gray-400 transition-all hover:border-emerald-300 hover:bg-emerald-50/30">
                      <ImageIcon size={20} className="text-gray-300" />
                      <span>Click to upload image</span>
                      <span className="text-xs text-gray-300">JPG, PNG, WEBP</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          set("imageFile", file);
                          setPreviewUrl(file ? URL.createObjectURL(file) : null);
                        }}
                      />
                    </label>
                    {previewUrl ? (
                      <div className="relative h-24 overflow-hidden rounded-2xl border border-gray-200">
                        <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { set("imageFile", null); set("imageUrl", ""); setPreviewUrl(null); }}
                          className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1
                            text-gray-500 shadow-sm hover:bg-white transition-all"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="grid h-24 place-items-center rounded-2xl border border-dashed
                        border-gray-200 bg-gray-50 text-xs text-gray-300">
                        No image
                      </div>
                    )}
                  </div>
                </Section>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 rounded-b-3xl border-t border-gray-100 bg-white px-6 py-4">
              <button
                onClick={closeModal}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium
                  text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={!canSave || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all",
                  canSave && !saveMutation.isPending
                    ? "bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98]"
                    : "cursor-not-allowed bg-gray-200 text-gray-400",
                )}
              >
                {saveMutation.isPending && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {editing ? "Save Changes" : "Create Offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Offer Card ───────────────────────────────────────────────────────────────

function OfferCard({
  offer,
  copiedCode,
  onEdit,
  onStatus,
  onDelete,
  onCopy,
}: {
  offer: AdminOffer;
  copiedCode: string | null;
  onEdit: (offer: AdminOffer) => void;
  onStatus: (id: string, status: AdminOffer["status"]) => void;
  onDelete: (id: string) => void;
  onCopy: (code: string) => void;
}) {
  const expired = new Date(offer.endsAt).getTime() < Date.now();
  const isActive = offer.status === "ACTIVE" && !expired;
  const typeInfo = getTypeStyle(offer.type);

  return (
    <article className={cn(
      "overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
      isActive ? "border-gray-100" : "border-gray-100 bg-gray-50/50",
    )}>
      {/* Gradient strip */}
      <div className={cn("h-2 bg-linear-to-r", getGradientByType(offer.applicableTo))} />

      <div className="p-5">
        {/* Top row: type badge + status */}
        <div className="mb-3 flex items-center justify-between">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", getApplicableStyle(offer.applicableTo))}>
            {getApplicableLabel(offer.applicableTo)}
          </span>
          <div className="flex items-center gap-2">
            {expired ? (
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600">Expired</span>
            ) : (
              <span className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                offer.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500",
              )}>
                {offer.status === "ACTIVE" ? "Active" : "Inactive"}
              </span>
            )}
          </div>
        </div>

        {/* Category */}
        <p className={cn("text-xs font-bold uppercase tracking-wider", typeInfo.text)}>
          {typeInfo.label}
        </p>

        {/* Title + Description */}
        <h3 className="mt-1 line-clamp-1 text-base font-bold leading-tight text-gray-900">
          {offer.title}
        </h3>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm text-gray-400">
          {offer.description ?? "No description"}
        </p>

        {/* Discount + Cap blocks */}
        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-xl bg-gray-50 p-3">
            <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
              <Percent size={11} />
              <span>DISCOUNT</span>
            </div>
            <p className="text-sm font-bold text-gray-900">{formatDiscount(offer)}</p>
          </div>
          {offer.maxDiscount ? (
            <div className="flex-1 rounded-xl bg-gray-50 p-3">
              <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
                <Tag size={11} />
                <span>CAP</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(offer.maxDiscount))}</p>
            </div>
          ) : null}
          {offer.minSpend && Number(offer.minSpend) > 0 ? (
            <div className="flex-1 rounded-xl bg-gray-50 p-3">
              <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
                <TrendingUp size={11} />
                <span>MIN</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(offer.minSpend))}</p>
            </div>
          ) : null}
        </div>

        {/* Coupon code */}
        {offer.code && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-100
            bg-emerald-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <Hash size={12} className="text-emerald-500" />
              <span className="font-mono text-sm font-bold tracking-widest text-emerald-700">
                {offer.code}
              </span>
            </div>
            <button
              onClick={() => onCopy(offer.code!)}
              className="text-emerald-500 transition-colors hover:text-emerald-700"
            >
              {copiedCode === offer.code ? <CheckCircle size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}

        {/* Validity */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar size={11} />
          <span>
            {new Date(offer.startsAt).toLocaleDateString()} → {new Date(offer.endsAt).toLocaleDateString()}
          </span>
        </div>

        {/* Scope pills */}
        <ScopePills offer={offer} />

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
          <button
            onClick={() => onStatus(offer.id, offer.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition-all",
              offer.status === "ACTIVE"
                ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50",
            )}
          >
            {offer.status === "ACTIVE" ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => onEdit(offer)}
            className="rounded-xl border border-gray-200 p-2 text-gray-500
              transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(offer.id)}
            className="rounded-xl border border-gray-200 p-2 text-gray-500
              transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Scope pills ──────────────────────────────────────────────────────────────

function ScopePills({ offer }: { offer: AdminOffer }) {
  const hasFloors = offer.applicableTo === "TABLE" || offer.applicableTo === "BOTH";
  const hasRooms = offer.applicableTo === "ROOM" || offer.applicableTo === "BOTH";
  if (!hasFloors && !hasRooms) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {hasFloors && (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200
          bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          <Utensils size={10} />
          {offer.allFloors
            ? "All Floors"
            : offer.floors?.length
            ? offer.floors.map((f) => f.floor.name).join(", ")
            : "No floors"}
        </span>
      )}
      {hasRooms && (
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200
          bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
          <BedDouble size={10} />
          {offer.allRoomTypes
            ? "All Categories"
            : offer.roomTypes?.length
            ? offer.roomTypes.map((rt) => rt.roomType).join(", ")
            : "No categories"}
        </span>
      )}
    </div>
  );
}

// ─── Tiny UI components ───────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function CheckToggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex items-center gap-3"
    >
      <div className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
        checked ? "border-emerald-500 bg-emerald-500" : "border-gray-300 bg-white",
      )}>
        {checked && <Check size={12} strokeWidth={3} className="text-white" />}
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}

function CheckBox({ checked, color }: { checked: boolean; color: "amber" | "sky" }) {
  const colors = {
    amber: "border-amber-500 bg-amber-500",
    sky: "border-sky-500 bg-sky-500",
  };
  return (
    <div className={cn(
      "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all",
      checked ? colors[color] : "border-gray-300 bg-white",
    )}>
      {checked && <Check size={10} strokeWidth={3} className="text-white" />}
    </div>
  );
}

// ─── Input style constants ────────────────────────────────────────────────────

const inputCls =
  "h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 " +
  "placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none " +
  "focus:ring-2 focus:ring-emerald-500/10 transition-all";

const selectCls =
  "h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 " +
  "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all";
