import { BaseController } from "../../lib/BaseController.js";
import { getUploadedFileUrl } from "../../services/upload/upload.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { restaurantService } from "./restaurant.service.js";
import { updateRestaurantSchema } from "./validators/restaurant.validator.js";

class RestaurantController extends BaseController {
  publicInfo = asyncHandler(async (_req, res) => {
    const restaurant = await restaurantService.getPublicInfo();
    this.ok(res, "Restaurant fetched successfully", { restaurant });
  });

  update = asyncHandler(async (req, res) => {
    const dto = updateRestaurantSchema.parse({
      ...req.body,
      logoUrl: getUploadedFileUrl(req.file) ?? req.body.logoUrl,
    });
    const restaurant = await restaurantService.updateSingle(dto);

    this.ok(res, "Restaurant updated successfully", { restaurant });
  });
}

export const restaurantController = new RestaurantController();
