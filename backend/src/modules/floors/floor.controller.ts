import { BaseController } from "../../lib/BaseController.js";
import { parseApiQuery } from "../../utils/queryParser.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uuidSchema } from "../../utils/validator.js";
import { floorService } from "./floor.service.js";
import { createFloorSchema, updateFloorSchema } from "./validators/floor.validator.js";

class FloorController extends BaseController {
  create = asyncHandler(async (req, res) => {
    const dto = createFloorSchema.parse(req.body);
    const floor = await floorService.create(dto);

    this.created(res, "Floor created successfully", { floor });
  });

  list = asyncHandler(async (req, res) => {
    const options = parseApiQuery(req.query, ["restaurantId", "status"]);
    const result = await floorService.list(options);

    this.ok(res, "Floors fetched successfully", { floors: result.data }, result.meta);
  });

  update = asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    const dto = updateFloorSchema.parse(req.body);
    const floor = await floorService.update(id, dto);

    this.ok(res, "Floor updated successfully", { floor });
  });

  delete = asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    await floorService.delete(id);

    this.ok(res, "Floor deleted successfully");
  });
}

export const floorController = new FloorController();
