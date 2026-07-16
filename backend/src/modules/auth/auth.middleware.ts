import type { RequestHandler } from "express";
import type { UserRole } from "@prisma/client";
import { UserStatus } from "@prisma/client";
import { ApiError } from "../../utils/ApiError.js";
import { verifyJwt } from "../../utils/jwt.js";
import { AuthRepository } from "./auth.repository.js";

const authRepository = new AuthRepository();

const getBearerToken = (authorization?: string) => {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length);
};

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const token = getBearerToken(req.header("authorization"));

    if (!token) {
      throw new ApiError(401, "Access token is missing");
    }

    const payload = verifyJwt(token, "access");

    if (payload.type !== "access") {
      throw new ApiError(401, "Invalid access token");
    }

    const user = await authRepository.findUserById(payload.sub);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new ApiError(401, "Authenticated user was not found");
    }

    req.user = {
      id: user.id,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
    };

    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, "Invalid access token"));
  }
};

export const authorize =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, "You are not allowed to access this resource"));
      return;
    }

    next();
  };
