// BI routes are manager/admin-only because analytics include financial and employee data.
import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { businessIntelligenceController } from "./bi.controller.js";

export const businessIntelligenceRouter = Router();

businessIntelligenceRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER));

businessIntelligenceRouter.get("/dashboard", businessIntelligenceController.dashboard);
businessIntelligenceRouter.get("/revenue", businessIntelligenceController.revenue);
businessIntelligenceRouter.get("/bookings", businessIntelligenceController.bookings);
businessIntelligenceRouter.get("/orders", businessIntelligenceController.orders);
businessIntelligenceRouter.get("/customers", businessIntelligenceController.customers);
businessIntelligenceRouter.get("/tables", businessIntelligenceController.tables);
businessIntelligenceRouter.get("/rooms", businessIntelligenceController.rooms);
businessIntelligenceRouter.get("/employees", businessIntelligenceController.employees);
businessIntelligenceRouter.get("/charts", businessIntelligenceController.charts);
businessIntelligenceRouter.get("/reports/:type", businessIntelligenceController.report);
