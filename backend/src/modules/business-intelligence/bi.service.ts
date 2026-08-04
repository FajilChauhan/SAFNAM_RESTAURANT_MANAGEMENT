// BI service calculates ranges and shapes analytics into dashboard, chart, and report payloads.
import { BaseService } from "../../lib/BaseService.js";
import { addDays, endOfUtcDay, startOfUtcDay } from "../../utils/date.js";
import { ApiError } from "../../utils/ApiError.js";
import type { BiQueryDto, ReportQueryDto } from "./dto/bi.dto.js";
import { BusinessIntelligenceRepository } from "./bi.repository.js";
import type { AnalyticsRange, ReportPayload } from "./types/bi.types.js";

export class BusinessIntelligenceService extends BaseService {
  constructor(private readonly biRepository: BusinessIntelligenceRepository) {
    super();
  }

  async dashboard(query: BiQueryDto) {
    const range = this.resolveRange(query);
    const [revenue, bookings, orders, customers, tables, rooms, employees, charts, pendingBills] = await Promise.all([
      this.biRepository.revenue(range),
      this.biRepository.bookings(range),
      this.biRepository.orders(range),
      this.biRepository.customers(range),
      this.biRepository.tables(range),
      this.biRepository.rooms(range),
      this.biRepository.employees(range),
      this.biRepository.charts(range),
      this.biRepository.pendingBills(range),
    ]);

    return { range, revenue, bookings, orders, customers, tables, rooms, employees, charts, pendingBills };
  }

  revenue(query: BiQueryDto) {
    const range = this.resolveRange(query);
    return Promise.all([this.biRepository.revenue(range), this.biRepository.revenueByCategory(range)]).then(
      ([revenue, byCategory]) => ({ range, ...revenue, byCategory }),
    );
  }

  bookings(query: BiQueryDto) {
    const range = this.resolveRange(query);
    return this.biRepository.bookings(range).then((bookings) => ({ range, ...bookings }));
  }

  orders(query: BiQueryDto) {
    const range = this.resolveRange(query);
    return this.biRepository.orders(range).then((orders) => ({ range, ...orders }));
  }

  customers(query: BiQueryDto) {
    const range = this.resolveRange(query);
    return this.biRepository.customers(range).then((customers) => ({ range, ...customers }));
  }

  tables(query: BiQueryDto) {
    const range = this.resolveRange(query);
    return this.biRepository.tables(range).then((tables) => ({ range, ...tables }));
  }

  rooms(query: BiQueryDto) {
    const range = this.resolveRange(query);
    return this.biRepository.rooms(range).then((rooms) => ({ range, ...rooms }));
  }

  employees(query: BiQueryDto) {
    const range = this.resolveRange(query);
    return this.biRepository.employees(range).then((employees) => ({ range, ...employees }));
  }

  charts(query: BiQueryDto) {
    const range = this.resolveRange(query);
    return this.biRepository.charts(range).then((charts) => ({ range, ...charts }));
  }

  async report(type: string, query: ReportQueryDto): Promise<ReportPayload<unknown>> {
    const range = this.resolveRange(query);
    const data = await this.resolveReportData(type, range);
    return { format: query.format, generatedAt: new Date(), range, data };
  }

  private resolveReportData(type: string, range: AnalyticsRange) {
    if (type === "sales") return this.biRepository.revenue(range);
    if (type === "gst") return this.biRepository.pendingBills(range);
    if (type === "booking") return this.biRepository.bookings(range);
    if (type === "payment") return this.biRepository.revenue(range);
    if (type === "customer") return this.biRepository.customers(range);
    if (type === "order") return this.biRepository.orders(range);
    throw new ApiError(400, "Unsupported report type");
  }

  private resolveRange(query: BiQueryDto): AnalyticsRange {
    if (query.period === "custom") {
      this.ensure(Boolean(query.startDate && query.endDate), "startDate and endDate are required for custom reports");
      const start = startOfUtcDay(new Date(`${query.startDate}T00:00:00.000Z`));
      const end = endOfUtcDay(new Date(`${query.endDate}T00:00:00.000Z`));
      this.ensure(start <= end, "startDate cannot be after endDate");
      return { start, end };
    }

    const today = new Date();
    const end = endOfUtcDay(today);
    if (query.period === "daily") return { start: startOfUtcDay(today), end };
    if (query.period === "weekly") return { start: startOfUtcDay(addDays(today, -6)), end };
    if (query.period === "monthly") return { start: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)), end };
    return { start: new Date(Date.UTC(today.getUTCFullYear(), 0, 1)), end };
  }
}

export const businessIntelligenceService = new BusinessIntelligenceService(new BusinessIntelligenceRepository());
