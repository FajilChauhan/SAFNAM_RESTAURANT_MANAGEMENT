import { UserRole } from "@prisma/client";
import { Router } from "express";
import { imageUploadConfig, uploadService } from "../../services/upload/upload.service.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { requireOperationPermission } from "../operations/middlewares/operationPermission.middleware.js";
import { OPERATION_PERMISSIONS } from "../operations/constants/operationPermissions.js";
import { adminController } from "./admin.controller.js";

export const adminRouter = Router();

// Staff roles reach the operation-level permission checks below.
// Individual endpoints are protected dynamically by requireOperationPermission.
adminRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION));
const offerImageUpload = uploadService.createSingleUpload(imageUploadConfig("offers"));

// Employees
adminRouter.get("/employees", requireOperationPermission(OPERATION_PERMISSIONS.EMPLOYEES_VIEW), adminController.listEmployees);
adminRouter.post("/employees", requireOperationPermission(OPERATION_PERMISSIONS.EMPLOYEES_CREATE), adminController.createEmployee);
adminRouter.patch("/employees/:id", requireOperationPermission(OPERATION_PERMISSIONS.EMPLOYEES_UPDATE), adminController.updateEmployee);
adminRouter.patch("/employees/:id/status", requireOperationPermission(OPERATION_PERMISSIONS.EMPLOYEES_UPDATE), adminController.updateEmployeeStatus);
adminRouter.delete("/employees/:id", requireOperationPermission(OPERATION_PERMISSIONS.EMPLOYEES_DELETE), adminController.deleteEmployee);

// Customers
adminRouter.get("/customers", requireOperationPermission(OPERATION_PERMISSIONS.CUSTOMERS_VIEW), adminController.listCustomers);
adminRouter.get("/customers/stats", requireOperationPermission(OPERATION_PERMISSIONS.CUSTOMERS_VIEW), adminController.customerStats);
adminRouter.get("/customers/:id", requireOperationPermission(OPERATION_PERMISSIONS.CUSTOMERS_VIEW), adminController.getCustomer);
adminRouter.patch("/customers/:id/status", requireOperationPermission(OPERATION_PERMISSIONS.EMPLOYEES_UPDATE), adminController.updateCustomerStatus);

// Offers
adminRouter.get("/offers", requireOperationPermission(OPERATION_PERMISSIONS.OFFERS_VIEW), adminController.listOffers);
adminRouter.post("/offers", requireOperationPermission(OPERATION_PERMISSIONS.OFFERS_CREATE), offerImageUpload, adminController.createOffer);
adminRouter.patch("/offers/:id", requireOperationPermission(OPERATION_PERMISSIONS.OFFERS_UPDATE), offerImageUpload, adminController.updateOffer);
adminRouter.delete("/offers/:id", requireOperationPermission(OPERATION_PERMISSIONS.OFFERS_DELETE), adminController.deleteOffer);

// Access Controls
adminRouter.get("/roles", requireOperationPermission(OPERATION_PERMISSIONS.ROLES_VIEW), adminController.roles);
adminRouter.get("/permissions", requireOperationPermission(OPERATION_PERMISSIONS.ROLES_VIEW), adminController.permissions);
adminRouter.patch("/permissions/roles", requireOperationPermission(OPERATION_PERMISSIONS.PERMISSIONS_MANAGE), adminController.updateRolePermissions);

// Logs & Audits
adminRouter.get("/audit-logs", requireOperationPermission(OPERATION_PERMISSIONS.AUDIT_LOGS_VIEW), adminController.auditLogs);
adminRouter.get("/health", adminController.health);
