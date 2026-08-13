import { UserRole } from "@prisma/client";
import { prisma } from "../../../database/prisma.js";
import { ROLE_PERMISSION_MAP, type OperationPermission } from "../constants/operationPermissions.js";

export class PermissionService {
  async permissionsForRole(role: UserRole): Promise<OperationPermission[]> {
    const configured = await prisma.rolePermission.findMany({
      where: { role },
      select: { permission: true, enabled: true },
    });

    if (!configured.length) {
      return ROLE_PERMISSION_MAP[role] ?? [];
    }

    return configured
      .filter((item) => item.enabled)
      .map((item) => item.permission)
      .filter((permission): permission is OperationPermission => this.isKnownPermission(permission));
  }

  async setRolePermissions(role: UserRole, permissions: OperationPermission[], updatedBy?: string) {
    const known = new Set(Object.values(ROLE_PERMISSION_MAP).flat());
    const desired = new Set(permissions.filter((permission) => known.has(permission)));

    await prisma.$transaction(
      [...known].map((permission) =>
        prisma.rolePermission.upsert({
          where: { role_permission: { role, permission } },
          create: { role, permission, enabled: desired.has(permission), updatedBy },
          update: { enabled: desired.has(permission), updatedBy },
        }),
      ),
    );

    return this.permissionsForRole(role);
  }

  private isKnownPermission(permission: string): permission is OperationPermission {
    return Object.values(ROLE_PERMISSION_MAP).flat().includes(permission as OperationPermission);
  }
}

export const permissionService = new PermissionService();
