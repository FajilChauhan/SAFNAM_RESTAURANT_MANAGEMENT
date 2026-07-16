// Converts thrown errors into one consistent API error response.
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        details: error.flatten().fieldErrors,
      },
    });
    return;
  }

  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error";

  if (statusCode >= 500) {
    logger.error(message, error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: error instanceof ApiError ? error.code : ERROR_CODES.INTERNAL_ERROR,
      details: error instanceof ApiError ? error.details : undefined,
    },
  });
};
