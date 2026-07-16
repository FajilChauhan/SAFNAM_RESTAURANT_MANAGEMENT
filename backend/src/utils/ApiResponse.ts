// Standardizes successful API responses across the backend.
export class ApiResponse<T = unknown> {
  private constructor(
    public readonly success: true,
    public readonly message: string,
    public readonly data?: T,
  ) {}

  static success<T = unknown>(message: string, data?: T) {
    return new ApiResponse<T>(true, message, data);
  }
}
