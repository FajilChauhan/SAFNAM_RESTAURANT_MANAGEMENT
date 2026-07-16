import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { restaurantController } from "./restaurant.controller.js";

export const restaurantRouter = Router();

restaurantRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER));
restaurantRouter.post("/", restaurantController.create);
restaurantRouter.get("/:id", restaurantController.get);
restaurantRouter.patch("/:id", restaurantController.update);
