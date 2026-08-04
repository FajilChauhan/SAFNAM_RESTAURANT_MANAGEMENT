// Permission middleware adds RBAC checks without hard-coding roles inside controllers.
import type { RequestHandler } from "express";
import { ApiError } from "../../../utils/ApiError.js";
import { ROLE_PERMISSION_MAP, type OperationPermission } from "../constants/operationPermissions.js";

export const requireOperationPermission =
  (...permissions: OperationPermission[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    const grantedPermissions = ROLE_PERMISSION_MAP[req.user.role] ?? [];
    const isAllowed = permissions.every((permission) => grantedPermissions.includes(permission));

    if (!isAllowed) {
      next(new ApiError(403, "You are not allowed to access this operations resource"));
      return;
    }

    next();
  };
