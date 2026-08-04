// Operations routes expose one role-based module for staff dashboards and daily workflow panels.
import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { OPERATION_PERMISSIONS } from "./constants/operationPermissions.js";
import { requireOperationPermission } from "./middlewares/operationPermission.middleware.js";
import { operationsController } from "./operations.controller.js";

export const operationsRouter = Router();

operationsRouter.use(authenticate);

operationsRouter.get(
  "/dashboard/summary",
  requireOperationPermission(OPERATION_PERMISSIONS.DASHBOARD_VIEW),
  operationsController.dashboardSummary,
);
operationsRouter.get(
  "/reception/dashboard",
  requireOperationPermission(OPERATION_PERMISSIONS.RECEPTION_VIEW),
  operationsController.receptionDashboard,
);
operationsRouter.get(
  "/kitchen/dashboard",
  requireOperationPermission(OPERATION_PERMISSIONS.KITCHEN_VIEW),
  operationsController.kitchenDashboard,
);
operationsRouter.get(
  "/manager/dashboard",
  requireOperationPermission(OPERATION_PERMISSIONS.MANAGER_VIEW),
  operationsController.managerDashboard,
);
operationsRouter.get(
  "/admin/dashboard",
  requireOperationPermission(OPERATION_PERMISSIONS.ADMIN_VIEW),
  operationsController.adminDashboard,
);
operationsRouter.get(
  "/orders/today",
  requireOperationPermission(OPERATION_PERMISSIONS.MANAGER_VIEW),
  operationsController.todaysOrders,
);
operationsRouter.get(
  "/revenue/today",
  requireOperationPermission(OPERATION_PERMISSIONS.MANAGER_VIEW),
  operationsController.todaysRevenue,
);
operationsRouter.get(
  "/bookings/today",
  requireOperationPermission(OPERATION_PERMISSIONS.RECEPTION_VIEW),
  operationsController.todaysBookings,
);
operationsRouter.get(
  "/occupancy/today",
  requireOperationPermission(OPERATION_PERMISSIONS.RECEPTION_VIEW),
  operationsController.todaysOccupancy,
);
operationsRouter.get(
  "/bills/pending",
  requireOperationPermission(OPERATION_PERMISSIONS.PAYMENTS_VIEW),
  operationsController.pendingBills,
);
operationsRouter.get(
  "/kitchen/queue-count",
  requireOperationPermission(OPERATION_PERMISSIONS.KITCHEN_VIEW),
  operationsController.kitchenQueueCount,
);
operationsRouter.get(
  "/customers/search",
  requireOperationPermission(OPERATION_PERMISSIONS.RECEPTION_VIEW),
  operationsController.customerSearch,
);
