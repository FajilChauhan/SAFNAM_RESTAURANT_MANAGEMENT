// BI types keep chart/report payloads predictable for dashboards and exporters.
export type AnalyticsRange = {
  start: Date;
  end: Date;
};

export type ChartPoint = {
  label: string;
  value: string | number;
};

export type ReportPayload<TData> = {
  format: "json" | "csv" | "pdf" | "excel";
  generatedAt: Date;
  range: AnalyticsRange;
  data: TData;
};
