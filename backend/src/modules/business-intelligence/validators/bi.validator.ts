// BI validators normalize analytics query params before date-range calculation.
import { z } from "zod";

export const biQuerySchema = z.object({
  period: z.enum(["daily", "weekly", "monthly", "yearly", "custom"]).default("daily"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const reportQuerySchema = biQuerySchema.extend({
  format: z.enum(["json", "csv", "pdf", "excel"]).default("json"),
});
