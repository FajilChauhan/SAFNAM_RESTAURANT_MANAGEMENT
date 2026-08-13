import { useMemo, useState, type ReactNode } from "react";
import { Plus, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminEmployee, type UserStatus } from "@/api/admin.api";
import { Button, EmptyState, Input, Modal, PageHeader, Select, StatusChip } from "@/components/ui";
import { getErrorMessage } from "@/utils/formatters";
import { toast } from "@/utils/toast";

type EmployeeForm = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: "ADMIN" | "MANAGER" | "RECEPTION" | "KITCHEN";
  status: UserStatus;
};

const blankForm: EmployeeForm = {
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
  role: "RECEPTION",
  status: "ACTIVE",
};

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewing, setViewing] = useState<AdminEmployee | null>(null);
  const [editing, setEditing] = useState<AdminEmployee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(blankForm);
  const [error, setError] = useState("");

  const employeesQuery = useQuery({
    queryKey: ["admin", "employees", search],
    queryFn: async () => (await adminApi.employees.list({ search, limit: 100 })).data.data.employees,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        email: form.email.trim() || undefined,
        password: form.password.trim() || undefined,
      };
      if (editing) {
        const { password, ...rest } = payload;
        return adminApi.employees.update(editing.id, password ? payload : rest);
      }
      if (!payload.password) throw new Error("Password is required for a new employee");
      return adminApi.employees.create(payload as EmployeeForm);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "employees"] });
      toast.success(editing ? "Employee updated successfully." : "Employee created successfully.");
      closeModal();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) => adminApi.employees.status(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "employees"] }); toast.success("Employee status updated."); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.employees.remove(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "employees"] }); toast.success("Employee deleted successfully."); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const rows = employeesQuery.data ?? [];
  const isValid = useMemo(() => form.fullName.trim().length >= 2 && form.phoneNumber.trim().length >= 7 && (editing || form.password.length >= 8), [form, editing]);

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm);
    setError("");
    setIsModalOpen(true);
  };

  const openEdit = (employee: AdminEmployee) => {
    setEditing(employee);
    setForm({
      fullName: employee.fullName,
      email: employee.email ?? "",
      phoneNumber: employee.phoneNumber,
      password: "",
      role: employee.role,
      status: employee.status,
    });
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(blankForm);
    setError("");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Employees" subtitle="Create and manage SAFNAM staff accounts" />

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="relative block md:w-80">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employees" className="pl-10" />
          </label>
          <Button onClick={openCreate} leftIcon={<Plus size={16} />}>Add Employee</Button>
        </div>

        {employeesQuery.isError ? (
          <EmptyState title="Unable to load employees" description={getErrorMessage(employeesQuery.error)} action={<Button variant="outline" onClick={() => employeesQuery.refetch()}>Retry</Button>} />
        ) : !rows.length && !employeesQuery.isLoading ? (
          <EmptyState title="No employees found" description="Create staff accounts for managers, reception, and kitchen employees." />
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="rounded-l-xl px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Login</th>
                  <th className="rounded-r-xl px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((employee) => (
                  <tr key={employee.id} className="border-b border-gray-100">
                    <td className="px-4 py-4 font-semibold text-slate-900">{employee.fullName}</td>
                    <td className="px-4 py-4 text-slate-600">
                      <div>{employee.phoneNumber}</div>
                      <div className="text-xs text-slate-500">{employee.email ?? "No email"}</div>
                    </td>
                    <td className="px-4 py-4">{employee.role}</td>
                    <td className="px-4 py-4"><StatusChip status={employee.status} /></td>
                    <td className="px-4 py-4 text-slate-600">{employee.lastLoginAt ? new Date(employee.lastLoginAt).toLocaleString() : "-"}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setViewing(employee)}>View</Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(employee)}>Edit</Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => statusMutation.mutate({ id: employee.id, status: employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}
                        >
                          {employee.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => window.confirm(`Delete ${employee.fullName}?`) && deleteMutation.mutate(employee.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editing ? "Edit Employee" : "Add Employee"}>
        <div className="space-y-4">
          {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <Field label="Name"><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
          <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} /></Field>
          <Field label={editing ? "New password (optional)" : "Password"}>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Role">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as EmployeeForm["role"] })}>
                <option value="CUSTOMER" disabled>Customer — use Customer Management</option>
                <option value="RECEPTION">Reception</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="KITCHEN">Kitchen</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as UserStatus })}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="BLOCKED">Blocked</option>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="button" disabled={!isValid} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {editing ? "Save Changes" : "Create Employee"}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={Boolean(viewing)} onClose={() => setViewing(null)} title="Employee Details">
        {viewing ? (
          <div className="space-y-3 text-sm">
            <Info label="Name" value={viewing.fullName} />
            <Info label="Phone" value={viewing.phoneNumber} />
            <Info label="Email" value={viewing.email ?? "-"} />
            <Info label="Role" value={viewing.role} />
            <Info label="Status" value={viewing.status} />
            <Info label="Last Login" value={viewing.lastLoginAt ? new Date(viewing.lastLoginAt).toLocaleString() : "-"} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
