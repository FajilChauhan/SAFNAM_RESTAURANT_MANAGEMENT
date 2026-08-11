import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/admin.api";
import { EmptyState, PageHeader } from "@/components/ui";
import { getErrorMessage } from "@/utils/formatters";

type Activity = {
  id: string;
  module: string;
  action: string;
  actor: string;
  role: string;
  entity: string;
  timestamp: string;
};

export default function AuditLogsPage() {
  const auditQuery = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: async () => (await adminApi.auditLogs({ limit: 50 })).data.data.audit,
  });

  const activities = (auditQuery.data?.activities ?? []) as unknown as Activity[];

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" subtitle="Recent operational activity derived from existing SAFNAM data" />
      {auditQuery.isError ? (
        <EmptyState title="Unable to load audit activity" description={getErrorMessage(auditQuery.error)} />
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          {auditQuery.data?.note ? <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{auditQuery.data.note}</p> : null}
          {!activities.length ? (
            <EmptyState title="No activity found" description="Operational activity will appear here after users, bookings, orders, or payments change." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="rounded-l-xl px-4 py-3">Time</th>
                    <th className="px-4 py-3">Module</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="rounded-r-xl px-4 py-3">Entity</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="px-4 py-4 text-slate-600">{new Date(item.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{item.module}</td>
                      <td className="px-4 py-4 text-slate-700">{item.action}</td>
                      <td className="px-4 py-4 text-slate-700">{item.actor} <span className="text-xs text-slate-500">({item.role})</span></td>
                      <td className="px-4 py-4 text-slate-600">{item.entity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
