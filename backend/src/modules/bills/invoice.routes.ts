import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { invoiceController } from "./invoice.controller.js";

export const invoiceRouter = Router();

invoiceRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION));

invoiceRouter.post("/generate", invoiceController.generate);
invoiceRouter.get("/booking/:bookingId", invoiceController.get);
invoiceRouter.patch("/:invoiceId/discount", invoiceController.updateDiscount);
invoiceRouter.post("/:invoiceId/charges", invoiceController.addCharge);
invoiceRouter.delete("/charges/:invoiceItemId", invoiceController.removeCharge);
invoiceRouter.patch("/:invoiceId/cancel", invoiceController.cancel);
invoiceRouter.get("/:invoiceId/summary", invoiceController.summary);
