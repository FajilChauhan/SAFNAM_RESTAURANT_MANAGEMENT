import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminOffer } from "@/api/admin.api";
import { Button, EmptyState, Input, Modal, PageHeader, Select, StatusChip } from "@/components/ui";
import { getErrorMessage } from "@/utils/formatters";

type OfferForm = {
  title: string;
  description: string;
  code: string;
  type: AdminOffer["type"];
  discountType: AdminOffer["discountType"];
  discountValue: string;
  minSpend: string;
  maxDiscount: string;
  imageUrl: string;
  startsAt: string;
  endsAt: string;
  status: AdminOffer["status"];
};

const emptyOffer: OfferForm = {
  title: "",
  description: "",
  code: "",
  type: "TODAY",
  discountType: "PERCENTAGE",
  discountValue: "",
  minSpend: "0",
  maxDiscount: "",
  imageUrl: "",
  startsAt: "",
  endsAt: "",
  status: "ACTIVE",
};

export default function OffersPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<AdminOffer | null>(null);
  const [form, setForm] = useState<OfferForm>(emptyOffer);
  const [error, setError] = useState("");

  const offersQuery = useQuery({
    queryKey: ["admin", "offers"],
    queryFn: async () => (await adminApi.offers.list({ limit: 100 })).data.data.offers,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        code: form.code.trim() || undefined,
        type: form.type,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minSpend: Number(form.minSpend || 0),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        status: form.status,
      };
      return editing ? adminApi.offers.update(editing.id, payload) : adminApi.offers.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "offers"] });
      closeModal();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.offers.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "offers"] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyOffer);
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
      discountType: offer.discountType,
      discountValue: String(offer.discountValue),
      minSpend: String(offer.minSpend ?? 0),
      maxDiscount: offer.maxDiscount ? String(offer.maxDiscount) : "",
      imageUrl: offer.imageUrl ?? "",
      startsAt: toInputDateTime(offer.startsAt),
      endsAt: toInputDateTime(offer.endsAt),
      status: offer.status,
    });
    setError("");
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setForm(emptyOffer);
    setError("");
  };

  const offers = offersQuery.data ?? [];
  const canSave = form.title.trim().length >= 2 && Number(form.discountValue) > 0 && Boolean(form.startsAt && form.endsAt);

  return (
    <div className="space-y-6">
      <PageHeader title="Offers" subtitle="Create and manage SAFNAM promotional offers" />

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex justify-end">
          <Button onClick={openCreate} leftIcon={<Plus size={16} />}>Create Offer</Button>
        </div>

        {offersQuery.isError ? (
          <EmptyState title="Unable to load offers" description={getErrorMessage(offersQuery.error)} action={<Button variant="outline" onClick={() => offersQuery.refetch()}>Retry</Button>} />
        ) : !offers.length && !offersQuery.isLoading ? (
          <EmptyState title="No offers configured" description="Create a real SAFNAM offer to show it in public and customer offer areas." />
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {offers.map((offer) => (
              <article key={offer.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">{offer.type}</p>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">{offer.title}</h3>
                  </div>
                  <StatusChip status={offer.status} />
                </div>
                <p className="mt-3 min-h-10 text-sm text-slate-600">{offer.description ?? "No description"}</p>
                <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
                  <div className="font-semibold">{formatDiscount(offer)}</div>
                  <div className="text-emerald-700">Code: {offer.code ?? "No coupon code"}</div>
                  <div className="text-emerald-700">Valid until {new Date(offer.endsAt).toLocaleDateString()}</div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(offer)}>Edit</Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => window.confirm(`Delete offer "${offer.title}"?`) && deleteMutation.mutate(offer.id)}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} title={editing ? "Edit Offer" : "Create Offer"}>
        <div className="space-y-4">
          {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Description"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type">
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
            <Field label="Discount Type">
              <Select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as OfferForm["discountType"] })}>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed</option>
              </Select>
            </Field>
            <Field label="Discount Value"><Input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Code"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
            <Field label="Minimum Spend"><Input type="number" value={form.minSpend} onChange={(e) => setForm({ ...form, minSpend: e.target.value })} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Starts At"><Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></Field>
            <Field label="Ends At"><Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button disabled={!canSave} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {editing ? "Save Changes" : "Create Offer"}
            </Button>
          </div>
        </div>
      </Modal>
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
  return offer.discountType === "PERCENTAGE" ? `${offer.discountValue}% off` : `₹${offer.discountValue} off`;
}
