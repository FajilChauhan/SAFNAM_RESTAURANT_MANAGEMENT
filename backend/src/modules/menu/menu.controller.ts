import { BaseController } from "../../lib/BaseController.js";
import { getUploadedFileUrl } from "../../services/upload/upload.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { parseApiQuery } from "../../utils/queryParser.js";
import { uuidSchema } from "../../utils/validator.js";
import { menuService } from "./menu.service.js";
import {
  availabilitySchema,
  createAddOnSchema,
  createCategorySchema,
  createMenuItemSchema,
  createVariantSchema,
  updateAddOnSchema,
  updateCategorySchema,
  updateMenuItemSchema,
  updateVariantSchema,
} from "./validators/menu.validator.js";

class MenuController extends BaseController {
  createCategory = asyncHandler(async (req, res) => {
    const category = await menuService.createCategory(
      createCategorySchema.parse({
        ...req.body,
        imageUrl: getUploadedFileUrl(req.file) ?? req.body.imageUrl,
      }),
    );
    this.created(res, "Category created successfully", { category });
  });

  listCategories = asyncHandler(async (req, res) => {
    const result = await menuService.listCategories(parseApiQuery(req.query, ["restaurantId", "status"]));
    this.ok(res, "Categories fetched successfully", { categories: result.data }, result.meta);
  });

  updateCategory = asyncHandler(async (req, res) => {
    const category = await menuService.updateCategory(
      uuidSchema.parse(req.params.id),
      updateCategorySchema.parse({
        ...req.body,
        imageUrl: getUploadedFileUrl(req.file) ?? req.body.imageUrl,
      }),
    );
    this.ok(res, "Category updated successfully", { category });
  });

  deleteCategory = asyncHandler(async (req, res) => {
    await menuService.deleteCategory(uuidSchema.parse(req.params.id));
    this.ok(res, "Category deleted successfully");
  });

  createItem = asyncHandler(async (req, res) => {
    const item = await menuService.createItem(
      createMenuItemSchema.parse({
        ...req.body,
        imageUrl: getUploadedFileUrl(req.file) ?? req.body.imageUrl,
      }),
    );
    this.created(res, "Menu item created successfully", { item });
  });

  listItems = asyncHandler(async (req, res) => {
    const result = await menuService.listItems(
      parseApiQuery(req.query, ["categoryId", "status", "foodType", "spicyLevel", "isTodaySpecial", "isAvailable"]),
    );
    this.ok(res, "Menu items fetched successfully", { items: result.data }, result.meta);
  });

  updateItem = asyncHandler(async (req, res) => {
    const item = await menuService.updateItem(
      uuidSchema.parse(req.params.id),
      updateMenuItemSchema.parse({
        ...req.body,
        imageUrl: getUploadedFileUrl(req.file) ?? req.body.imageUrl,
      }),
    );
    this.ok(res, "Menu item updated successfully", { item });
  });

  deleteItem = asyncHandler(async (req, res) => {
    await menuService.softDeleteItem(uuidSchema.parse(req.params.id));
    this.ok(res, "Menu item deleted successfully");
  });

  setTodaySpecial = asyncHandler(async (req, res) => {
    const item = await menuService.setTodaySpecial(uuidSchema.parse(req.params.id), Boolean(req.body.isTodaySpecial));
    this.ok(res, "Today's special updated successfully", { item });
  });

  setItemAvailability = asyncHandler(async (req, res) => {
    const item = await menuService.setItemAvailability(uuidSchema.parse(req.params.id), Boolean(req.body.isAvailable));
    this.ok(res, "Menu item availability updated successfully", { item });
  });

  createVariant = asyncHandler(async (req, res) => {
    const variant = await menuService.createVariant(createVariantSchema.parse(req.body));
    this.created(res, "Variant created successfully", { variant });
  });

  listVariants = asyncHandler(async (req, res) => {
    const variants = await menuService.listVariants(parseApiQuery(req.query, ["menuItemId", "status"]));
    this.ok(res, "Variants fetched successfully", { variants });
  });

  updateVariant = asyncHandler(async (req, res) => {
    const variant = await menuService.updateVariant(uuidSchema.parse(req.params.id), updateVariantSchema.parse(req.body));
    this.ok(res, "Variant updated successfully", { variant });
  });

  deleteVariant = asyncHandler(async (req, res) => {
    await menuService.deleteVariant(uuidSchema.parse(req.params.id));
    this.ok(res, "Variant deleted successfully");
  });

  createAddOn = asyncHandler(async (req, res) => {
    const addOn = await menuService.createAddOn(createAddOnSchema.parse(req.body));
    this.created(res, "Add-on created successfully", { addOn });
  });

  listAddOns = asyncHandler(async (req, res) => {
    const addOns = await menuService.listAddOns(parseApiQuery(req.query, ["menuItemId", "status"]));
    this.ok(res, "Add-ons fetched successfully", { addOns });
  });

  updateAddOn = asyncHandler(async (req, res) => {
    const addOn = await menuService.updateAddOn(uuidSchema.parse(req.params.id), updateAddOnSchema.parse(req.body));
    this.ok(res, "Add-on updated successfully", { addOn });
  });

  deleteAddOn = asyncHandler(async (req, res) => {
    await menuService.deleteAddOn(uuidSchema.parse(req.params.id));
    this.ok(res, "Add-on deleted successfully");
  });

  createAvailability = asyncHandler(async (req, res) => {
    const availability = await menuService.createAvailability(availabilitySchema.parse(req.body));
    this.created(res, "Availability created successfully", { availability });
  });

  listAvailability = asyncHandler(async (req, res) => {
    const availability = await menuService.listAvailability(uuidSchema.parse(req.params.menuItemId));
    this.ok(res, "Availability fetched successfully", { availability });
  });

  deleteAvailability = asyncHandler(async (req, res) => {
    await menuService.deleteAvailability(uuidSchema.parse(req.params.id));
    this.ok(res, "Availability deleted successfully");
  });
}

export const menuController = new MenuController();
