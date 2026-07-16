import { BaseController } from "../../lib/BaseController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uuidSchema } from "../../utils/validator.js";
import { kitchenService } from "./kitchen.service.js";
import { updateKitchenPrioritySchema } from "./validators/kitchen.validator.js";

class KitchenController extends BaseController {
  queue = asyncHandler(async (_req, res) => {
    const queue = await kitchenService.getQueue();
    this.ok(res, "Kitchen queue fetched successfully", { queue });
  });

  summary = asyncHandler(async (_req, res) => {
    const summary = await kitchenService.getSummary();
    this.ok(res, "Kitchen dashboard summary fetched successfully", { summary });
  });

  updatePriority = asyncHandler(async (req, res) => {
    const item = await kitchenService.updatePriority(
      uuidSchema.parse(req.params.orderId),
      updateKitchenPrioritySchema.parse(req.body),
      req.user!,
    );
    this.ok(res, "Kitchen priority updated successfully", { item });
  });

  accept = asyncHandler(async (req, res) => {
    const item = await kitchenService.acceptOrder(uuidSchema.parse(req.params.orderId), req.user!);
    this.ok(res, "Kitchen order accepted successfully", { item });
  });

  reject = asyncHandler(async (req, res) => {
    const item = await kitchenService.rejectOrder(uuidSchema.parse(req.params.orderId), req.user!);
    this.ok(res, "Kitchen order rejected successfully", { item });
  });

  startPreparing = asyncHandler(async (req, res) => {
    const item = await kitchenService.startPreparing(uuidSchema.parse(req.params.orderId), req.user!);
    this.ok(res, "Kitchen order moved to preparing", { item });
  });

  ready = asyncHandler(async (req, res) => {
    const item = await kitchenService.markReady(uuidSchema.parse(req.params.orderId), req.user!);
    this.ok(res, "Kitchen order marked ready", { item });
  });

  served = asyncHandler(async (req, res) => {
    const item = await kitchenService.markServed(uuidSchema.parse(req.params.orderId), req.user!);
    this.ok(res, "Kitchen order marked served", { item });
  });
}

export const kitchenController = new KitchenController();
