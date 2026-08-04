import { z } from "zod";

export const idSchema = z.string().uuid();
export const phoneSchema = z.string().min(10).max(20);
export const moneySchema = z.coerce.number().nonnegative();
