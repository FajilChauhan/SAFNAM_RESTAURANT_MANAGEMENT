import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { floorController } from "./floor.controller.js";
import { imageUploadConfig, uploadService } from "../../services/upload/upload.service.js";

const floorImageUpload = uploadService.createSingleUpload(imageUploadConfig("floors"));

export const floorRouter = Router();

floorRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER));
floorRouter.post("/", floorImageUpload, floorController.create);
floorRouter.get("/", floorController.list);
floorRouter.patch("/:id", floorImageUpload, floorController.update);
floorRouter.delete("/:id", floorController.delete);
