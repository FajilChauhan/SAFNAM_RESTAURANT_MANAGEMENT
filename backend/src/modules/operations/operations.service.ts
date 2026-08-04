// Operations service composes role-specific dashboards from existing business modules.
import { BaseService } from "../../lib/BaseService.js";
import { startOfUtcDay, endOfUtcDay } from "../../utils/date.js";
import { OperationsRepository } from "./operations.repository.js";

export class OperationsService extends BaseService {
  constructor(private readonly operationsRepository: OperationsRepository) {
    super();
  }

  dashboardSummary(date = new Date()) {
    return this.operationsRepository.dashboardSummary(this.todayRange(date));
  }

  receptionDashboard() {
    const range = this.todayRange();
    return Promise.all([
      this.operationsRepository.dashboardSummary(range),
      this.operationsRepository.todaysBookings(range),
      this.operationsRepository.tableStatus(),
      this.operationsRepository.roomStatus(),
      this.operationsRepository.pendingBills(),
    ]).then(([summary, todaysBookings, tables, rooms, pendingBills]) => ({
      summary,
      todaysBookings,
      tables,
      rooms,
      pendingBills,
      workflows: ["walk-in", "check-in", "checkout", "payments", "invoices", "customer-search"],
    }));
  }

  kitchenDashboard() {
    return Promise.all([this.operationsRepository.kitchenQueue(), this.operationsRepository.kitchenSummary()]).then(
      ([queue, summary]) => ({ summary, queue }),
    );
  }

  managerDashboard() {
    const range = this.todayRange();
    return Promise.all([
      this.operationsRepository.dashboardSummary(range),
      this.operationsRepository.todaysOrders(range),
      this.operationsRepository.todaysBookings(range),
      this.operationsRepository.tableStatus(),
      this.operationsRepository.roomStatus(),
    ]).then(([summary, todaysOrders, todaysBookings, tables, rooms]) => ({
      summary,
      todaysOrders,
      todaysBookings,
      tables,
      rooms,
      offers: "prepared",
      reportsSummary: "prepared",
    }));
  }

  adminDashboard() {
    return this.operationsRepository.adminOverview();
  }

  todaysOrders() {
    return this.operationsRepository.todaysOrders(this.todayRange());
  }

  todaysRevenue() {
    return this.operationsRepository.todaysRevenue(this.todayRange());
  }

  todaysBookings() {
    return this.operationsRepository.todaysBookings(this.todayRange());
  }

  todaysOccupancy() {
    return Promise.all([this.operationsRepository.tableStatus(), this.operationsRepository.roomStatus()]).then(([tables, rooms]) => ({
      tables,
      rooms,
    }));
  }

  pendingBills() {
    return this.operationsRepository.pendingBills();
  }

  kitchenQueueCount() {
    return this.operationsRepository.kitchenSummary();
  }

  customerSearch(search: string) {
    this.ensure(search.trim().length >= 2, "Search must contain at least 2 characters");
    return this.operationsRepository.searchCustomers(search.trim());
  }

  private todayRange(date = new Date()) {
    return {
      start: startOfUtcDay(date),
      end: endOfUtcDay(date),
    };
  }
}

export const operationsService = new OperationsService(new OperationsRepository());
