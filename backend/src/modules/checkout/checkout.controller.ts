// Checkout controller parses HTTP input and delegates checkout decisions to the service layer.
import { BaseController } from "../../lib/BaseController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uuidSchema } from "../../utils/validator.js";
import { checkoutService } from "./checkout.service.js";
import { checkoutBookingSchema, checkoutHistoryQuerySchema } from "./validators/checkout.validator.js";

class CheckoutController extends BaseController {
  checkout = asyncHandler(async (req, res) => {
    const checkout = await checkoutService.checkout(checkoutBookingSchema.parse(req.body), req.user!);
    this.created(res, "Booking checked out successfully", { checkout, summary: checkoutService.toSummary(checkout) });
  });

  details = asyncHandler(async (req, res) => {
    const checkout = await checkoutService.getDetails(uuidSchema.parse(req.params.bookingId));
    this.ok(res, "Checkout details fetched successfully", { checkout });
  });

  history = asyncHandler(async (req, res) => {
    const checkouts = await checkoutService.history(checkoutHistoryQuerySchema.parse(req.query));
    this.ok(res, "Checkout history fetched successfully", { checkouts });
  });
}

export const checkoutController = new CheckoutController();
