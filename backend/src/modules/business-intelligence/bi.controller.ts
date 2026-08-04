// BI controller exposes analytics dashboards, charts, and export-ready reports.
import { BaseController } from "../../lib/BaseController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { businessIntelligenceService } from "./bi.service.js";
import { biQuerySchema, reportQuerySchema } from "./validators/bi.validator.js";

class BusinessIntelligenceController extends BaseController {
  dashboard = asyncHandler(async (req, res) => {
    const dashboard = await businessIntelligenceService.dashboard(biQuerySchema.parse(req.query));
    this.ok(res, "Business intelligence dashboard fetched successfully", { dashboard });
  });

  revenue = asyncHandler(async (req, res) => {
    const analytics = await businessIntelligenceService.revenue(biQuerySchema.parse(req.query));
    this.ok(res, "Revenue analytics fetched successfully", { analytics });
  });

  bookings = asyncHandler(async (req, res) => {
    const analytics = await businessIntelligenceService.bookings(biQuerySchema.parse(req.query));
    this.ok(res, "Booking analytics fetched successfully", { analytics });
  });

  orders = asyncHandler(async (req, res) => {
    const analytics = await businessIntelligenceService.orders(biQuerySchema.parse(req.query));
    this.ok(res, "Order analytics fetched successfully", { analytics });
  });

  customers = asyncHandler(async (req, res) => {
    const analytics = await businessIntelligenceService.customers(biQuerySchema.parse(req.query));
    this.ok(res, "Customer analytics fetched successfully", { analytics });
  });

  tables = asyncHandler(async (req, res) => {
    const analytics = await businessIntelligenceService.tables(biQuerySchema.parse(req.query));
    this.ok(res, "Table analytics fetched successfully", { analytics });
  });

  rooms = asyncHandler(async (req, res) => {
    const analytics = await businessIntelligenceService.rooms(biQuerySchema.parse(req.query));
    this.ok(res, "Room analytics fetched successfully", { analytics });
  });

  employees = asyncHandler(async (req, res) => {
    const analytics = await businessIntelligenceService.employees(biQuerySchema.parse(req.query));
    this.ok(res, "Employee analytics fetched successfully", { analytics });
  });

  charts = asyncHandler(async (req, res) => {
    const charts = await businessIntelligenceService.charts(biQuerySchema.parse(req.query));
    this.ok(res, "Chart analytics fetched successfully", { charts });
  });

  report = asyncHandler(async (req, res) => {
    const report = await businessIntelligenceService.report(req.params.type, reportQuerySchema.parse(req.query));
    this.ok(res, "Report generated successfully", { report });
  });
}

export const businessIntelligenceController = new BusinessIntelligenceController();
