// Permission middleware adds RBAC checks without hard-coding roles inside controllers.
import type { RequestHandler } from "express";
import { ApiError } from "../../../utils/ApiError.js";
import type { OperationPermission } from "../constants/operationPermissions.js";
import { permissionService } from "../services/permission.service.js";

export const requireOperationPermission =
  (...permissions: OperationPermission[]): RequestHandler =>
  async (req, _res, next) => {
    if (!req.user) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    const grantedPermissions = await permissionService.permissionsForRole(req.user.role);
    const isAllowed = permissions.every((permission) => grantedPermissions.includes(permission));

    if (!isAllowed) {
      next(new ApiError(403, "You are not allowed to access this operations resource"));
      return;
    }

    next();
  };
