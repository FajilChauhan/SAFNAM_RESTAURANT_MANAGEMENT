import { useState, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { biApi } from "@/api/bi.api";
import { EmptyState, PageHeader } from "@/components/ui";
import { getErrorMessage, formatCurrency } from "@/utils/formatters";
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Utensils,
  BedDouble,
  Users,
  ChevronRight,
  TrendingDown,
  Layers,
  Percent,
} from "lucide-react";
import { cn } from "@/utils/cn";

type Period = "daily" | "weekly" | "monthly" | "yearly" | "custom";

const reportTypes = [
  { key: "revenue", title: "Revenue Report", description: "Successful payment totals, breakdowns, and payment methods" },
  { key: "orders", title: "Orders Report", description: "Order counts, top-selling foods, and kitchen performance metrics" },
  { key: "bookings", title: "Bookings Report", description: "Booking volume, table/room bookings, status counts, and source mix" },
  { key: "customers", title: "Customers Report", description: "New customer counts, returning rates, and top customer spending" },
  { key: "menu-performance", title: "Menu Performance", description: "Categorized food sales and revenue generation breakdown" },
  { key: "table-utilization", title: "Table Utilization", description: "Occupancy status, utilization counts, and peak dining hours" },
  { key: "room-utilization", title: "Room Utilization", description: "Room occupancy metrics, popular types, and lodging revenue" },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [applied, setApplied] = useState({ period, startDate, endDate });

  const [activeReportKey, setActiveReportKey] = useState<string>("revenue");

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

  const activeIndex = useMemo(() => {
    return reportTypes.findIndex((r) => r.key === activeReportKey);
  }, [activeReportKey]);

  const activeQuery = reports[activeIndex];
  const activeReportInfo = reportTypes[activeIndex];

  const handleApply = () => {
    if (period === "custom" && startDate > endDate) {
      alert("Start Date cannot be after End Date");
      return;
    }
    setApplied({ period, startDate, endDate });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Real-time SQL aggregation reports for SAFNAM Restaurant"
      />

      {/* Date Range Selector */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <div>
            <label htmlFor="period-select" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Period
            </label>
            <select
              id="period-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
            >
              <option value="daily">Today</option>
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div>
            <label htmlFor="start-date" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              disabled={period !== "custom"}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="mb-1.5 block text-sm font-semibold text-gray-700">
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              disabled={period !== "custom"}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <button
            type="button"
            onClick={handleApply}
            className="flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Reports Sidebar + Details Layout */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Report Types List */}
        <div className="flex flex-col gap-2">
          {reportTypes.map((report) => (
            <button
              key={report.key}
              onClick={() => setActiveReportKey(report.key)}
              className={cn(
                "flex items-center justify-between rounded-2xl border p-4 text-left transition-all",
                activeReportKey === report.key
                  ? "border-emerald-500 bg-emerald-50/40 text-emerald-800 shadow-sm"
                  : "border-gray-100 bg-white text-gray-700 hover:border-gray-200 hover:bg-gray-50/50",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 rounded-xl border p-2",
                    activeReportKey === report.key ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-100",
                  )}
                >
                  <BarChart3 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">{report.title}</h3>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-400">{report.description}</p>
                </div>
              </div>
              <ChevronRight size={14} className={activeReportKey === report.key ? "text-emerald-500" : "text-gray-300"} />
            </button>
          ))}
        </div>

        {/* Selected Report Details Display */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-4 border-b border-gray-100 pb-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <BarChart3 size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{activeReportInfo.title}</h2>
              <p className="text-sm text-gray-500">{activeReportInfo.description}</p>
            </div>
          </div>

          {activeQuery.isError ? (
            <EmptyState
              title="Report calculation failed"
              description={getErrorMessage(activeQuery.error)}
            />
          ) : activeQuery.isLoading ? (
            <div className="space-y-4">
              <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
              <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
            </div>
          ) : (
            <ReportViewer reportKey={activeReportKey} data={activeQuery.data?.data} />
          )}
        </div>
      </div>
    </div>
  );
}

function ReportViewer({ reportKey, data }: { reportKey: string; data: any }) {
  if (!data) {
    return <EmptyState title="No report data" description="This report returned no database records for the selected period." />;
  }

  // Handle revenue & sales
  if (reportKey === "revenue") {
    const total = Number(data.totalRevenue ?? 0);
    const count = Number(data.paymentCount ?? 0);
    const growth = data.revenueGrowthPercent;

    return (
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Revenue</span>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 border border-emerald-100">
                <DollarSign size={16} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-gray-900">{formatCurrency(total)}</p>
            {growth !== null && (
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                {Number(growth) >= 0 ? (
                  <span className="flex items-center gap-0.5 font-semibold text-emerald-600">
                    <TrendingUp size={12} /> +{growth}%
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 font-semibold text-rose-600">
                    <TrendingDown size={12} /> {growth}%
                  </span>
                )}
                <span className="text-gray-400">vs previous period</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Paid Transactions</span>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 border border-emerald-100">
                <Users size={16} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-gray-900">{count}</p>
            <p className="mt-2 text-xs text-gray-400">Successful database payments</p>
          </div>
        </div>

        {/* Payments by Method */}
        {data.byPaymentMethod && data.byPaymentMethod.length > 0 && (
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Revenue by Payment Method</h3>
            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4 text-right">Transactions</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {data.byPaymentMethod.map((item: any) => (
                    <tr key={item.method} className="hover:bg-gray-50/30">
                      <td className="px-6 py-4 font-semibold text-gray-900">{item.method}</td>
                      <td className="px-6 py-4 text-right font-medium">{item.payments}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(Number(item.revenue))}
                      </td>
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

  // Handle orders
  if (reportKey === "orders") {
    const total = data.totalOrders ?? 0;
    const avg = Number(data.averageOrderValue ?? 0);
    const prep = Number(data.averagePreparationMinutes ?? 0);

    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Orders</span>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{total}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Avg Order Value</span>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{formatCurrency(avg)}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Avg Prep Time</span>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{prep.toFixed(1)} mins</p>
          </div>
        </div>

        {/* Top Selling Foods */}
        {data.mostOrderedFood && data.mostOrderedFood.length > 0 && (
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Top Selling Foods</h3>
            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4 text-right">Quantity Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {data.mostOrderedFood.map((item: any) => (
                    <tr key={item.menuItemId} className="hover:bg-gray-50/30">
                      <td className="px-6 py-4 font-semibold text-gray-900">{item.itemNameSnapshot}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">{item._sum?.quantity ?? 0}</td>
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

  // Handle bookings
  if (reportKey === "bookings") {
    const total = data.total ?? 0;
    const completed = data.completed ?? 0;
    const cancelled = data.cancelled ?? 0;

    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Bookings</span>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{total}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Completed</span>
            <p className="mt-2 text-2xl font-extrabold text-emerald-600">{completed}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cancelled</span>
            <p className="mt-2 text-2xl font-extrabold text-rose-500">{cancelled}</p>
          </div>
        </div>

        {/* Source mix */}
        {data.bySource && data.bySource.length > 0 && (
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Booking Sources</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {data.bySource.map((item: any) => (
                <div key={item.source} className="rounded-xl border border-gray-100 p-4 text-center">
                  <p className="text-xs uppercase tracking-wide text-gray-400">{item.source}</p>
                  <p className="mt-2 text-xl font-bold text-gray-800">{item._count?.id ?? 0}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Handle customers
  if (reportKey === "customers") {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">New Customers</span>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{data.newCustomers ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Returning Customers</span>
            <p className="mt-2 text-2xl font-extrabold text-emerald-600">{data.returningCustomers ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Avg LTV Spending</span>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">
              {formatCurrency(Number(data.averageCustomerSpending ?? 0))}
            </p>
          </div>
        </div>

        {/* Top Spending Customers */}
        {data.topCustomers && data.topCustomers.length > 0 && (
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Top Customers (LTV)</h3>
            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Phone Number</th>
                    <th className="px-6 py-4 text-right">Visits</th>
                    <th className="px-6 py-4 text-right">Total Spending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {data.topCustomers.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50/30">
                      <td className="px-6 py-4 font-semibold text-gray-900">{c.fullName}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{c.phoneNumber}</td>
                      <td className="px-6 py-4 text-right font-medium">{c.visitCount}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">
                        {formatCurrency(Number(c.totalSpending))}
                      </td>
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

  // Handle generic array/fallback views (Menu categories, Table utilization, Room utilization)
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <EmptyState title="No report data" description="No aggregated records found for this period." />;
    }
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-4">Category / Item</th>
              <th className="px-6 py-4 text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {data.map((item: any, idx: number) => (
              <tr key={idx} className="hover:bg-gray-50/30">
                <td className="px-6 py-4 font-semibold text-gray-900">
                  {item.label ?? item.name ?? item.status ?? item.roomType ?? `Item ${idx + 1}`}
                </td>
                <td className="px-6 py-4 text-right font-bold text-gray-900">
                  {String(item.value).match(/^\d+(\.\d+)?$/) && Number(item.value) > 99
                    ? formatCurrency(Number(item.value))
                    : item.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Object fallback
  const entries = Object.entries(data).filter(
    ([, val]) => typeof val !== "object" || val === null,
  );
  if (entries.length === 0) {
    return <EmptyState title="No report data" description="No analytical fields are configured." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {entries.map(([key, val]) => (
        <div key={key} className="rounded-xl border border-gray-100 bg-gray-50/30 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {key.replace(/([A-Z])/g, " $1").replace(/^[a-z]/, (c) => c.toUpperCase())}
          </p>
          <p className="mt-2 text-xl font-bold text-gray-800">
            {typeof val === "number" || (typeof val === "string" && val.match(/^\d+(\.\d+)?$/))
              ? formatCurrency(Number(val))
              : String(val)}
          </p>
        </div>
      ))}
    </div>
  );
}
