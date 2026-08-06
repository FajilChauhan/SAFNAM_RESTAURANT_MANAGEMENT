import { PageHeader } from "@/components/ui";
import { useReports } from "../hooks/useReports";

export default function ReportsPage() {
  const reports = useReports();
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Revenue, orders and customer analytics" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">Revenue report data loaded: {reports.revenue.data ? "Yes" : "No"}</div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">Orders report data loaded: {reports.orders.data ? "Yes" : "No"}</div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">Customer report data loaded: {reports.customers.data ? "Yes" : "No"}</div>
      </div>
    </div>
  );
}

