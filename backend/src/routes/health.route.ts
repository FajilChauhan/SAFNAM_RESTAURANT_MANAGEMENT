// Provides a minimal operational endpoint for uptime checks.
import { Router } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.status(200).json(ApiResponse.success("Server is running"));
});
