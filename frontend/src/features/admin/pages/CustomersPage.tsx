import { PageHeader } from "@/components/ui";
import { useCustomersAdmin } from "../hooks/useCustomersAdmin";

export default function CustomersPage() {
  const { data } = useCustomersAdmin("");
  return (
    <div className="space-y-6">
      <PageHeader title="Customers" subtitle="Customer profiles and loyalty overview" />
      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Visits</th>
              <th>Total Spent</th>
              <th>Last Visit</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((customer) => (
              <tr key={customer.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-3">{customer.name}</td>
                <td>{customer.email ?? "-"}</td>
                <td>{customer.phone ?? "-"}</td>
                <td>{customer.visits ?? 0}</td>
                <td>{customer.totalSpent ?? 0}</td>
                <td>{customer.lastVisit ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

