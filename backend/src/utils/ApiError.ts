// Represents expected operational errors with HTTP status codes.
import type { ErrorCode } from "../constants/errorCodes.js";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: ErrorCode,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}
