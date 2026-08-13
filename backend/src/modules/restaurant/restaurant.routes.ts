import { UserRole } from "@prisma/client";
import { Router } from "express";
import { imageUploadConfig, uploadService } from "../../services/upload/upload.service.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { restaurantController } from "./restaurant.controller.js";

export const restaurantRouter = Router();

restaurantRouter.get("/", restaurantController.publicInfo);

restaurantRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER));
const restaurantLogoUpload = uploadService.createSingleUpload(imageUploadConfig("restaurant", "logo"));

restaurantRouter.patch("/", restaurantLogoUpload, restaurantController.update);
