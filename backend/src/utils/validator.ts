// Shared validation helpers for request parsing and defensive checks.
import { z } from "zod";
import { ApiError } from "./ApiError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

export const uuidSchema = z.string().uuid();
export const nonEmptyStringSchema = z.string().trim().min(1);

export const parseWithSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

export const assertDefined = <T>(value: T | null | undefined, message: string): T => {
  if (value === null || value === undefined) {
    throw new ApiError(404, message, ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  return value;
};
