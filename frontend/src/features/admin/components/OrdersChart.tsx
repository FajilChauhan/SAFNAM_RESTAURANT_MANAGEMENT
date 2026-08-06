import { Card, EmptyState } from "@/components/ui";

type OrdersBreakdown = { label: string; value: number; className: string };

export function OrdersChart({ items }: { items?: OrdersBreakdown[] }) {
  return (
    <Card>
      <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Orders Status</h3>
      {!items?.length ? (
        <EmptyState title="No order data" description="No order breakdown available for this period." />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>{item.label}</span>
                <span>{item.value}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <div className={`h-2 rounded-full ${item.className}`} style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

