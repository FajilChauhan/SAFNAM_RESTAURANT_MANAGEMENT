import { BaseController } from "../../lib/BaseController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { dashboardService } from "./dashboard.service.js";
import { dashboardQuerySchema } from "./dashboard.validator.js";

class DashboardController extends BaseController {
  customer = asyncHandler(async (req, res) => {
    const query = dashboardQuerySchema.parse(req.query);
    const dashboard = await dashboardService.customer(req.user!.id, query);

    this.ok(res, "Customer dashboard fetched successfully", { dashboard });
  });

  reception = asyncHandler(async (req, res) => {
    const query = dashboardQuerySchema.parse(req.query);
    const dashboard = await dashboardService.reception(query);

    this.ok(res, "Reception dashboard fetched successfully", { dashboard });
  });

  kitchen = asyncHandler(async (req, res) => {
    const query = dashboardQuerySchema.parse(req.query);
    const dashboard = await dashboardService.kitchen(query);

    this.ok(res, "Kitchen dashboard fetched successfully", { dashboard });
  });

  manager = asyncHandler(async (req, res) => {
    const query = dashboardQuerySchema.parse(req.query);
    const dashboard = await dashboardService.manager(query);

    this.ok(res, "Manager dashboard fetched successfully", { dashboard });
  });

  admin = asyncHandler(async (req, res) => {
    const query = dashboardQuerySchema.parse(req.query);
    const dashboard = await dashboardService.admin(query);

    this.ok(res, "Admin dashboard fetched successfully", { dashboard });
  });
}

export const dashboardController = new DashboardController();
