import { Router } from "express";
import {
  changePassword,
  getCurrentUser,
  login,
  logoutAllDevices,
  logoutCurrentDevice,
  refreshAccessToken,
  register,
} from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";
import { loginRateLimiter } from "./auth.rateLimit.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", loginRateLimiter, login);
authRouter.post("/refresh-token", refreshAccessToken);
authRouter.post("/logout", logoutCurrentDevice);
authRouter.post("/logout-all", authenticate, logoutAllDevices);
authRouter.patch("/change-password", authenticate, changePassword);
authRouter.get("/me", authenticate, getCurrentUser);
