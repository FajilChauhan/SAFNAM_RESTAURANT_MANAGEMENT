// Central permission names keep role access explicit and ready for database-backed permissions later.
import { UserRole } from "@prisma/client";

export const OPERATION_PERMISSIONS = {
  DASHBOARD_VIEW: "operations.dashboard.view",
  RECEPTION_VIEW: "operations.reception.view",
  KITCHEN_VIEW: "operations.kitchen.view",
  MANAGER_VIEW: "operations.manager.view",
  ADMIN_VIEW: "operations.admin.view",
  PAYMENTS_VIEW: "operations.payments.view",
  SETTINGS_VIEW: "operations.settings.view",
  ROLES_VIEW: "operations.roles.view",
} as const;

export type OperationPermission = (typeof OPERATION_PERMISSIONS)[keyof typeof OPERATION_PERMISSIONS];

export const ROLE_PERMISSION_MAP: Record<UserRole, OperationPermission[]> = {
  CUSTOMER: [],
  RECEPTION: [
    OPERATION_PERMISSIONS.DASHBOARD_VIEW,
    OPERATION_PERMISSIONS.RECEPTION_VIEW,
    OPERATION_PERMISSIONS.PAYMENTS_VIEW,
  ],
  KITCHEN: [OPERATION_PERMISSIONS.KITCHEN_VIEW],
  MANAGER: [
    OPERATION_PERMISSIONS.DASHBOARD_VIEW,
    OPERATION_PERMISSIONS.RECEPTION_VIEW,
    OPERATION_PERMISSIONS.KITCHEN_VIEW,
    OPERATION_PERMISSIONS.MANAGER_VIEW,
    OPERATION_PERMISSIONS.PAYMENTS_VIEW,
  ],
  ADMIN: Object.values(OPERATION_PERMISSIONS),
};
