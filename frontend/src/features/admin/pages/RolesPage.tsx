import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, type UserRole } from "@/api/admin.api";
import { EmptyState, PageHeader } from "@/components/ui";
import { getErrorMessage } from "@/utils/formatters";
import { Shield, Users, Key, Check } from "lucide-react";
import { cn } from "@/utils/cn";

// Pure frontend labeling/description metadata for display mapping (Centralized)
export const roleMetadata: Record<UserRole, { label: string; description: string; color: string; ring: string }> = {
  ADMIN: {
    label: "Administrator",
    description: "Restaurant administrator/owner-level staff responsible for restaurant configuration, employees, roles, permissions, reports, and overall system management.",
    color: "bg-red-50 text-red-700 border-red-100",
    ring: "focus-within:ring-red-500/20",
  },
  MANAGER: {
    label: "Manager",
    description: "Restaurant operations manager who manages daily restaurant operations, bookings, orders, menu/rooms/tables/offers according to assigned permissions.",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    ring: "focus-within:ring-emerald-500/20",
  },
  RECEPTION: {
    label: "Reception",
    description: "Front-desk staff responsible for customer assistance, bookings, guest check-in/check-out, and reception operations according to assigned permissions.",
    color: "bg-blue-50 text-blue-700 border-blue-100",
    ring: "focus-within:ring-blue-500/20",
  },
  KITCHEN: {
    label: "Kitchen",
    description: "Kitchen staff responsible for viewing and processing food orders and updating kitchen order status according to assigned permissions.",
    color: "bg-amber-50 text-amber-700 border-amber-100",
    ring: "focus-within:ring-amber-500/20",
  },
  CUSTOMER: {
    label: "Customer",
    description: "Restaurant customer who can book tables/rooms, view menu, place eligible orders, manage their own account, and use customer features.",
    color: "bg-purple-50 text-purple-700 border-purple-100",
    ring: "focus-within:ring-purple-500/20",
  },
};

// Pure frontend mapping of database keys to beautiful labels/categories
export const permissionMetadata: Record<string, { group: string; label: string; description: string }> = {
  "operations.dashboard.view": {
    group: "Dashboard",
    label: "View Dashboard",
    description: "Allows the employee to view the restaurant operational dashboard overview.",
  },
  "operations.reception.view": {
    group: "Bookings & Reception",
    label: "View Reception Operations",
    description: "Grants access to check-ins, check-outs, bookings, and front desk operations.",
  },
  "operations.kitchen.view": {
    group: "Kitchen",
    label: "View Kitchen Operations",
    description: "Allows staff to monitor active orders, manage preparation queues, and update order statuses.",
  },
  "operations.manager.view": {
    group: "Reports & Audits",
    label: "View Manager Reports",
    description: "Allows viewing details of today's orders, revenue breakdowns, and daily summaries.",
  },
  "operations.admin.view": {
    group: "System Admin",
    label: "View Admin Dashboard",
    description: "Grants access to system performance stats, system settings, and high-level health parameters.",
  },
  "operations.payments.view": {
    group: "Payments & Invoices",
    label: "View Payments",
    description: "Allows viewing payment logs, invoice histories, and pending bills/unpaid sessions.",
  },
  "operations.settings.view": {
    group: "System Settings",
    label: "View Settings",
    description: "Allows reading restaurant configurations, floor maps, and metadata.",
  },
  "operations.roles.view": {
    group: "Access Controls",
    label: "View Roles & Permissions",
    description: "Allows reading access control matrices and assigned role scopes.",
  },
  "operations.permissions.manage": {
    group: "Access Controls",
    label: "Manage Permissions",
    description: "Allows changing database-persisted permissions for SAFNAM roles.",
  },
  "operations.employees.view": { group: "Employees", label: "View Employees", description: "Allows viewing SAFNAM employee records." },
  "operations.employees.create": { group: "Employees", label: "Add Employee", description: "Allows creating new employee accounts." },
  "operations.employees.update": { group: "Employees", label: "Edit Employee", description: "Allows updating employee details, role, and status." },
  "operations.employees.delete": { group: "Employees", label: "Delete Employee", description: "Allows deleting employee records where business rules permit it." },
  "operations.customers.view": { group: "Customers", label: "View Customers", description: "Allows viewing customer records and customer activity." },
  "operations.bookings.view": { group: "Bookings", label: "View Bookings", description: "Allows viewing table and room bookings." },
  "operations.bookings.create": { group: "Bookings", label: "Create Booking", description: "Allows manually creating table and room bookings." },
  "operations.bookings.update": { group: "Bookings", label: "Update Booking", description: "Allows updating booking details and operational state." },
  "operations.bookings.cancel": { group: "Bookings", label: "Cancel Booking", description: "Allows cancelling bookings where business rules permit it." },
  "operations.orders.view": { group: "Orders", label: "View Orders", description: "Allows viewing restaurant orders." },
  "operations.orders.update": { group: "Orders", label: "Update Orders", description: "Allows changing order and kitchen workflow status." },
  "operations.menu.view": { group: "Menu", label: "View Menu Items", description: "Allows viewing menu item management." },
  "operations.menu.create": { group: "Menu", label: "Add Menu Item", description: "Allows creating menu items." },
  "operations.menu.update": { group: "Menu", label: "Edit Menu Item", description: "Allows updating menu item details and availability." },
  "operations.menu.delete": { group: "Menu", label: "Delete Menu Item", description: "Allows deleting menu items where business rules permit it." },
  "operations.categories.view": { group: "Categories", label: "View Categories", description: "Allows viewing menu categories." },
  "operations.categories.create": { group: "Categories", label: "Add Category", description: "Allows creating menu categories." },
  "operations.categories.update": { group: "Categories", label: "Edit Category", description: "Allows updating menu categories." },
  "operations.categories.delete": { group: "Categories", label: "Delete Category", description: "Allows deleting categories where business rules permit it." },
  "operations.tables.view": { group: "Tables", label: "View Tables", description: "Allows viewing dining tables." },
  "operations.tables.create": { group: "Tables", label: "Add Table", description: "Allows creating dining tables." },
  "operations.tables.update": { group: "Tables", label: "Edit Table", description: "Allows updating dining tables and status." },
  "operations.tables.delete": { group: "Tables", label: "Delete Table", description: "Allows deleting tables where business rules permit it." },
  "operations.floors.view": { group: "Floors", label: "View Floors", description: "Allows viewing restaurant floors." },
  "operations.floors.create": { group: "Floors", label: "Add Floor", description: "Allows creating floors." },
  "operations.floors.update": { group: "Floors", label: "Edit Floor", description: "Allows updating floors." },
  "operations.floors.delete": { group: "Floors", label: "Delete Floor", description: "Allows deleting floors where business rules permit it." },
  "operations.rooms.view": { group: "Rooms", label: "View Rooms", description: "Allows viewing rooms." },
  "operations.rooms.create": { group: "Rooms", label: "Add Room", description: "Allows creating rooms." },
  "operations.rooms.update": { group: "Rooms", label: "Edit Room", description: "Allows updating rooms and availability." },
  "operations.rooms.delete": { group: "Rooms", label: "Delete Room", description: "Allows deleting rooms where business rules permit it." },
  "operations.offers.view": { group: "Offers", label: "View Offers", description: "Allows viewing promotional offers." },
  "operations.offers.create": { group: "Offers", label: "Add Offer", description: "Allows creating promotional offers." },
  "operations.offers.update": { group: "Offers", label: "Edit Offer", description: "Allows updating offers, scopes, and status." },
  "operations.offers.delete": { group: "Offers", label: "Delete Offer", description: "Allows deleting offers where business rules permit it." },
  "operations.reports.view": { group: "Reports", label: "View Reports", description: "Allows viewing restaurant reports and analytics." },
  "operations.notifications.view": { group: "Notifications", label: "View Notifications", description: "Allows viewing operational notifications." },
  "operations.audit-logs.view": { group: "Audit Logs", label: "View Audit Logs", description: "Allows viewing administrative audit logs." },
};

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const rolesQuery = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: async () => (await adminApi.roles()).data.data.roles,
  });

  const employeesQuery = useQuery({
    queryKey: ["admin", "employees", "all"],
    queryFn: async () => (await adminApi.employees.list({ limit: 1000 })).data.data.employees,
  });

  // Calculate staff counts per role dynamically from the employees API response
  const staffCounts = useMemo(() => {
    const counts: Record<UserRole, number> = {
      ADMIN: 0,
      MANAGER: 0,
      RECEPTION: 0,
      KITCHEN: 0,
      CUSTOMER: 0,
    };
    (employeesQuery.data ?? []).forEach((emp) => {
      if (emp.role in counts) {
        counts[emp.role]++;
      }
    });
    return counts;
  }, [employeesQuery.data]);

  const activeRoleDetails = useMemo(() => {
    if (!selectedRole) return null;
    return rolesQuery.data?.find((r) => r.role === selectedRole);
  }, [rolesQuery.data, selectedRole]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        subtitle="Manage restaurant staff roles and view their assigned database-enforced permissions"
      />

      {rolesQuery.isError ? (
        <EmptyState title="Unable to load roles" description={getErrorMessage(rolesQuery.error)} />
      ) : rolesQuery.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Main Role Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {(rolesQuery.data ?? []).map((roleItem) => {
              const meta = roleMetadata[roleItem.role];
              const count = staffCounts[roleItem.role] ?? 0;
              return (
                <article
                  key={roleItem.role}
                  onClick={() => setSelectedRole(roleItem.role)}
                  className={cn(
                    "cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md",
                    selectedRole === roleItem.role
                      ? "border-emerald-500 ring-2 ring-emerald-500/10"
                      : "border-gray-100",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("rounded-xl border p-2.5", meta.color)}>
                        <Shield size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{meta.label}</h3>
                        <span className="font-mono text-xs uppercase tracking-wide text-gray-400">
                          {roleItem.role}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {roleItem.assignableToEmployee ? "Staff" : "Customer"}
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-2 min-h-[40px] text-sm text-gray-500">
                    {meta.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Users size={14} className="text-gray-400" />
                      <span className="font-semibold text-gray-700">{count}</span> assigned
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Key size={14} className="text-gray-400" />
                      <span className="font-semibold text-gray-700">{roleItem.permissions.length}</span> permissions
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Details Panel */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            {selectedRole && activeRoleDetails ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">
                      {roleMetadata[selectedRole].label}
                    </h2>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Active Role
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {roleMetadata[selectedRole].description}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Assigned operational permissions ({activeRoleDetails.permissions.length})
                  </h4>
                  <div className="mt-4 space-y-2">
                    {activeRoleDetails.permissions.length === 0 ? (
                      <p className="text-sm text-gray-400">No operational permissions granted to this role.</p>
                    ) : (
                      activeRoleDetails.permissions.map((perm) => {
                        const permMeta = permissionMetadata[perm] ?? {
                          group: "Operations",
                          label: perm,
                          description: "",
                        };
                        return (
                          <div
                            key={perm}
                            className="flex items-start gap-3 rounded-xl border border-gray-50 bg-gray-50/40 p-3"
                          >
                            <div className="mt-0.5 rounded-full bg-emerald-100 p-0.5 text-emerald-600">
                              <Check size={12} strokeWidth={3} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{permMeta.label}</p>
                              {permMeta.description && (
                                <p className="mt-0.5 text-xs text-gray-400">{permMeta.description}</p>
                              )}
                              <span className="mt-1.5 inline-block rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">
                                {perm}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <Shield size={40} className="text-gray-200" />
                <h3 className="mt-4 font-bold text-gray-500">No Role Selected</h3>
                <p className="mt-1 max-w-[240px] text-xs text-gray-400">
                  Select a role from the list to view its description, staff count, and permissions.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
