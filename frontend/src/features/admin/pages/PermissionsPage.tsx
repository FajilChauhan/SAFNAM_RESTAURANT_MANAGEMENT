import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/admin.api";
import { EmptyState, PageHeader } from "@/components/ui";
import { getErrorMessage } from "@/utils/formatters";

export default function PermissionsPage() {
  const permissionsQuery = useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: async () => (await adminApi.permissions()).data.data.permissions,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Permissions" subtitle="Current backend permission keys used by middleware" />
      {permissionsQuery.isError ? (
        <EmptyState title="Unable to load permissions" description={getErrorMessage(permissionsQuery.error)} />
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(permissionsQuery.data ?? []).map((item) => (
              <div key={item.permission} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700">
                {item.permission}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
