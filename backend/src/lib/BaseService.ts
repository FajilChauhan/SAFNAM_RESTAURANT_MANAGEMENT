import { ERROR_CODES } from "../constants/errorCodes.js";
import { ApiError } from "../utils/ApiError.js";

export abstract class BaseService {
  protected ensureExists<T>(value: T | null | undefined, message: string): T {
    if (value === null || value === undefined) {
      throw new ApiError(404, message, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return value;
  }

  protected ensure(condition: boolean, message: string, statusCode = 400): void {
    if (!condition) {
      throw new ApiError(statusCode, message);
    }
  }
}
