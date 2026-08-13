import { UserRole } from "@prisma/client";
import { Router } from "express";
import { imageUploadConfig, uploadService } from "../../services/upload/upload.service.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { roomController } from "./room.controller.js";

export const roomRouter = Router();

roomRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER));
const roomImageUpload = uploadService.createSingleUpload(imageUploadConfig("gallery"));

roomRouter.post("/", roomImageUpload, roomController.create);
roomRouter.get("/", roomController.list);
roomRouter.patch("/:id", roomImageUpload, roomController.update);
roomRouter.delete("/:id", roomController.delete);
