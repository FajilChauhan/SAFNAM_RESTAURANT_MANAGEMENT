// Provides one logging interface so the implementation can be upgraded later.
export const logger = {
  info: (message: string, meta?: unknown) => {
    console.info(message, meta ?? "");
  },
  warn: (message: string, meta?: unknown) => {
    console.warn(message, meta ?? "");
  },
  error: (message: string, meta?: unknown) => {
    console.error(message, meta ?? "");
  },
};
