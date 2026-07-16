import rateLimit from "express-rate-limit";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/ApiError.js";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(new ApiError(429, "Too many login attempts. Please try again later"));
  },
});
