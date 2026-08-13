import { UserRole } from "@prisma/client";
import { Router } from "express";
import { imageUploadConfig, uploadService } from "../../services/upload/upload.service.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { adminController } from "./admin.controller.js";

export const adminRouter = Router();

adminRouter.use(authenticate, authorize(UserRole.ADMIN));
const offerImageUpload = uploadService.createSingleUpload(imageUploadConfig("offers"));

adminRouter.get("/employees", adminController.listEmployees);
adminRouter.post("/employees", adminController.createEmployee);
adminRouter.patch("/employees/:id", adminController.updateEmployee);
adminRouter.patch("/employees/:id/status", adminController.updateEmployeeStatus);
adminRouter.delete("/employees/:id", adminController.deleteEmployee);

adminRouter.get("/customers", adminController.listCustomers);
adminRouter.get("/customers/stats", adminController.customerStats);
adminRouter.get("/customers/:id", adminController.getCustomer);
adminRouter.patch("/customers/:id/status", adminController.updateCustomerStatus);

adminRouter.get("/offers", adminController.listOffers);
adminRouter.post("/offers", offerImageUpload, adminController.createOffer);
adminRouter.patch("/offers/:id", offerImageUpload, adminController.updateOffer);
adminRouter.delete("/offers/:id", adminController.deleteOffer);

adminRouter.get("/roles", adminController.roles);
adminRouter.get("/permissions", adminController.permissions);
adminRouter.patch("/permissions/roles", adminController.updateRolePermissions);
adminRouter.get("/audit-logs", adminController.auditLogs);
adminRouter.get("/health", adminController.health);
