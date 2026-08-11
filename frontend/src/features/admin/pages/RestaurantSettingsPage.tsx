import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { restaurantApi } from "@/api/restaurant.api";
import { Button, EmptyState, Input, PageHeader } from "@/components/ui";
import { getErrorMessage } from "@/utils/formatters";

type RestaurantForm = {
  name: string;
  logoUrl: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  openingTime: string;
  closingTime: string;
  gstNumber: string;
  currency: string;
  timezone: string;
};

const emptyForm: RestaurantForm = {
  name: "",
  logoUrl: "",
  description: "",
  phone: "",
  email: "",
  address: "",
  openingTime: "09:00",
  closingTime: "22:00",
  gstNumber: "",
  currency: "INR",
  timezone: "Asia/Kolkata",
};

export default function RestaurantSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RestaurantForm>(emptyForm);
  const [message, setMessage] = useState("");

  const restaurantQuery = useQuery({
    queryKey: ["restaurant"],
    queryFn: async () => (await restaurantApi.getInfo()).data.data.restaurant as RestaurantForm & { id: string },
  });

  useEffect(() => {
    if (!restaurantQuery.data) return;
    setForm({
      name: restaurantQuery.data.name ?? "",
      logoUrl: restaurantQuery.data.logoUrl ?? "",
      description: restaurantQuery.data.description ?? "",
      phone: restaurantQuery.data.phone ?? "",
      email: restaurantQuery.data.email ?? "",
      address: restaurantQuery.data.address ?? "",
      openingTime: restaurantQuery.data.openingTime ?? "09:00",
      closingTime: restaurantQuery.data.closingTime ?? "22:00",
      gstNumber: restaurantQuery.data.gstNumber ?? "",
      currency: restaurantQuery.data.currency ?? "INR",
      timezone: restaurantQuery.data.timezone ?? "Asia/Kolkata",
    });
  }, [restaurantQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!restaurantQuery.data?.id) throw new Error("Restaurant record not found");
      return restaurantApi.updateInfo(restaurantQuery.data.id, {
        ...form,
        logoUrl: form.logoUrl.trim() || undefined,
        description: form.description.trim() || undefined,
        email: form.email.trim() || undefined,
        gstNumber: form.gstNumber.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["restaurant"] });
      setMessage("Restaurant settings saved successfully.");
    },
    onError: (err) => setMessage(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Restaurant Settings" subtitle="Update SAFNAM Restaurant profile and business configuration" />
      {restaurantQuery.isError ? (
        <EmptyState title="Unable to load settings" description={getErrorMessage(restaurantQuery.error)} />
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Restaurant Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Logo URL"><Input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} /></Field>
            <Field label="Opening Time"><Input type="time" value={form.openingTime} onChange={(e) => setForm({ ...form, openingTime: e.target.value })} /></Field>
            <Field label="Closing Time"><Input type="time" value={form.closingTime} onChange={(e) => setForm({ ...form, closingTime: e.target.value })} /></Field>
            <Field label="GST Number"><Input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} /></Field>
            <Field label="Currency"><Input value={form.currency} maxLength={3} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></Field>
            <Field label="Timezone"><Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} /></Field>
            <Field label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <div className="lg:col-span-2"><Field label="Description"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => restaurantQuery.refetch()}>Reset</Button>
            <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>Save Settings</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}
