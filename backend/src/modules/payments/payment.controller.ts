import { BaseController } from "../../lib/BaseController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uuidSchema } from "../../utils/validator.js";
import { paymentService } from "./payment.service.js";
import { createPaymentSchema, refundPaymentSchema } from "./validators/payment.validator.js";

class PaymentController extends BaseController {
  create = asyncHandler(async (req, res) => {
    const payment = await paymentService.create(createPaymentSchema.parse(req.body), req.user!);
    this.created(res, "Payment recorded successfully", { payment });
  });

  get = asyncHandler(async (req, res) => {
    const result = await paymentService.get(uuidSchema.parse(req.params.paymentId));
    this.ok(res, "Payment fetched successfully", result);
  });

  history = asyncHandler(async (req, res) => {
    const payments = await paymentService.history(uuidSchema.parse(req.params.invoiceId));
    this.ok(res, "Payment history fetched successfully", { payments });
  });

  refund = asyncHandler(async (req, res) => {
    const refund = await paymentService.refund(
      uuidSchema.parse(req.params.paymentId),
      refundPaymentSchema.parse(req.body),
      req.user!,
    );
    this.ok(res, "Payment refunded successfully", { refund });
  });

  summary = asyncHandler(async (req, res) => {
    const summary = await paymentService.summary(uuidSchema.parse(req.params.invoiceId));
    this.ok(res, "Invoice payment summary fetched successfully", { summary });
  });
}

export const paymentController = new PaymentController();
