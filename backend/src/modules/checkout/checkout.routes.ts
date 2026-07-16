// Checkout routes expose visit-finalization endpoints without leaking business rules.
import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { checkoutController } from "./checkout.controller.js";

export const checkoutRouter = Router();

checkoutRouter.use(authenticate);

checkoutRouter.post("/", authorize(UserRole.RECEPTION, UserRole.MANAGER), checkoutController.checkout);
checkoutRouter.get("/history", authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION), checkoutController.history);
checkoutRouter.get(
  "/booking/:bookingId",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION),
  checkoutController.details,
);
