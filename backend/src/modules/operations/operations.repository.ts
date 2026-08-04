// Operations repository reads cross-module data for role dashboards and status panels.
import { InvoiceStatus, KitchenQueueStatus, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import type { DateRange } from "./types/operations.types.js";

const ACTIVE_KITCHEN_STATUSES: KitchenQueueStatus[] = ["PENDING", "ACCEPTED", "PREPARING", "READY"];

export class OperationsRepository {
  async dashboardSummary(range: DateRange) {
    const [revenue, todaysOrders, todaysBookings, occupiedTables, occupiedRooms, totalTables, totalRooms, pendingBills, kitchenQueueCount] =
      await Promise.all([
        prisma.payment.aggregate({
          where: {
            deletedAt: null,
            status: "SUCCESS",
            paidAt: { gte: range.start, lte: range.end },
          },
          _sum: { amount: true },
        }),
        prisma.order.count({
          where: { deletedAt: null, confirmedAt: { gte: range.start, lte: range.end } },
        }),
        prisma.booking.count({
          where: { deletedAt: null, bookingDate: { gte: range.start, lte: range.end } },
        }),
        prisma.diningTable.count({ where: { deletedAt: null, status: "OCCUPIED" } }),
        prisma.room.count({ where: { deletedAt: null, status: "OCCUPIED" } }),
        prisma.diningTable.count({ where: { deletedAt: null } }),
        prisma.room.count({ where: { deletedAt: null } }),
        prisma.invoice.count({
          where: {
            deletedAt: null,
            status: { in: [InvoiceStatus.GENERATED, InvoiceStatus.PARTIALLY_PAID] },
            balanceAmount: { gt: new Prisma.Decimal(0) },
          },
        }),
        prisma.kitchenQueue.count({
          where: { deletedAt: null, status: { in: ACTIVE_KITCHEN_STATUSES } },
        }),
      ]);

    return {
      todaysRevenue: (revenue._sum.amount ?? new Prisma.Decimal(0)).toString(),
      todaysOrders,
      todaysBookings,
      todaysOccupancy: { occupiedTables, occupiedRooms, totalTables, totalRooms },
      pendingBills,
      kitchenQueueCount,
    };
  }

  todaysBookings(range: DateRange) {
    return prisma.booking.findMany({
      where: { deletedAt: null, bookingDate: { gte: range.start, lte: range.end } },
      include: {
        customer: { select: { id: true, fullName: true, phoneNumber: true, email: true } },
        table: true,
        room: true,
        invoice: true,
      },
      orderBy: [{ startAt: "asc" }, { createdAt: "asc" }],
    });
  }

  todaysOrders(range: DateRange) {
    return prisma.order.findMany({
      where: { deletedAt: null, confirmedAt: { gte: range.start, lte: range.end } },
      include: {
        booking: {
          include: {
            customer: { select: { id: true, fullName: true, phoneNumber: true } },
            table: true,
            room: true,
          },
        },
        items: { include: { addOns: true } },
        kitchenQueue: true,
      },
      orderBy: { confirmedAt: "desc" },
    });
  }

  todaysRevenue(range: DateRange) {
    return prisma.payment.findMany({
      where: {
        deletedAt: null,
        status: "SUCCESS",
        paidAt: { gte: range.start, lte: range.end },
      },
      include: {
        invoice: { select: { id: true, invoiceNumber: true, grandTotal: true, status: true } },
        booking: { select: { id: true, bookingNumber: true } },
        receivedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { paidAt: "desc" },
    });
  }

  tableStatus() {
    return prisma.diningTable.findMany({
      where: { deletedAt: null },
      include: { floor: { select: { id: true, name: true, restaurantId: true } } },
      orderBy: [{ floor: { displayOrder: "asc" } }, { tableNumber: "asc" }],
    });
  }

  roomStatus() {
    return prisma.room.findMany({
      where: { deletedAt: null },
      include: { restaurant: { select: { id: true, name: true } } },
      orderBy: { roomNumber: "asc" },
    });
  }

  searchCustomers(search: string) {
    return prisma.user.findMany({
      where: {
        deletedAt: null,
        role: "CUSTOMER",
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        email: true,
        visitCount: true,
        totalSpending: true,
        lastVisitAt: true,
      },
      take: 25,
      orderBy: { fullName: "asc" },
    });
  }

  kitchenQueue() {
    return prisma.kitchenQueue.findMany({
      where: { deletedAt: null, status: { in: ACTIVE_KITCHEN_STATUSES } },
      include: {
        order: {
          include: {
            booking: {
              include: {
                customer: { select: { id: true, fullName: true, phoneNumber: true } },
                table: true,
                room: true,
              },
            },
            items: { include: { addOns: true } },
          },
        },
      },
      orderBy: [{ priority: "desc" }, { queuedAt: "asc" }],
    });
  }

  async kitchenSummary() {
    const [pending, accepted, preparing, ready, servedToday] = await Promise.all([
      prisma.kitchenQueue.count({ where: { deletedAt: null, status: "PENDING" } }),
      prisma.kitchenQueue.count({ where: { deletedAt: null, status: "ACCEPTED" } }),
      prisma.kitchenQueue.count({ where: { deletedAt: null, status: "PREPARING" } }),
      prisma.kitchenQueue.count({ where: { deletedAt: null, status: "READY" } }),
      prisma.kitchenQueue.count({
        where: { deletedAt: null, status: "SERVED", servedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);

    return { pending, accepted, preparing, ready, servedToday };
  }

  pendingBills() {
    return prisma.invoice.findMany({
      where: {
        deletedAt: null,
        status: { in: [InvoiceStatus.GENERATED, InvoiceStatus.PARTIALLY_PAID] },
        balanceAmount: { gt: new Prisma.Decimal(0) },
      },
      include: {
        booking: {
          include: {
            customer: { select: { id: true, fullName: true, phoneNumber: true } },
            table: true,
            room: true,
          },
        },
      },
      orderBy: { generatedAt: "desc" },
    });
  }

  adminOverview() {
    return Promise.all([
      prisma.restaurant.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.menuCategory.count({ where: { deletedAt: null } }),
      prisma.menuItem.count({ where: { deletedAt: null } }),
      prisma.floor.count({ where: { deletedAt: null } }),
      prisma.diningTable.count({ where: { deletedAt: null } }),
      prisma.room.count({ where: { deletedAt: null } }),
    ]).then(([restaurants, users, categories, menuItems, floors, tables, rooms]) => ({
      restaurants,
      users,
      categories,
      menuItems,
      floors,
      tables,
      rooms,
      auditLogs: "prepared",
      systemSettings: "prepared",
    }));
  }
}
