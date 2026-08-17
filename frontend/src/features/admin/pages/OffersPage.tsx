import { useMemo, useState, type ReactNode } from "react";
import {
  BedDouble,
  CalendarDays,
  Edit2,
  Gift,
  Percent,
  Plus,
  Power,
  PowerOff,
  Search,
  Tag,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminOffer } from "@/api/admin.api";
import { Button, EmptyState, Input, Modal, PageHeader, Select, StatusChip } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatCurrency, getErrorMessage } from "@/utils/formatters";
import { toast } from "@/utils/toast";

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
};

const applicabilityOptions: Array<{
  value: AdminOffer["applicableTo"];
  label: string;
  helper: string;
  icon: ReactNode;
}> = [
  { value: "TABLE", label: "Table Booking", helper: "Table bookings only", icon: <Utensils size={16} /> },
  { value: "ROOM", label: "Room Booking", helper: "Room bookings only", icon: <BedDouble size={16} /> },
  { value: "BOTH", label: "Both", helper: "Table and room bookings", icon: <Gift size={16} /> },
];

export default function OffersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [applicableTo, setApplicableTo] = useState<"ALL" | AdminOffer["applicableTo"]>("ALL");
  const [status, setStatus] = useState<"ALL" | AdminOffer["status"]>("ALL");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<AdminOffer | null>(null);
  const [form, setForm] = useState<OfferForm>(emptyOffer);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const offersQuery = useQuery({
    queryKey: ["admin", "offers", search, applicableTo, status],
    queryFn: async () =>
      (
        await adminApi.offers.list({
          limit: 100,
          search: search || undefined,
          applicableTo: applicableTo === "ALL" ? undefined : applicableTo,
          status: status === "ALL" ? undefined : status,
        })
      ).data.data.offers,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.set("title", form.title.trim());
      if (form.description.trim()) payload.set("description", form.description.trim());
      if (form.code.trim()) payload.set("code", form.code.trim());
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
      return editing ? adminApi.offers.update(editing.id, payload) : adminApi.offers.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "offers"] });
      toast.success(editing ? "Offer updated successfully." : "Offer created successfully.");
      closeModal();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.offers.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "offers"] });
      toast.success("Offer deleted successfully.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminOffer["status"] }) => adminApi.offers.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "offers"] });
      toast.success("Offer status updated successfully.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const offers = offersQuery.data ?? [];
  const activeCount = offers.filter((offer) => offer.status === "ACTIVE").length;
  const tableCount = offers.filter((offer) => offer.applicableTo === "TABLE" || offer.applicableTo === "BOTH").length;
  const roomCount = offers.filter((offer) => offer.applicableTo === "ROOM" || offer.applicableTo === "BOTH").length;

  const canSave =
    form.title.trim().length >= 2 &&
    Number(form.discountValue) > 0 &&
    Boolean(form.startsAt && form.endsAt) &&
    new Date(form.endsAt) >= new Date(form.startsAt) &&
    (form.discountType !== "PERCENTAGE" || Number(form.discountValue) <= 100);

  const helper = useMemo(() => {
    if (form.applicableTo === "TABLE") return "This offer can be used for table bookings only.";
    if (form.applicableTo === "ROOM") return "This offer can be used for room bookings only.";
    return "This offer can be used for both table and room bookings.";
  }, [form.applicableTo]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyOffer);
    setPreviewUrl(null);
    setError("");
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
    });
    setPreviewUrl(getImageUrl(offer.imageUrl));
    setError("");
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setForm(emptyOffer);
    setPreviewUrl(null);
    setError("");
  };

  const handleImageChange = (file: File | null) => {
    setForm({ ...form, imageFile: file });
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader title="Offers" subtitle="Create and manage SAFNAM Restaurant offers" />
        <Button onClick={openCreate} leftIcon={<Plus size={16} />} className="w-full sm:w-auto">
          Create Offer
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Active Offers" value={activeCount} icon={<Percent size={18} />} tone="emerald" />
        <SummaryCard label="Table Eligible" value={tableCount} icon={<Utensils size={18} />} tone="amber" />
        <SummaryCard label="Room Eligible" value={roomCount} icon={<BedDouble size={18} />} tone="sky" />
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block xl:w-96">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search offers by name, code, or description" className="pl-10" />
          </label>
          <div className="grid gap-3 sm:grid-cols-3 xl:flex xl:items-center">
            <Select value={applicableTo} onChange={(e) => setApplicableTo(e.target.value as typeof applicableTo)}>
              <option value="ALL">All Applies To</option>
              <option value="TABLE">Table</option>
              <option value="ROOM">Room</option>
              <option value="BOTH">Both</option>
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(""); setApplicableTo("ALL"); setStatus("ALL"); }}>
              Reset
            </Button>
          </div>
        </div>

        {offersQuery.isLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : offersQuery.isError ? (
          <EmptyState title="Unable to load offers" description={getErrorMessage(offersQuery.error)} action={<Button variant="outline" onClick={() => offersQuery.refetch()}>Retry</Button>} />
        ) : !offers.length ? (
          <EmptyState title="No offers found" description="Create a real SAFNAM offer to use it in table and room bookings." action={<Button onClick={openCreate} leftIcon={<Plus size={16} />}>Create Offer</Button>} />
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {offers.map((offer) => <OfferCard key={offer.id} offer={offer} onEdit={openEdit} onStatus={statusMutation.mutate} onDelete={deleteMutation.mutate} />)}
          </div>
        )}
      </section>

      <Modal isOpen={isOpen} onClose={closeModal} title={editing ? "Edit Offer" : "Create Offer"}>
        <div className="max-h-[78vh] overflow-y-auto pr-1">
          <div className="space-y-5">
            {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}

            <div className="grid gap-4">
              <Field label="Offer Name">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Weekend Special" />
              </Field>
              <Field label="Description">
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short offer description" />
              </Field>
            </div>

            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-800">Applies To</span>
              <div className="grid gap-3 sm:grid-cols-3">
                {applicabilityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, applicableTo: option.value })}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left transition",
                      form.applicableTo === option.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold">{option.icon}{option.label}</span>
                    <span className="mt-1 block text-xs text-slate-500">{option.helper}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{helper}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Discount Type">
                <Select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as OfferForm["discountType"] })}>
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed Amount</option>
                </Select>
              </Field>
              <Field label="Discount Value">
                <Input type="number" min="0" max={form.discountType === "PERCENTAGE" ? 100 : undefined} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Offer Type">
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as OfferForm["type"] })}>
                  <option value="TODAY">Today</option>
                  <option value="COUPON">Coupon</option>
                  <option value="BIRTHDAY">Birthday</option>
                  <option value="FESTIVAL">Festival</option>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as OfferForm["status"] })}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Minimum Spend">
                <Input type="number" min="0" value={form.minSpend} onChange={(e) => setForm({ ...form, minSpend: e.target.value })} />
              </Field>
              <Field label="Coupon Code">
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="Optional" />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Valid From">
                <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </Field>
              <Field label="Valid Until">
                <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_160px] md:items-end">
              <Field label="Offer Image">
                <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)} />
              </Field>
              {previewUrl ? (
                <div className="relative h-24 overflow-hidden rounded-2xl border border-slate-200">
                  <img src={previewUrl} alt="Offer preview" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => handleImageChange(null)} className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-slate-700 shadow-sm">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="grid h-24 place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500">No image</div>
              )}
            </div>

            <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button disabled={!canSave} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                {editing ? "Save Changes" : "Create Offer"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function OfferCard({
  offer,
  onEdit,
  onStatus,
  onDelete,
}: {
  offer: AdminOffer;
  onEdit: (offer: AdminOffer) => void;
  onStatus: (input: { id: string; status: AdminOffer["status"] }) => void;
  onDelete: (id: string) => void;
}) {
  const expired = new Date(offer.endsAt).getTime() < Date.now();
  const nextStatus = offer.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-32 bg-gradient-to-br from-emerald-50 via-white to-amber-50">
        {offer.imageUrl ? <img src={getImageUrl(offer.imageUrl)} alt={offer.title} className="h-full w-full object-cover" /> : null}
        <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-emerald-800 shadow-sm">
          {formatApplicability(offer.applicableTo)}
        </div>
        <div className="absolute right-4 top-4"><StatusChip status={expired ? "EXPIRED" : offer.status} /></div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">{formatOfferType(offer.type)}</p>
          <h3 className="mt-1 line-clamp-1 text-lg font-bold text-slate-900">{offer.title}</h3>
          <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">{offer.description ?? "No description"}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoBlock icon={<Percent size={15} />} label="Discount" value={formatDiscount(offer)} />
          <InfoBlock icon={<Tag size={15} />} label="Usage" value={formatUsage(offer)} />
          <InfoBlock icon={<CalendarDays size={15} />} label="Starts" value={new Date(offer.startsAt).toLocaleDateString()} />
          <InfoBlock icon={<CalendarDays size={15} />} label="Ends" value={new Date(offer.endsAt).toLocaleDateString()} />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <Button size="sm" variant="outline" leftIcon={<Edit2 size={14} />} onClick={() => onEdit(offer)}>Edit</Button>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={offer.status === "ACTIVE" ? <PowerOff size={14} /> : <Power size={14} />}
            onClick={() => onStatus({ id: offer.id, status: nextStatus })}
          >
            {offer.status === "ACTIVE" ? "Deactivate" : "Activate"}
          </Button>
          <Button size="sm" variant="danger" leftIcon={<Trash2 size={14} />} onClick={() => window.confirm(`Delete offer "${offer.title}"?`) && onDelete(offer.id)}>
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}

function SummaryCard({ label, value, icon, tone }: { label: string; value: number; icon: ReactNode; tone: "emerald" | "amber" | "sky" }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-800",
    amber: "bg-amber-50 text-amber-800",
    sky: "bg-sky-50 text-sky-800",
  };
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className={cn("mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl", tones[tone])}>{icon}</div>
      <p className="text-2xl font-bold text-slate-950">{value}</p>
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

function InfoBlock({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{icon}{label}</div>
      <div className="truncate font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function toInputDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function formatDiscount(offer: AdminOffer) {
  return offer.discountType === "PERCENTAGE" ? `${offer.discountValue}% off` : `${formatCurrency(Number(offer.discountValue))} off`;
}

function formatApplicability(applicableTo: AdminOffer["applicableTo"]) {
  if (applicableTo === "TABLE") return "Table";
  if (applicableTo === "ROOM") return "Room";
  return "Both";
}

function formatOfferType(type: AdminOffer["type"]) {
  if (type === "TODAY") return "Today";
  if (type === "COUPON") return "Coupon";
  if (type === "BIRTHDAY") return "Birthday";
  return "Festival";
}

function formatUsage(offer: AdminOffer) {
  return offer.maxDiscount ? `Cap ${formatCurrency(Number(offer.maxDiscount))}` : "Unlimited";
}

function getImageUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}
