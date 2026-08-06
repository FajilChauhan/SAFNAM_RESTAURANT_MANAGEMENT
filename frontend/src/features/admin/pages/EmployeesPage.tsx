import { PageHeader } from "@/components/ui";
import { useEmployees } from "../hooks/useEmployees";
import { AdminSectionFallback } from "../admin.utils";

type EmployeeRow = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status?: string;
};

export default function EmployeesPage() {
  const { data, isLoading, isError, refetch } = useEmployees();
  const rows: EmployeeRow[] = isLoading
    ? Array.from({ length: 5 }, (_, index) => ({
        id: `loading-${index}`,
        name: "Loading...",
        email: "-",
        phone: "-",
        role: "-",
        status: "-",
      }))
    : ((data ?? []) as EmployeeRow[]);

  return (
    <div className="space-y-6">
      <PageHeader title="Employees" subtitle="Staff analytics and administrator-managed accounts" />
      {isError ? (
        <AdminSectionFallback
          title="Unable to load employees"
          description="The employee analytics endpoint is not responding right now."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Employee administration is currently backed by analytics data. If you want create/update/delete actions next, we should add the matching backend employee CRUD routes first.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2">Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
              {rows.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-3">{item.name}</td>
                    <td>{item.email}</td>
                    <td>{item.phone ?? "-"}</td>
                    <td>{item.role}</td>
                    <td>{item.status ?? "-"}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
