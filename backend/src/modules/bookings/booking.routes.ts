import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { bookingController } from "./booking.controller.js";

export const bookingRouter = Router();

bookingRouter.use(authenticate);

bookingRouter.get(
  "/available-tables",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.CUSTOMER),
  bookingController.availableTables,
);
bookingRouter.get(
  "/available-rooms",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.CUSTOMER),
  bookingController.availableRooms,
);
bookingRouter.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.CUSTOMER),
  bookingController.create,
);
bookingRouter.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION),
  bookingController.list,
);
bookingRouter.get(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.CUSTOMER),
  bookingController.get,
);
bookingRouter.patch(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION),
  bookingController.update,
);
bookingRouter.patch(
  "/:id/cancel",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.CUSTOMER),
  bookingController.cancel,
);
bookingRouter.patch(
  "/:id/check-in",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION),
  bookingController.checkIn,
);
bookingRouter.patch(
  "/:id/check-out",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION),
  bookingController.checkOut,
);
