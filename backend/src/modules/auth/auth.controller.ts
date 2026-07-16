import type { Request, Response } from "express";
import { env } from "../../config/env.config.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authService } from "./auth.service.js";
import { changePasswordSchema, loginSchema, registerSchema } from "./validators/auth.validator.js";
import type { RequestMetadata } from "./types/auth.types.js";

const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const getRequestMetadata = (req: Request): RequestMetadata => ({
  deviceName: req.header("x-device-name") ?? undefined,
  ipAddress: req.ip,
  userAgent: req.header("user-agent") ?? undefined,
});

const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
};

const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
  });
};

export const register = asyncHandler(async (req, res) => {
  const dto = registerSchema.parse(req.body);
  const user = await authService.register(dto);

  res.status(201).json(ApiResponse.success("Customer registered successfully", { user }));
});

export const login = asyncHandler(async (req, res) => {
  const dto = loginSchema.parse(req.body);
  const result = await authService.login(dto, getRequestMetadata(req));

  setRefreshTokenCookie(res, result.refreshToken);

  res.json(
    ApiResponse.success("Logged in successfully", {
      accessToken: result.accessToken,
      user: result.user,
    }),
  );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME] as string | undefined;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is missing");
  }

  const tokens = await authService.refreshAccessToken(refreshToken, getRequestMetadata(req));

  setRefreshTokenCookie(res, tokens.refreshToken);

  res.json(
    ApiResponse.success("Access token refreshed successfully", {
      accessToken: tokens.accessToken,
    }),
  );
});

export const logoutCurrentDevice = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME] as string | undefined;

  if (refreshToken) {
    await authService.logoutCurrentDevice(refreshToken);
  }

  clearRefreshTokenCookie(res);

  res.json(ApiResponse.success("Logged out from current device successfully"));
});

export const logoutAllDevices = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  await authService.logoutAllDevices(req.user.id);
  clearRefreshTokenCookie(res);

  res.json(ApiResponse.success("Logged out from all devices successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const dto = changePasswordSchema.parse(req.body);
  await authService.changePassword(req.user.id, dto);
  clearRefreshTokenCookie(res);

  res.json(ApiResponse.success("Password changed successfully. Please login again"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const user = await authService.getCurrentUser(req.user.id);

  res.json(ApiResponse.success("Current user fetched successfully", { user }));
});
