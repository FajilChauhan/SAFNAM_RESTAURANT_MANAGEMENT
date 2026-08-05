// Operations controller exposes role dashboards and cross-module summaries.
import { BaseController } from "../../lib/BaseController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { operationsService } from "./operations.service.js";

class OperationsController extends BaseController {
  publicOffers = asyncHandler(async (_req, res) => {
    const offers = await operationsService.publicOffers();
    this.ok(res, "Offers fetched successfully", { offers });
  });

  publicLeaderboard = asyncHandler(async (_req, res) => {
    const leaderboard = await operationsService.publicLeaderboard();
    this.ok(res, "Leaderboard fetched successfully", { leaderboard });
  });

  dashboardSummary = asyncHandler(async (_req, res) => {
    const summary = await operationsService.dashboardSummary();
    this.ok(res, "Operations dashboard summary fetched successfully", { summary });
  });

  receptionDashboard = asyncHandler(async (_req, res) => {
    const dashboard = await operationsService.receptionDashboard();
    this.ok(res, "Reception dashboard fetched successfully", { dashboard });
  });

  kitchenDashboard = asyncHandler(async (_req, res) => {
    const dashboard = await operationsService.kitchenDashboard();
    this.ok(res, "Kitchen dashboard fetched successfully", { dashboard });
  });

  managerDashboard = asyncHandler(async (_req, res) => {
    const dashboard = await operationsService.managerDashboard();
    this.ok(res, "Manager dashboard fetched successfully", { dashboard });
  });

  adminDashboard = asyncHandler(async (_req, res) => {
    const dashboard = await operationsService.adminDashboard();
    this.ok(res, "Admin operations dashboard fetched successfully", { dashboard });
  });

  todaysOrders = asyncHandler(async (_req, res) => {
    const orders = await operationsService.todaysOrders();
    this.ok(res, "Today's orders fetched successfully", { orders });
  });

  todaysRevenue = asyncHandler(async (_req, res) => {
    const payments = await operationsService.todaysRevenue();
    this.ok(res, "Today's revenue fetched successfully", { payments });
  });

  todaysBookings = asyncHandler(async (_req, res) => {
    const bookings = await operationsService.todaysBookings();
    this.ok(res, "Today's bookings fetched successfully", { bookings });
  });

  todaysOccupancy = asyncHandler(async (_req, res) => {
    const occupancy = await operationsService.todaysOccupancy();
    this.ok(res, "Today's occupancy fetched successfully", { occupancy });
  });

  pendingBills = asyncHandler(async (_req, res) => {
    const invoices = await operationsService.pendingBills();
    this.ok(res, "Pending bills fetched successfully", { invoices });
  });

  kitchenQueueCount = asyncHandler(async (_req, res) => {
    const kitchen = await operationsService.kitchenQueueCount();
    this.ok(res, "Kitchen queue count fetched successfully", { kitchen });
  });

  customerSearch = asyncHandler(async (req, res) => {
    const customers = await operationsService.customerSearch(String(req.query.search ?? ""));
    this.ok(res, "Customers fetched successfully", { customers });
  });
}

export const operationsController = new OperationsController();
