import { BaseController } from "../../lib/BaseController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uuidSchema } from "../../utils/validator.js";
import { invoiceService } from "./invoice.service.js";
import { addInvoiceChargeSchema, generateInvoiceSchema, updateDiscountSchema } from "./validators/invoice.validator.js";

class InvoiceController extends BaseController {
  generate = asyncHandler(async (req, res) => {
    const invoice = await invoiceService.generate(generateInvoiceSchema.parse(req.body), req.user!);
    this.created(res, "Invoice generated successfully", { invoice });
  });

  get = asyncHandler(async (req, res) => {
    const invoice = await invoiceService.getByBooking(uuidSchema.parse(req.params.bookingId));
    this.ok(res, "Invoice fetched successfully", { invoice });
  });

  updateDiscount = asyncHandler(async (req, res) => {
    const invoice = await invoiceService.updateDiscount(
      uuidSchema.parse(req.params.invoiceId),
      updateDiscountSchema.parse(req.body),
      req.user!,
    );
    this.ok(res, "Invoice discount updated successfully", { invoice });
  });

  addCharge = asyncHandler(async (req, res) => {
    const invoice = await invoiceService.addCharge(
      uuidSchema.parse(req.params.invoiceId),
      addInvoiceChargeSchema.parse(req.body),
      req.user!,
    );
    this.ok(res, "Invoice charge added successfully", { invoice });
  });

  removeCharge = asyncHandler(async (req, res) => {
    const invoice = await invoiceService.removeCharge(uuidSchema.parse(req.params.invoiceItemId), req.user!);
    this.ok(res, "Invoice charge removed successfully", { invoice });
  });

  cancel = asyncHandler(async (req, res) => {
    const invoice = await invoiceService.cancel(uuidSchema.parse(req.params.invoiceId), req.user!);
    this.ok(res, "Invoice cancelled successfully", { invoice });
  });

  summary = asyncHandler(async (req, res) => {
    const summary = await invoiceService.summary(uuidSchema.parse(req.params.invoiceId));
    this.ok(res, "Invoice summary fetched successfully", { summary });
  });
}

export const invoiceController = new InvoiceController();
