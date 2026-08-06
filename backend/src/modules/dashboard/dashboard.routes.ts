import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { dashboardController } from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get("/customer", authorize(UserRole.CUSTOMER), dashboardController.customer);
dashboardRouter.get("/reception", authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION), dashboardController.reception);
dashboardRouter.get("/kitchen", authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN), dashboardController.kitchen);
dashboardRouter.get("/manager", authorize(UserRole.ADMIN, UserRole.MANAGER), dashboardController.manager);
dashboardRouter.get("/admin", authorize(UserRole.ADMIN), dashboardController.admin);
