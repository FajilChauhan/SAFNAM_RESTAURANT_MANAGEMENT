import { BaseController } from "../../lib/BaseController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { parseApiQuery } from "../../utils/queryParser.js";
import { uuidSchema } from "../../utils/validator.js";
import { tableService } from "./table.service.js";
import { createTableSchema, updateTableSchema } from "./validators/table.validator.js";

class TableController extends BaseController {
  create = asyncHandler(async (req, res) => {
    const dto = createTableSchema.parse(req.body);
    const table = await tableService.create(dto);

    this.created(res, "Table created successfully", { table });
  });

  list = asyncHandler(async (req, res) => {
    const options = parseApiQuery(req.query, ["floorId", "status", "shape"]);
    const result = await tableService.list(options);

    this.ok(res, "Tables fetched successfully", { tables: result.data }, result.meta);
  });

  update = asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    const dto = updateTableSchema.parse(req.body);
    const table = await tableService.update(id, dto);

    this.ok(res, "Table updated successfully", { table });
  });

  delete = asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    await tableService.delete(id);

    this.ok(res, "Table deleted successfully");
  });
}

export const tableController = new TableController();
