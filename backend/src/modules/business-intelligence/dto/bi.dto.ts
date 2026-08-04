// BI DTOs define analytics query shapes without coupling reports to HTTP details.
export type BiPeriod = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export type BiQueryDto = {
  period: BiPeriod;
  startDate?: string;
  endDate?: string;
};

export type ReportFormat = "json" | "csv" | "pdf" | "excel";

export type ReportQueryDto = BiQueryDto & {
  format: ReportFormat;
};
