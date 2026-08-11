import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/admin.api";
import { EmptyState, PageHeader } from "@/components/ui";
import { getErrorMessage } from "@/utils/formatters";

export default function RolesPage() {
  const rolesQuery = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: async () => (await adminApi.roles()).data.data.roles,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Roles" subtitle="Backend-enforced SAFNAM application roles" />
      {rolesQuery.isError ? (
        <EmptyState title="Unable to load roles" description={getErrorMessage(rolesQuery.error)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(rolesQuery.data ?? []).map((role) => (
            <article key={role.role} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-900">{role.role}</h3>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {role.assignableToEmployee ? "Staff" : "Customer"}
                </span>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-700">Permissions</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {role.permissions.length ? role.permissions.map((permission) => (
                  <span key={permission} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{permission}</span>
                )) : <span className="text-sm text-slate-500">No operational permissions configured.</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
