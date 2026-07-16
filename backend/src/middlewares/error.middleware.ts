// Converts thrown errors into one consistent API error response.
import type { ErrorRequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error";

  if (statusCode >= 500) {
    logger.error(message, error);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
