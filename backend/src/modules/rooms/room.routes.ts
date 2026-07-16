import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { roomController } from "./room.controller.js";

export const roomRouter = Router();

roomRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER));
roomRouter.post("/", roomController.create);
roomRouter.get("/", roomController.list);
roomRouter.patch("/:id", roomController.update);
roomRouter.delete("/:id", roomController.delete);
