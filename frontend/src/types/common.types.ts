export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export type UserRole = "CUSTOMER" | "RECEPTION" | "KITCHEN" | "MANAGER" | "ADMIN";
