import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { orderController } from "./order.controller.js";

export const orderRouter = Router();

orderRouter.use(authenticate);

orderRouter.get(
  "/cart/:bookingId",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.CUSTOMER),
  orderController.getActiveCart,
);
orderRouter.post(
  "/cart/items",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.CUSTOMER),
  orderController.addItem,
);
orderRouter.patch(
  "/cart/items/:cartItemId/quantity",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.CUSTOMER),
  orderController.updateQuantity,
);
orderRouter.patch(
  "/cart/items/:cartItemId/notes",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.CUSTOMER),
  orderController.updateNotes,
);
orderRouter.delete(
  "/cart/items/:cartItemId",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.CUSTOMER),
  orderController.removeItem,
);
orderRouter.delete(
  "/cart/:bookingId",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.CUSTOMER),
  orderController.clearCart,
);

orderRouter.post(
  "/confirm",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.CUSTOMER),
  orderController.confirmOrder,
);
orderRouter.get("/", authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION), orderController.listOrders);
orderRouter.get(
  "/kitchen-queue",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.KITCHEN),
  orderController.kitchenQueue,
);
orderRouter.get(
  "/:orderId",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.KITCHEN),
  orderController.getOrderDetails,
);
orderRouter.patch(
  "/:orderId/status",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.KITCHEN),
  orderController.updateOrderStatus,
);
