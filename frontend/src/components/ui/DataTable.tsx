import type { ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  loading,
  empty,
}: {
  columns: Array<{ header: string; cell: (row: T) => ReactNode }>;
  data: T[];
  loading?: boolean;
  empty?: ReactNode;
}) {
  if (loading) {
    return <div className="grid gap-2">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>;
  }

  if (data.length === 0) {
    return <>{empty ?? <EmptyState title="No data" description="Nothing to show yet." />}</>;
  }

  return (
    <table className="w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <thead className="bg-slate-50 dark:bg-slate-900">
        <tr>{columns.map((column) => <th key={column.header} className="px-4 py-3 text-left text-sm font-medium">{column.header}</th>)}</tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={row.id ?? index} className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900">
            {columns.map((column) => (
              <td key={column.header} className="px-4 py-3 text-sm">
                {column.cell(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
