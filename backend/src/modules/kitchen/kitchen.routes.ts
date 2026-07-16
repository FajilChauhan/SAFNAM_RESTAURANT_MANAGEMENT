import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { kitchenController } from "./kitchen.controller.js";

export const kitchenRouter = Router();

kitchenRouter.use(authenticate);

kitchenRouter.get(
  "/queue",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.KITCHEN),
  kitchenController.queue,
);
kitchenRouter.get(
  "/summary",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.KITCHEN),
  kitchenController.summary,
);
kitchenRouter.patch(
  "/orders/:orderId/priority",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN),
  kitchenController.updatePriority,
);
kitchenRouter.patch("/orders/:orderId/accept", authorize(UserRole.KITCHEN), kitchenController.accept);
kitchenRouter.patch("/orders/:orderId/reject", authorize(UserRole.KITCHEN), kitchenController.reject);
kitchenRouter.patch("/orders/:orderId/preparing", authorize(UserRole.KITCHEN), kitchenController.startPreparing);
kitchenRouter.patch("/orders/:orderId/ready", authorize(UserRole.KITCHEN), kitchenController.ready);
kitchenRouter.patch("/orders/:orderId/served", authorize(UserRole.KITCHEN), kitchenController.served);
