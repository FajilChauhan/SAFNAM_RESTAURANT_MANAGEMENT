import { PageHeader } from "@/components/ui";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="System and business notifications" />
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">Notification center is ready for future backend integration.</p>
      </div>
    </div>
  );
}

