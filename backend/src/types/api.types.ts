export type ApiErrorBody = {
  code?: string;
  details?: unknown;
};

export type ApiResponseBody<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  meta?: unknown;
  error?: ApiErrorBody;
};
