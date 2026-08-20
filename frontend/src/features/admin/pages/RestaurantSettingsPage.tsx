import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Camera, Clock, Globe, Mail, MapPin, Phone, Save, Trash2, Upload, X } from "lucide-react";
import { restaurantApi } from "@/api/restaurant.api";
import { PageHeader } from "@/components/ui";
import { getErrorMessage } from "@/utils/formatters";
import { resolveImageUrl } from "@/hooks/useRestaurantSettings";
import { cn } from "@/utils/cn";

type RestaurantForm = {
  name: string;
  logoUrl: string;
  logoFile: File | null;
  previewUrl: string | null;
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
  logoFile: null,
  previewUrl: null,
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
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const restaurantQuery = useQuery({
    queryKey: ["restaurant"],
    queryFn: async () => (await restaurantApi.getInfo()).data.data.restaurant as Record<string, string | null>,
  });

  useEffect(() => {
    if (!restaurantQuery.data) return;
    const data = restaurantQuery.data;
    setForm({
      name: data.name ?? "",
      logoUrl: data.logoUrl ?? "",
      logoFile: null,
      previewUrl: null,
      description: data.description ?? "",
      phone: data.phone ?? "",
      email: data.email ?? "",
      address: data.address ?? "",
      openingTime: data.openingTime ?? "09:00",
      closingTime: data.closingTime ?? "22:00",
      gstNumber: data.gstNumber ?? "",
      currency: data.currency ?? "INR",
      timezone: data.timezone ?? "Asia/Kolkata",
    });
  }, [restaurantQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = new FormData();
      payload.set("name", form.name);
      payload.set("phone", form.phone);
      payload.set("address", form.address);
      payload.set("openingTime", form.openingTime);
      payload.set("closingTime", form.closingTime);
      payload.set("currency", form.currency);
      payload.set("timezone", form.timezone);
      if (form.logoFile) {
        payload.set("logo", form.logoFile);
      } else if (form.logoUrl.trim()) {
        payload.set("logoUrl", form.logoUrl.trim());
      }
      if (form.description.trim()) payload.set("description", form.description.trim());
      if (form.email.trim()) payload.set("email", form.email.trim());
      if (form.gstNumber.trim()) payload.set("gstNumber", form.gstNumber.trim());
      return restaurantApi.updateInfo(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["restaurant"] });
      setToast({ type: "success", message: "Restaurant settings saved successfully." });
      setTimeout(() => setToast(null), 4000);
    },
    onError: (err) => {
      setToast({ type: "error", message: getErrorMessage(err) });
      setTimeout(() => setToast(null), 4000);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, logoFile: file, previewUrl: objectUrl }));
  };

  const handleRemoveLogo = () => {
    if (form.previewUrl) URL.revokeObjectURL(form.previewUrl);
    setForm((prev) => ({ ...prev, logoFile: null, logoUrl: "", previewUrl: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const currentLogoUrl = form.previewUrl ?? resolveImageUrl(form.logoUrl);

  const field = (label: string, key: keyof RestaurantForm, type = "text", placeholder = "") => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={(form[key] as string) ?? ""}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/10"
      />
    </label>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Restaurant Settings" subtitle="Configure restaurant profile and business information" />

      {/* Toast */}
      {toast ? (
        <div className={cn("flex items-center justify-between rounded-xl px-4 py-3 text-sm", toast.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200")}>
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="ml-4">
            <X size={16} />
          </button>
        </div>
      ) : null}

      {restaurantQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p className="font-medium">Unable to load settings</p>
          <p className="mt-1 text-sm">{getErrorMessage(restaurantQuery.error)}</p>
          <button type="button" onClick={() => restaurantQuery.refetch()} className="mt-4 rounded-xl border border-red-300 px-4 py-2 text-sm font-medium hover:bg-red-100">
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Logo ── */}
          <Section icon={<Camera size={18} />} title="Restaurant Logo">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              {/* Logo Preview */}
              <div className="relative flex-shrink-0">
                {currentLogoUrl ? (
                  <img src={currentLogoUrl} alt="Restaurant logo" className="h-24 w-24 rounded-2xl border border-gray-200 object-cover shadow-sm" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50">
                    <Building2 size={28} className="text-gray-400" />
                  </div>
                )}
                {currentLogoUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                    title="Remove logo"
                  >
                    <Trash2 size={12} />
                  </button>
                ) : null}
              </div>

              {/* Upload controls */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Upload a new logo</p>
                  <p className="mt-0.5 text-xs text-gray-500">JPEG, PNG or WebP · Max 5 MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <Upload size={16} />
                  {form.logoFile ? "Change File" : "Choose File"}
                </button>
                {form.logoFile ? (
                  <p className="text-xs text-emerald-700">Selected: {form.logoFile.name}</p>
                ) : null}
              </div>
            </div>
          </Section>

          {/* ── Restaurant Information ── */}
          <Section icon={<Building2 size={18} />} title="Restaurant Information">
            <div className="grid gap-4 sm:grid-cols-2">
              {field("Restaurant Name *", "name", "text", "e.g. SAFNAM Restaurant")}
              {field("GST Number", "gstNumber", "text", "e.g. 29ABCDE1234F1Z5")}
              <label className="sm:col-span-2 block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Brief description of your restaurant..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/10"
                />
              </label>
            </div>
          </Section>

          {/* ── Contact ── */}
          <Section icon={<Phone size={18} />} title="Contact Information">
            <div className="grid gap-4 sm:grid-cols-2">
              {field("Phone Number *", "phone", "tel", "e.g. +91 9999999999")}
              {field("Email", "email", "email", "e.g. contact@restaurant.com")}
              <label className="sm:col-span-2 block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Address *</span>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  rows={2}
                  placeholder="Full restaurant address..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/10"
                />
              </label>
            </div>
          </Section>

          {/* ── Operating Hours ── */}
          <Section icon={<Clock size={18} />} title="Operating Hours">
            <div className="grid gap-4 sm:grid-cols-2">
              {field("Opening Time *", "openingTime", "time")}
              {field("Closing Time *", "closingTime", "time")}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              These hours are used in booking validation and displayed on customer pages.
            </p>
          </Section>

          {/* ── Localization ── */}
          <Section icon={<Globe size={18} />} title="Localization">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Currency *</span>
                <input
                  type="text"
                  value={form.currency}
                  maxLength={3}
                  onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                  placeholder="INR"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/10"
                />
              </label>
              {field("Timezone", "timezone", "text", "e.g. Asia/Kolkata")}
            </div>
          </Section>

          {/* ── Save ── */}
          <div className="flex items-center justify-end gap-3 rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
            <button
              type="button"
              onClick={() => restaurantQuery.refetch()}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={saveMutation.isPending}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || restaurantQuery.isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-amber-600">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}
