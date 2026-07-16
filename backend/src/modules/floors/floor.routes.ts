import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { floorController } from "./floor.controller.js";

export const floorRouter = Router();

floorRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER));
floorRouter.post("/", floorController.create);
floorRouter.get("/", floorController.list);
floorRouter.patch("/:id", floorController.update);
floorRouter.delete("/:id", floorController.delete);
