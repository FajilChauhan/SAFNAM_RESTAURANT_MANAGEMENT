import { PageHeader } from "@/components/ui";

export default function RestaurantSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Restaurant Settings" subtitle="Update restaurant profile and business configuration" />
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Settings UI is ready for the full backend save flow. The current backend exposes public restaurant read endpoints, and the update route can be wired next without changing the screen structure.
        </p>
      </div>
    </div>
  );
}

