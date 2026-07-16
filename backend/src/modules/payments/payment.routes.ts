import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { paymentController } from "./payment.controller.js";

export const paymentRouter = Router();

paymentRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION));

paymentRouter.post("/", paymentController.create);
paymentRouter.get("/:paymentId", paymentController.get);
paymentRouter.get("/invoice/:invoiceId/history", paymentController.history);
paymentRouter.get("/invoice/:invoiceId/summary", paymentController.summary);
paymentRouter.post("/:paymentId/refund", paymentController.refund);
