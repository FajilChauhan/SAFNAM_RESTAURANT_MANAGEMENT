import { Router } from "express";
import { imageUploadConfig, uploadService } from "../../services/upload/upload.service.js";
import { authenticate } from "../auth/auth.middleware.js";
import { OPERATION_PERMISSIONS } from "../operations/constants/operationPermissions.js";
import { requireOperationPermission } from "../operations/middlewares/operationPermission.middleware.js";
import { restaurantController } from "./restaurant.controller.js";

export const restaurantRouter = Router();

restaurantRouter.get("/", restaurantController.publicInfo);

const restaurantLogoUpload = uploadService.createSingleUpload(imageUploadConfig("restaurant", "logo"));

restaurantRouter.patch(
  "/",
  authenticate,
  requireOperationPermission(OPERATION_PERMISSIONS.SETTINGS_UPDATE),
  restaurantLogoUpload,
  restaurantController.update,
);
