import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { biApi } from "@/api/bi.api";
import { Button, EmptyState, Input, PageHeader, Select } from "@/components/ui";
import { formatCurrency, getErrorMessage } from "@/utils/formatters";

type Period = "daily" | "weekly" | "monthly" | "yearly" | "custom";

const reportTypes = [
  { key: "revenue", title: "Revenue", description: "Successful payment totals and payment methods" },
  { key: "orders", title: "Orders", description: "Order counts, top foods, and kitchen performance" },
  { key: "bookings", title: "Bookings", description: "Booking totals, statuses, and source mix" },
  { key: "customers", title: "Customers", description: "Customer growth and spending indicators" },
  { key: "payments", title: "Payments", description: "Payment volume and pending billing insight" },
  { key: "menu-performance", title: "Menu Performance", description: "Revenue by menu category" },
  { key: "table-utilization", title: "Table Utilization", description: "Usage and occupancy by table" },
  { key: "room-utilization", title: "Room Utilization", description: "Room occupancy, stay, and revenue" },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [applied, setApplied] = useState({ period, startDate, endDate });

  const params: Record<string, string> =
    applied.period === "custom"
      ? { period: applied.period, startDate: applied.startDate, endDate: applied.endDate }
      : { period: applied.period };
  const reports = useQueries({
    queries: reportTypes.map((report) => ({
      queryKey: ["admin", "report", report.key, params],
      queryFn: async () => (await biApi.report(report.key, params)).data.data.report,
    })),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Real PostgreSQL aggregation reports for SAFNAM Restaurant" />

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[200px_1fr_1fr_auto] md:items-end">
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-700">Period</span>
            <Select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
              <option value="daily">Today</option>
              <option value="weekly">7 Days</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
              <option value="custom">Custom Range</option>
            </Select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-700">Start Date</span>
            <Input type="date" disabled={period !== "custom"} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-700">End Date</span>
            <Input type="date" disabled={period !== "custom"} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <Button onClick={() => setApplied({ period, startDate, endDate })}>Apply</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {reportTypes.map((report, index) => {
          const query = reports[index];
          return (
            <article key={report.key} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><BarChart3 size={20} /></div>
                <div>
                  <h3 className="font-semibold text-slate-900">{report.title}</h3>
                  <p className="text-sm text-slate-600">{report.description}</p>
                </div>
              </div>
              {query.isError ? (
                <EmptyState title="Report unavailable" description={getErrorMessage(query.error)} />
              ) : query.isLoading ? (
                <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
              ) : (
                <ReportPreview data={query.data?.data} />
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ReportPreview({ data }: { data: unknown }) {
  if (!data) return <EmptyState title="No report data" description="This report returned no data for the selected period." />;
  if (Array.isArray(data)) {
    return data.length ? (
      <div className="space-y-2">
        {data.slice(0, 6).map((item, index) => (
          <div key={index} className="flex justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span>{String(item.label ?? item.name ?? item.status ?? item.method ?? `Item ${index + 1}`)}</span>
            <span className="font-semibold text-slate-900">{formatValue(item.value ?? item.revenue ?? item.total ?? item._count?.id)}</span>
          </div>
        ))}
      </div>
    ) : <EmptyState title="No report data" description="This report returned an empty dataset." />;
  }
  const entries = Object.entries(data as Record<string, unknown>).filter(([, value]) => typeof value !== "object" || value === null).slice(0, 8);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">{humanize(key)}</p>
          <p className="mt-1 font-semibold text-slate-900">{formatValue(value)}</p>
        </div>
      ))}
    </div>
  );
}

function formatValue(value: unknown) {
  if (value === undefined || value === null) return "-";
  const numeric = Number(value);
  if (Number.isFinite(numeric) && String(value).match(/^\d+(\.\d+)?$/)) return numeric > 999 ? formatCurrency(numeric) : String(numeric);
  return String(value);
}

function humanize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, (char) => char.toUpperCase());
}
