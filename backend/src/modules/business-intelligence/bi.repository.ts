// BI repository generates analytics from live transactional data; it stores no analytics snapshots.
import { BookingStatus, InvoiceStatus, KitchenQueueStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import type { AnalyticsRange } from "./types/bi.types.js";

const ACTIVE_KITCHEN_STATUSES: KitchenQueueStatus[] = ["PENDING", "ACCEPTED", "PREPARING", "READY"];

type NumericRow = { label: string; value: bigint | number | Prisma.Decimal | null };

export class BusinessIntelligenceRepository {
  async revenue(range: AnalyticsRange) {
    const [total, byMethod, byCustomer, byTable, byRoom, previousTotal] = await Promise.all([
      prisma.payment.aggregate({
        where: this.successfulPaymentsWhere(range),
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.payment.groupBy({
        by: ["method"],
        where: this.successfulPaymentsWhere(range),
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: "desc" } },
      }),
      prisma.payment.groupBy({
        by: ["bookingId"],
        where: this.successfulPaymentsWhere(range),
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 10,
      }),
      prisma.$queryRaw<NumericRow[]>`
        SELECT COALESCE(t."tableNumber", 'N/A') AS label, COALESCE(SUM(p.amount), 0) AS value
        FROM payments p
        JOIN bookings b ON b.id = p."bookingId"
        LEFT JOIN tables t ON t.id = b."tableId"
        WHERE p."deletedAt" IS NULL AND p.status = 'SUCCESS' AND p."paidAt" BETWEEN ${range.start} AND ${range.end}
        GROUP BY label
        ORDER BY value DESC
      `,
      prisma.$queryRaw<NumericRow[]>`
        SELECT COALESCE(r."roomNumber", 'N/A') AS label, COALESCE(SUM(p.amount), 0) AS value
        FROM payments p
        JOIN bookings b ON b.id = p."bookingId"
        LEFT JOIN rooms r ON r.id = b."roomId"
        WHERE p."deletedAt" IS NULL AND p.status = 'SUCCESS' AND p."paidAt" BETWEEN ${range.start} AND ${range.end}
        GROUP BY label
        ORDER BY value DESC
      `,
      prisma.payment.aggregate({
        where: this.successfulPaymentsWhere(this.previousRange(range)),
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = total._sum.amount ?? new Prisma.Decimal(0);
    const oldRevenue = previousTotal._sum.amount ?? new Prisma.Decimal(0);
    const growthPercent = oldRevenue.equals(0) ? null : totalRevenue.minus(oldRevenue).div(oldRevenue).mul(100).toFixed(2);

    return {
      totalRevenue: totalRevenue.toString(),
      paymentCount: total._count.id,
      revenueGrowthPercent: growthPercent,
      byPaymentMethod: byMethod.map((item) => ({
        method: item.method,
        revenue: (item._sum.amount ?? new Prisma.Decimal(0)).toString(),
        payments: item._count.id,
      })),
      byCustomer,
      byTable: this.normalizeRows(byTable),
      byRoom: this.normalizeRows(byRoom),
    };
  }

  async revenueByCategory(range: AnalyticsRange) {
    const rows = await prisma.$queryRaw<NumericRow[]>`
      SELECT mc.name AS label, COALESCE(SUM(oi."lineTotalSnapshot"), 0) AS value
      FROM order_items oi
      JOIN menu_items mi ON mi.id = oi."menuItemId"
      JOIN menu_categories mc ON mc.id = mi."categoryId"
      JOIN orders o ON o.id = oi."orderId"
      WHERE oi."deletedAt" IS NULL AND o."deletedAt" IS NULL AND o."confirmedAt" BETWEEN ${range.start} AND ${range.end}
      GROUP BY mc.name
      ORDER BY value DESC
    `;
    return this.normalizeRows(rows);
  }

  async bookings(range: AnalyticsRange) {
    const [total, byStatus, bySource, averageDuration, peakHours] = await Promise.all([
      prisma.booking.count({ where: this.bookingsWhere(range) }),
      prisma.booking.groupBy({
        by: ["status"],
        where: this.bookingsWhere(range),
        _count: { id: true },
      }),
      prisma.booking.groupBy({
        by: ["source"],
        where: this.bookingsWhere(range),
        _count: { id: true },
      }),
      prisma.$queryRaw<NumericRow[]>`
        SELECT 'averageMinutes' AS label, AVG(EXTRACT(EPOCH FROM ("endAt" - "startAt")) / 60) AS value
        FROM bookings
        WHERE "deletedAt" IS NULL AND "bookingDate" BETWEEN ${range.start} AND ${range.end}
      `,
      prisma.$queryRaw<NumericRow[]>`
        SELECT EXTRACT(HOUR FROM "startAt")::text AS label, COUNT(*) AS value
        FROM bookings
        WHERE "deletedAt" IS NULL AND "bookingDate" BETWEEN ${range.start} AND ${range.end}
        GROUP BY label
        ORDER BY value DESC
      `,
    ]);

    return {
      total,
      completed: this.countStatus(byStatus, BookingStatus.COMPLETED),
      cancelled: this.countStatus(byStatus, BookingStatus.CANCELLED),
      noShow: this.countStatus(byStatus, BookingStatus.NO_SHOW),
      byStatus,
      bySource,
      averageBookingMinutes: this.normalizeRows(averageDuration)[0]?.value ?? "0",
      peakBookingHours: this.normalizeRows(peakHours),
    };
  }

  async orders(range: AnalyticsRange) {
    const [orders, mostFoods, leastFoods, categories, prepTime, kitchen] = await Promise.all([
      prisma.order.aggregate({
        where: this.ordersWhere(range),
        _count: { id: true },
        _avg: { totalSnapshot: true },
      }),
      prisma.orderItem.groupBy({
        by: ["menuItemId", "itemNameSnapshot"],
        where: { deletedAt: null, order: this.ordersWhere(range) },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),
      prisma.orderItem.groupBy({
        by: ["menuItemId", "itemNameSnapshot"],
        where: { deletedAt: null, order: this.ordersWhere(range) },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "asc" } },
        take: 10,
      }),
      this.revenueByCategory(range),
      prisma.$queryRaw<NumericRow[]>`
        SELECT 'averagePreparationMinutes' AS label, AVG(EXTRACT(EPOCH FROM (kq."readyAt" - kq."startedAt")) / 60) AS value
        FROM kitchen_queue kq
        JOIN orders o ON o.id = kq."orderId"
        WHERE kq."startedAt" IS NOT NULL AND kq."readyAt" IS NOT NULL AND o."confirmedAt" BETWEEN ${range.start} AND ${range.end}
      `,
      prisma.kitchenQueue.groupBy({
        by: ["status"],
        where: { deletedAt: null, order: this.ordersWhere(range) },
        _count: { id: true },
      }),
    ]);

    return {
      totalOrders: orders._count.id,
      averageOrderValue: (orders._avg.totalSnapshot ?? new Prisma.Decimal(0)).toString(),
      mostOrderedFood: mostFoods,
      leastOrderedFood: leastFoods,
      mostOrderedCategory: categories,
      averagePreparationMinutes: this.normalizeRows(prepTime)[0]?.value ?? "0",
      kitchenPerformance: kitchen,
    };
  }

  async customers(range: AnalyticsRange) {
    const [newCustomers, returningCustomers, topCustomers, spending] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER", deletedAt: null, createdAt: { gte: range.start, lte: range.end } } }),
      prisma.user.count({ where: { role: "CUSTOMER", deletedAt: null, visitCount: { gt: 1 } } }),
      prisma.user.findMany({
        where: { role: "CUSTOMER", deletedAt: null },
        select: { id: true, fullName: true, phoneNumber: true, visitCount: true, totalSpending: true, lastVisitAt: true },
        orderBy: [{ totalSpending: "desc" }, { visitCount: "desc" }],
        take: 10,
      }),
      prisma.user.aggregate({
        where: { role: "CUSTOMER", deletedAt: null },
        _avg: { totalSpending: true, visitCount: true },
        _sum: { totalSpending: true },
      }),
    ]);

    return {
      newCustomers,
      returningCustomers,
      topCustomers,
      averageVisitFrequency: spending._avg.visitCount ?? 0,
      averageCustomerSpending: (spending._avg.totalSpending ?? new Prisma.Decimal(0)).toString(),
      lifetimeValue: (spending._sum.totalSpending ?? new Prisma.Decimal(0)).toString(),
    };
  }

  async tables(range: AnalyticsRange) {
    const [usage, occupancy, peakHours] = await Promise.all([
      prisma.$queryRaw<NumericRow[]>`
        SELECT t."tableNumber" AS label, COUNT(b.id) AS value
        FROM tables t
        LEFT JOIN bookings b ON b."tableId" = t.id AND b."deletedAt" IS NULL AND b."bookingDate" BETWEEN ${range.start} AND ${range.end}
        WHERE t."deletedAt" IS NULL
        GROUP BY t."tableNumber"
        ORDER BY value DESC
      `,
      prisma.diningTable.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { id: true } }),
      prisma.$queryRaw<NumericRow[]>`
        SELECT EXTRACT(HOUR FROM b."startAt")::text AS label, COUNT(*) AS value
        FROM bookings b
        WHERE b."deletedAt" IS NULL AND b."tableId" IS NOT NULL AND b."bookingDate" BETWEEN ${range.start} AND ${range.end}
        GROUP BY label
        ORDER BY value DESC
      `,
    ]);

    const normalizedUsage = this.normalizeRows(usage);
    return {
      mostUsedTables: normalizedUsage.slice(0, 10),
      leastUsedTables: [...normalizedUsage].reverse().slice(0, 10),
      occupancy,
      peakHours: this.normalizeRows(peakHours),
    };
  }

  async rooms(range: AnalyticsRange) {
    const [occupancy, revenue, averageStay, popularTypes] = await Promise.all([
      prisma.room.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { id: true } }),
      prisma.$queryRaw<NumericRow[]>`
        SELECT COALESCE(r."roomNumber", 'N/A') AS label, COALESCE(SUM(i."roomTotal"), 0) AS value
        FROM invoices i
        JOIN bookings b ON b.id = i."bookingId"
        LEFT JOIN rooms r ON r.id = b."roomId"
        WHERE i."deletedAt" IS NULL AND b."roomId" IS NOT NULL AND i."generatedAt" BETWEEN ${range.start} AND ${range.end}
        GROUP BY label
        ORDER BY value DESC
      `,
      prisma.$queryRaw<NumericRow[]>`
        SELECT 'averageStayHours' AS label, AVG(EXTRACT(EPOCH FROM (b."endAt" - b."startAt")) / 3600) AS value
        FROM bookings b
        WHERE b."deletedAt" IS NULL AND b."roomId" IS NOT NULL AND b."bookingDate" BETWEEN ${range.start} AND ${range.end}
      `,
      prisma.room.groupBy({
        by: ["roomType"],
        where: { deletedAt: null, bookings: { some: { bookingDate: { gte: range.start, lte: range.end } } } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    return {
      occupancy,
      revenue: this.normalizeRows(revenue),
      averageStayHours: this.normalizeRows(averageStay)[0]?.value ?? "0",
      popularRoomTypes: popularTypes,
    };
  }

  async employees(range: AnalyticsRange) {
    const [reception, kitchen, managers] = await Promise.all([
      prisma.booking.groupBy({
        by: ["createdBy"],
        where: { deletedAt: null, createdBy: { not: null }, bookingDate: { gte: range.start, lte: range.end } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.kitchenQueue.groupBy({
        by: ["updatedBy"],
        where: { deletedAt: null, updatedBy: { not: null }, status: { notIn: ACTIVE_KITCHEN_STATUSES } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.order.groupBy({
        by: ["orderedById"],
        where: { deletedAt: null, source: "MANAGER", confirmedAt: { gte: range.start, lte: range.end } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    return { receptionPerformance: reception, kitchenPerformance: kitchen, managerActivity: managers };
  }

  async charts(range: AnalyticsRange) {
    const [revenueChart, orderChart, bookingChart, customerGrowth, occupancy] = await Promise.all([
      prisma.$queryRaw<NumericRow[]>`
        SELECT DATE(p."paidAt")::text AS label, COALESCE(SUM(p.amount), 0) AS value
        FROM payments p
        WHERE p."deletedAt" IS NULL AND p.status = 'SUCCESS' AND p."paidAt" BETWEEN ${range.start} AND ${range.end}
        GROUP BY label
        ORDER BY label ASC
      `,
      prisma.$queryRaw<NumericRow[]>`
        SELECT DATE(o."confirmedAt")::text AS label, COUNT(*) AS value
        FROM orders o
        WHERE o."deletedAt" IS NULL AND o."confirmedAt" BETWEEN ${range.start} AND ${range.end}
        GROUP BY label
        ORDER BY label ASC
      `,
      prisma.$queryRaw<NumericRow[]>`
        SELECT DATE(b."bookingDate")::text AS label, COUNT(*) AS value
        FROM bookings b
        WHERE b."deletedAt" IS NULL AND b."bookingDate" BETWEEN ${range.start} AND ${range.end}
        GROUP BY label
        ORDER BY label ASC
      `,
      prisma.$queryRaw<NumericRow[]>`
        SELECT DATE(u."createdAt")::text AS label, COUNT(*) AS value
        FROM users u
        WHERE u."deletedAt" IS NULL AND u.role = 'CUSTOMER' AND u."createdAt" BETWEEN ${range.start} AND ${range.end}
        GROUP BY label
        ORDER BY label ASC
      `,
      prisma.booking.groupBy({
        by: ["bookingType"],
        where: this.bookingsWhere(range),
        _count: { id: true },
      }),
    ]);

    return {
      revenueChart: this.normalizeRows(revenueChart),
      orderChart: this.normalizeRows(orderChart),
      bookingChart: this.normalizeRows(bookingChart),
      customerGrowth: this.normalizeRows(customerGrowth),
      occupancy,
    };
  }

  pendingBills(range: AnalyticsRange) {
    return prisma.invoice.findMany({
      where: {
        deletedAt: null,
        generatedAt: { gte: range.start, lte: range.end },
        status: { in: [InvoiceStatus.GENERATED, InvoiceStatus.PARTIALLY_PAID] },
        balanceAmount: { gt: new Prisma.Decimal(0) },
      },
      include: { booking: { include: { customer: { select: { id: true, fullName: true, phoneNumber: true } } } } },
      orderBy: { generatedAt: "desc" },
    });
  }

  private successfulPaymentsWhere(range: AnalyticsRange): Prisma.PaymentWhereInput {
    return { deletedAt: null, status: PaymentStatus.SUCCESS, paidAt: { gte: range.start, lte: range.end } };
  }

  private bookingsWhere(range: AnalyticsRange): Prisma.BookingWhereInput {
    return { deletedAt: null, bookingDate: { gte: range.start, lte: range.end } };
  }

  private ordersWhere(range: AnalyticsRange): Prisma.OrderWhereInput {
    return { deletedAt: null, confirmedAt: { gte: range.start, lte: range.end } };
  }

  private previousRange(range: AnalyticsRange): AnalyticsRange {
    const duration = range.end.getTime() - range.start.getTime();
    return { start: new Date(range.start.getTime() - duration), end: new Date(range.end.getTime() - duration) };
  }

  private countStatus(items: Array<{ status: BookingStatus; _count: { id: number } }>, status: BookingStatus) {
    return items.find((item) => item.status === status)?._count.id ?? 0;
  }

  private normalizeRows(rows: NumericRow[]) {
    return rows.map((row) => ({ label: row.label, value: row.value?.toString() ?? "0" }));
  }
}
