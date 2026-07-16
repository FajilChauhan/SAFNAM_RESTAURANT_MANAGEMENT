import { BaseController } from "../../lib/BaseController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uuidSchema } from "../../utils/validator.js";
import { restaurantService } from "./restaurant.service.js";
import { createRestaurantSchema, updateRestaurantSchema } from "./validators/restaurant.validator.js";

class RestaurantController extends BaseController {
  create = asyncHandler(async (req, res) => {
    const dto = createRestaurantSchema.parse(req.body);
    const restaurant = await restaurantService.create(dto);

    this.created(res, "Restaurant created successfully", { restaurant });
  });

  get = asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    const restaurant = await restaurantService.getById(id);

    this.ok(res, "Restaurant fetched successfully", { restaurant });
  });

  update = asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    const dto = updateRestaurantSchema.parse(req.body);
    const restaurant = await restaurantService.update(id, dto);

    this.ok(res, "Restaurant updated successfully", { restaurant });
  });
}

export const restaurantController = new RestaurantController();
