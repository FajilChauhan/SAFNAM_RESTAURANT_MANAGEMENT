import { UserRole } from "@prisma/client";
import { Router } from "express";
import { uploadService } from "../../services/upload/upload.service.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { menuController } from "./menu.controller.js";

export const menuRouter = Router();

menuRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER));

const menuImageUpload = uploadService.createSingleUpload({
  destination: "local",
  fieldName: "image",
  maxFileSizeInBytes: 2 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
});

menuRouter.post("/categories", menuImageUpload, menuController.createCategory);
menuRouter.get("/categories", menuController.listCategories);
menuRouter.patch("/categories/:id", menuImageUpload, menuController.updateCategory);
menuRouter.delete("/categories/:id", menuController.deleteCategory);

menuRouter.post("/items", menuImageUpload, menuController.createItem);
menuRouter.get("/items", menuController.listItems);
menuRouter.patch("/items/:id", menuImageUpload, menuController.updateItem);
menuRouter.delete("/items/:id", menuController.deleteItem);
menuRouter.patch("/items/:id/today-special", menuController.setTodaySpecial);
menuRouter.patch("/items/:id/availability", menuController.setItemAvailability);

menuRouter.post("/variants", menuController.createVariant);
menuRouter.get("/variants", menuController.listVariants);
menuRouter.patch("/variants/:id", menuController.updateVariant);
menuRouter.delete("/variants/:id", menuController.deleteVariant);

menuRouter.post("/addons", menuController.createAddOn);
menuRouter.get("/addons", menuController.listAddOns);
menuRouter.patch("/addons/:id", menuController.updateAddOn);
menuRouter.delete("/addons/:id", menuController.deleteAddOn);

menuRouter.post("/availability", menuController.createAvailability);
menuRouter.get("/items/:menuItemId/availability", menuController.listAvailability);
menuRouter.delete("/availability/:id", menuController.deleteAvailability);
