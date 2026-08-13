import { useState } from "react";
import { Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminCustomer, type UserStatus } from "@/api/admin.api";
import { Button, EmptyState, Input, Modal, PageHeader, StatusChip } from "@/components/ui";
import { formatCurrency, getErrorMessage } from "@/utils/formatters";

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminCustomer | null>(null);

  const customersQuery = useQuery({
    queryKey: ["admin", "customers", search],
    queryFn: async () => (await adminApi.customers.list({ search, limit: 100 })).data.data.customers,
  });
  const customerDetailsQuery = useQuery({
    queryKey: ["admin", "customers", selected?.id, "details"],
    enabled: Boolean(selected?.id),
    queryFn: async () => (await adminApi.customers.get(selected!.id)).data.data.customer as AdminCustomer & {
      bookings?: Array<{ id: string; bookingNumber?: string; bookingType?: string; status?: string; bookingDate?: string }>;
      orders?: Array<{ id: string; orderNumber?: string; status?: string; totalSnapshot?: string | number }>;
      payments?: Array<{ id: string; paymentNumber?: string; status?: string; amount?: string | number }>;
      feedback?: Array<{ id: string; comments?: string; foodRating?: number; serviceRating?: number }>;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) => adminApi.customers.status(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      setSelected(null);
    },
  });

  const rows = customersQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" subtitle="Customer profiles, visits, and loyalty overview" />

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <label className="relative block md:w-96">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers" className="pl-10" />
        </label>

        {customersQuery.isError ? (
          <EmptyState title="Unable to load customers" description={getErrorMessage(customersQuery.error)} action={<Button variant="outline" onClick={() => customersQuery.refetch()}>Retry</Button>} />
        ) : !rows.length && !customersQuery.isLoading ? (
          <EmptyState title="No customers found" description="Customer accounts will appear here after registration or staff-created bookings." />
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="rounded-l-xl px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Visits</th>
                  <th className="px-4 py-3">Total Spent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="rounded-r-xl px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-100">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{customer.fullName}</div>
                      <div className="text-xs text-slate-500">{customer.email ?? "No email"}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{customer.phoneNumber}</td>
                    <td className="px-4 py-4 text-slate-600">{customer.visitCount}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{formatCurrency(Number(customer.totalSpending ?? 0))}</td>
                    <td className="px-4 py-4"><StatusChip status={customer.status} /></td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelected(customer)}>View</Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => statusMutation.mutate({ id: customer.id, status: customer.status === "ACTIVE" ? "BLOCKED" : "ACTIVE" })}
                        >
                          {customer.status === "ACTIVE" ? "Block" : "Reactivate"}
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

      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Customer Details">
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            <Info label="Name" value={(customerDetailsQuery.data ?? selected).fullName} />
            <Info label="Phone" value={(customerDetailsQuery.data ?? selected).phoneNumber} />
            <Info label="Email" value={(customerDetailsQuery.data ?? selected).email ?? "-"} />
            <Info label="Visits" value={String((customerDetailsQuery.data ?? selected).visitCount)} />
            <Info label="Total Spending" value={formatCurrency(Number((customerDetailsQuery.data ?? selected).totalSpending ?? 0))} />
            <Info label="Last Visit" value={(customerDetailsQuery.data ?? selected).lastVisitAt ? new Date((customerDetailsQuery.data ?? selected).lastVisitAt!).toLocaleString() : "-"} />
            <Info label="Status" value={(customerDetailsQuery.data ?? selected).status} />
            <History title="Recent Bookings" items={(customerDetailsQuery.data?.bookings ?? []).map((item) => `${item.bookingNumber ?? item.id} · ${item.bookingType ?? "-"} · ${item.status ?? "-"}`)} />
            <History title="Recent Orders" items={(customerDetailsQuery.data?.orders ?? []).map((item) => `${item.orderNumber ?? item.id} · ${item.status ?? "-"} · ${formatCurrency(Number(item.totalSnapshot ?? 0))}`)} />
            <History title="Recent Payments" items={(customerDetailsQuery.data?.payments ?? []).map((item) => `${item.paymentNumber ?? item.id} · ${item.status ?? "-"} · ${formatCurrency(Number(item.amount ?? 0))}`)} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function History({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="font-semibold text-slate-900">{title}</p>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-slate-700">
          {items.slice(0, 5).map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : <p className="mt-1 text-slate-500">No records found.</p>}
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
