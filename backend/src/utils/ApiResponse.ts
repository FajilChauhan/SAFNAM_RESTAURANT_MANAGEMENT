// Standardizes successful API responses across the backend.
import type { ApiResponseBody } from "../types/api.types.js";

export class ApiResponse<T = unknown> {
  private constructor(
    public readonly success: true,
    public readonly message: string,
    public readonly data?: T,
    public readonly meta?: unknown,
  ) {}

  static success<T = unknown>(message: string, data?: T, meta?: unknown): ApiResponseBody<T> {
    return new ApiResponse<T>(true, message, data, meta);
  }

  static paginated<T>(message: string, data: T, meta: unknown): ApiResponseBody<T> {
    return new ApiResponse<T>(true, message, data, meta);
  }
}
