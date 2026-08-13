import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type UserRole } from "@/api/admin.api";
import { Button, EmptyState, PageHeader, Select } from "@/components/ui";
import { getErrorMessage } from "@/utils/formatters";

const roleLabels: Record<UserRole, string> = {
  CUSTOMER: "Customer",
  RECEPTION: "Reception",
  KITCHEN: "Kitchen",
  MANAGER: "Manager",
  ADMIN: "Admin",
};

const permissionLabels: Record<string, { group: string; label: string }> = {
  "operations.dashboard.view": { group: "Dashboard", label: "View Dashboard" },
  "operations.reception.view": { group: "Bookings & Reception", label: "View Reception Operations" },
  "operations.kitchen.view": { group: "Kitchen", label: "View Kitchen Operations" },
  "operations.manager.view": { group: "Reports", label: "View Manager Reports" },
  "operations.admin.view": { group: "Admin", label: "View Admin Dashboard" },
  "operations.payments.view": { group: "Payments", label: "View Payments" },
  "operations.settings.view": { group: "Settings", label: "View Settings" },
  "operations.roles.view": { group: "Roles & Permissions", label: "View Roles and Permissions" },
};

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<UserRole>("MANAGER");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const rolesQuery = useQuery({ queryKey: ["admin", "roles"], queryFn: async () => (await adminApi.roles()).data.data.roles });
  const permissionsQuery = useQuery({ queryKey: ["admin", "permissions"], queryFn: async () => (await adminApi.permissions()).data.data.permissions });

  const activeRole = rolesQuery.data?.find((item) => item.role === selectedRole);
  const currentPermissions = selectedPermissions.length ? selectedPermissions : activeRole?.permissions ?? [];

  const grouped = useMemo(() => {
    return (permissionsQuery.data ?? []).reduce<Record<string, Array<{ permission: string; label: string }>>>((acc, item) => {
      const meta = permissionLabels[item.permission] ?? { group: "Other", label: humanizePermission(item.permission) };
      acc[meta.group] = acc[meta.group] ?? [];
      acc[meta.group].push({ permission: item.permission, label: meta.label });
      return acc;
    }, {});
  }, [permissionsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => adminApi.updateRolePermissions(selectedRole, currentPermissions),
    onSuccess: async () => {
      setSelectedPermissions([]);
      await queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
    },
  });

  const toggle = (permission: string) => {
    const source = new Set(currentPermissions);
    if (source.has(permission)) source.delete(permission);
    else source.add(permission);
    setSelectedPermissions([...source]);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Permissions" subtitle="Manage backend-enforced role permissions with readable labels" />
      {rolesQuery.isError || permissionsQuery.isError ? (
        <EmptyState title="Unable to load permissions" description={getErrorMessage(rolesQuery.error ?? permissionsQuery.error)} />
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 grid gap-3 md:grid-cols-[260px_1fr_auto] md:items-end">
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Role</span>
              <Select value={selectedRole} onChange={(e) => { setSelectedRole(e.target.value as UserRole); setSelectedPermissions([]); }}>
                {(["RECEPTION", "KITCHEN", "MANAGER", "ADMIN"] as UserRole[]).map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
              </Select>
            </label>
            <p className="text-sm text-slate-600">
              These permissions are persisted in PostgreSQL and enforced by backend middleware. Admin permissions are visible but protected from reduction.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedPermissions([])}>Reset</Button>
              <Button variant="ghost" onClick={() => setSelectedPermissions(activeRole?.permissions ?? [])}>Cancel</Button>
              <Button disabled={selectedRole === "ADMIN"} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>Save Changes</Button>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {Object.entries(grouped).map(([group, permissions]) => (
              <section key={group} className="rounded-2xl border border-slate-100 p-4">
                <h3 className="font-semibold text-slate-900">{group}</h3>
                <div className="mt-3 space-y-2">
                  {permissions.map((item) => (
                    <label key={item.permission} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <span>{item.label}</span>
                      <input type="checkbox" disabled={selectedRole === "ADMIN"} checked={currentPermissions.includes(item.permission)} onChange={() => toggle(item.permission)} />
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function humanizePermission(value: string) {
  return value.split(".").slice(-2).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
