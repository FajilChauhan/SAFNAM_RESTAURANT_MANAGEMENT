import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type UserRole } from "@/api/admin.api";
import { EmptyState, PageHeader } from "@/components/ui";
import { getErrorMessage } from "@/utils/formatters";
import { Shield, Key, Save, RotateCcw, HelpCircle, Check, Info } from "lucide-react";
import { cn } from "@/utils/cn";
import { toast } from "@/utils/toast";
import { roleMetadata, permissionMetadata } from "./RolesPage";

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<UserRole>("MANAGER");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const rolesQuery = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: async () => (await adminApi.roles()).data.data.roles,
  });

  const permissionsQuery = useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: async () => (await adminApi.permissions()).data.data.permissions,
  });

  const activeRole = rolesQuery.data?.find((item) => item.role === selectedRole);
  const currentPermissions = isDirty ? selectedPermissions : activeRole?.permissions ?? [];

  // Group all permissions into human-readable categories
  const groupedPermissions = useMemo(() => {
    const list = permissionsQuery.data ?? [];
    return list.reduce<Record<string, Array<{ key: string; label: string; description: string }>>>((acc, item) => {
      const meta = permissionMetadata[item.permission] ?? {
        group: "Operations",
        label: item.permission.split(".").slice(-1)[0].toUpperCase(),
        description: `Allow access to ${item.permission}`,
      };
      acc[meta.group] = acc[meta.group] ?? [];
      acc[meta.group].push({
        key: item.permission,
        label: meta.label,
        description: meta.description,
      });
      return acc;
    }, {});
  }, [permissionsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => adminApi.updateRolePermissions(selectedRole, currentPermissions),
    onSuccess: async () => {
      setSelectedPermissions([]);
      setIsDirty(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      toast.success("Role permissions updated successfully");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const togglePermission = (permissionKey: string) => {
    if (selectedRole === "ADMIN") return;
    const nextSet = new Set(currentPermissions);
    if (nextSet.has(permissionKey)) {
      nextSet.delete(permissionKey);
    } else {
      nextSet.add(permissionKey);
    }
    setSelectedPermissions([...nextSet]);
    setIsDirty(true);
  };

  const handleReset = () => {
    setSelectedPermissions([]);
    setIsDirty(false);
  };

  const handleCancel = () => {
    setSelectedPermissions(activeRole?.permissions ?? []);
    setIsDirty(true);
  };

  const toggleGroup = (permissions: Array<{ key: string }>) => {
    if (selectedRole === "ADMIN") return;
    const nextSet = new Set(currentPermissions);
    const allSelected = permissions.every((item) => nextSet.has(item.key));
    permissions.forEach((item) => {
      if (allSelected) {
        nextSet.delete(item.key);
      } else {
        nextSet.add(item.key);
      }
    });
    setSelectedPermissions([...nextSet]);
    setIsDirty(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        subtitle="Manage database-persisted access controls for staff roles"
      />

      {rolesQuery.isError || permissionsQuery.isError ? (
        <EmptyState
          title="Unable to load permissions"
          description={getErrorMessage(rolesQuery.error ?? permissionsQuery.error)}
        />
      ) : rolesQuery.isLoading || permissionsQuery.isLoading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="h-6 animate-pulse rounded bg-gray-100 w-1/4 mb-6" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* Top Control Bar */}
          <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label htmlFor="role-select" className="text-sm font-semibold text-gray-700">
                Selected Role:
              </label>
              <select
                id="role-select"
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as UserRole);
                  setSelectedPermissions([]);
                  setIsDirty(false);
                }}
                className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
              >
                {(["ADMIN", "MANAGER", "RECEPTION", "KITCHEN", "CUSTOMER"] as UserRole[]).map((role) => (
                  <option key={role} value={role}>
                    {roleMetadata[role].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  Unsaved changes
                </span>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-50 active:scale-[0.98]"
              >
                <RotateCcw size={14} />
                Reset
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-50 active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedRole === "ADMIN" || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-all shadow-sm",
                  selectedRole !== "ADMIN" && !saveMutation.isPending
                    ? "bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98]"
                    : "cursor-not-allowed bg-gray-200 text-gray-400",
                )}
              >
                <Save size={14} />
                Save Changes
              </button>
            </div>
          </div>

          {/* Role Status Alert */}
          {selectedRole === "ADMIN" ? (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
              <Info size={18} className="mt-0.5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Administrator role permissions are protected</p>
                <p className="mt-0.5 text-xs text-blue-700">
                  The system administrator role holds all permissions by default. Administrative access rights cannot be reduced.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
              <Info size={18} className="mt-0.5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">Configuring permissions for {roleMetadata[selectedRole].label}</p>
                <p className="mt-0.5 text-xs text-emerald-700">
                  Select or clear permissions below. Changes will take effect immediately for all employees assigned to this role once saved.
                </p>
              </div>
            </div>
          )}

          {/* Permissions Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(groupedPermissions).map(([groupName, permissions]) => (
              <section key={groupName} className="rounded-2xl border border-gray-100 p-5 bg-white shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Key size={16} className="text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-900">{groupName}</h3>
                  </div>
                  <button
                    type="button"
                    disabled={selectedRole === "ADMIN"}
                    onClick={() => toggleGroup(permissions)}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-bold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                  >
                    {permissions.every((item) => currentPermissions.includes(item.key)) ? "Clear All" : "Select All"}
                  </button>
                </div>
                <div className="space-y-3">
                  {permissions.map((item) => {
                    const checked = currentPermissions.includes(item.key);
                    return (
                      <label
                        key={item.key}
                        className={cn(
                          "flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all hover:bg-gray-50/40",
                          checked ? "border-emerald-200 bg-emerald-50/10" : "border-gray-100 bg-white",
                          selectedRole === "ADMIN" && "cursor-not-allowed",
                        )}
                      >
                        <div
                          onClick={(e) => {
                            e.preventDefault();
                            togglePermission(item.key);
                          }}
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
                            checked ? "border-emerald-500 bg-emerald-500" : "border-gray-300 bg-white",
                          )}
                        >
                          {checked && <Check size={12} strokeWidth={3} className="text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-800">{item.label}</p>
                          <p className="mt-0.5 text-xs text-gray-400">{item.description}</p>
                          <span className="mt-2 inline-block rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[9px] text-gray-500">
                            {item.key}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
