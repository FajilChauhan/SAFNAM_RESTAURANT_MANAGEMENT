// Adds a lightweight request log hook for application-level observability.
import type { RequestHandler } from "express";
import { logger } from "../utils/logger.js";

export const requestLogger: RequestHandler = (req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
};
