import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { EmptyState, PageHeader } from "@/components/ui";
import { getErrorMessage } from "@/utils/formatters";

type Activity = { id: string; module: string; action: string; actor: string; entity: string; timestamp: string };

export default function NotificationsPage() {
  const activityQuery = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: async () => (await adminApi.auditLogs({ limit: 20 })).data.data.audit.activities as unknown as Activity[],
  });

  const activities = activityQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="Recent admin-relevant SAFNAM operational updates" />
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        {activityQuery.isError ? (
          <EmptyState title="Unable to load notifications" description={getErrorMessage(activityQuery.error)} />
        ) : !activities.length && !activityQuery.isLoading ? (
          <EmptyState title="No notifications" description="Recent operational changes will appear here." />
        ) : (
          <div className="space-y-3">
            {activities.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Bell size={18} /></div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{item.module}: {item.action}</p>
                  <p className="text-sm text-slate-600">{item.entity} · {item.actor}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
