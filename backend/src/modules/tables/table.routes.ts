import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { tableController } from "./table.controller.js";

export const tableRouter = Router();

tableRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER));
tableRouter.post("/", tableController.create);
tableRouter.get("/", tableController.list);
tableRouter.patch("/:id", tableController.update);
tableRouter.delete("/:id", tableController.delete);
