import { z } from "zod";

export const dashboardQuerySchema = z.object({
  listLimit: z.coerce.number().int().min(1).max(50).default(10),
  historyLimit: z.coerce.number().int().min(1).max(100).default(10),
});
