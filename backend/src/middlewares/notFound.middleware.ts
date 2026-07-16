// Handles unknown routes after all real routes have had a chance to match.
import type { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};
