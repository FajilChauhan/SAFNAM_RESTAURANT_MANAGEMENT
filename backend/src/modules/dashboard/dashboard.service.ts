import { env } from "../../config/env.config.js";
import {
  OPERATION_PERMISSIONS,
  ROLE_PERMISSION_MAP,
} from "../operations/constants/operationPermissions.js";
import type { DashboardPayload, DashboardQueryDto, DashboardRawRow } from "./dashboard.dto.js";
import { DashboardRepository } from "./dashboard.repository.js";

type DashboardUser = {
  id: string;
  fullName: string;
  email: string | null;
};

export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async customer(user: DashboardUser, query: DashboardQueryDto): Promise<DashboardPayload> {
    const row = (await this.dashboardRepository.customer(user.id, query)) ?? {};
    const visitCount = this.toNumber(row.visitCount);
    const totalSpending = this.toNumber(row.totalSpending);
    const leaderboardPosition = this.toNumber(row.leaderboardPosition);

    return this.withBase({
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        visitCount,
        totalSpending,
        leaderboardPosition,
        rewardPoints: Math.floor(totalSpending / 100),
        loyaltyStatus: this.loyaltyStatus(totalSpending),
      },
      currentBooking: row.currentActiveBooking ?? null,
      currentCart: row.currentCart ?? null,
      activeOrders: row.currentOrders ?? [],
      currentInvoice: row.currentInvoice ?? null,
      paymentStatus: row.paymentStatus ?? null,
      bookingHistory: row.bookingHistory ?? [],
      recentOrders: row.recentOrders ?? [],
      favouriteFoods: row.favouriteFoods ?? [],
      availableOffers: row.availableOffers ?? [],
      rewards: row.rewards ?? [],
      notifications: row.notifications ?? [],
      recentFeedback: row.recentFeedback ?? [],
      quickActions: ["Book Table", "Book Room", "Order Food", "Track Order"],
    });
  }

  async reception(query: DashboardQueryDto): Promise<DashboardPayload> {
    const row = (await this.dashboardRepository.reception(query)) ?? {};
    const pendingPayments = this.asArray(row.pendingPayments);
    const pendingInvoices = this.asArray(row.pendingInvoices);

    return this.withBase({
      stats: {
        todayBookings: this.asArray(row.todaysBookings).length,
        todayWalkIns: this.asArray(row.todaysWalkIns).length,
        todayCheckIns: this.asArray(row.todaysCheckIns).length,
        todayCheckouts: this.asArray(row.todaysCheckouts).length,
        occupiedTables: this.asArray(row.occupiedTables).length,
        availableTables: this.asArray(row.availableTables).length,
        reservedTables: this.asArray(row.reservedTables).length,
        cleaningTables: this.asArray(row.cleaningTables).length,
        occupiedRooms: this.asArray(row.occupiedRooms).length,
        availableRooms: this.asArray(row.availableRooms).length,
        pendingPayments: pendingPayments.length,
        pendingInvoices: pendingInvoices.length,
        currentCustomers: this.asArray(row.currentCustomers).length,
      },
      todayBookings: row.todaysBookings ?? [],
      todaysWalkIns: row.todaysWalkIns ?? [],
      todaysCheckIns: row.todaysCheckIns ?? [],
      todaysCheckouts: row.todaysCheckouts ?? [],
      currentCustomers: row.currentCustomers ?? [],
      recentActivities: row.recentActivities ?? [],
      tableStatus: [
        ...this.asArray(row.occupiedTables),
        ...this.asArray(row.availableTables),
        ...this.asArray(row.reservedTables),
        ...this.asArray(row.cleaningTables),
      ],
      roomStatus: [...this.asArray(row.occupiedRooms), ...this.asArray(row.availableRooms)],
      pendingPaymentsList: pendingPayments,
      pendingInvoices,
      quickActions: ["Walk In", "Book Table", "Book Room", "Check In", "Checkout", "Payment"],
    });
  }

  async kitchen(query: DashboardQueryDto): Promise<DashboardPayload> {
    const row = (await this.dashboardRepository.kitchen(query)) ?? {};
    const stats = this.asRecord(row.kitchenStatistics);

    return this.withBase({
      stats: {
        pendingOrders: this.toNumber(stats.pending),
        acceptedOrders: this.toNumber(stats.accepted),
        preparingOrders: this.toNumber(stats.preparing),
        readyOrders: this.toNumber(stats.ready),
        servedOrders: this.toNumber(stats.servedToday),
        priorityOrders: this.toNumber(stats.priorityActive),
        todayOrders: this.asArray(row.todaysOrders).length,
        avgPreparationTime: this.toNumber(row.averagePreparationTime),
      },
      pendingOrders: row.pendingOrders ?? [],
      acceptedOrders: row.acceptedOrders ?? [],
      preparingOrders: row.preparingOrders ?? [],
      readyOrders: row.readyOrders ?? [],
      servedOrders: row.servedOrders ?? [],
      kitchenQueue: row.kitchenQueue ?? [],
      priorityOrders: row.priorityOrders ?? [],
      recentlyServed: row.servedOrders ?? [],
      kitchenStatistics: {
        ...stats,
        byHour: row.ordersByHour ?? [],
        avgTimeByCategory: row.averageTimeByCategory ?? [],
      },
      quickActions: ["Accept", "Preparing", "Ready", "Served"],
    });
  }

  async manager(query: DashboardQueryDto): Promise<DashboardPayload> {
    return this.toManagerDashboard(await this.dashboardRepository.manager(query));
  }

  async admin(query: DashboardQueryDto): Promise<DashboardPayload> {
    const [managerDashboard, adminSystem] = await Promise.all([
      this.dashboardRepository.manager(query),
      this.dashboardRepository.adminSystem(),
    ]);

    const managerPayload = this.toManagerDashboard(managerDashboard);
    const admin = adminSystem ?? {};

    return this.withBase(
      {
        ...managerPayload,
        employeeStats: {
          total: this.toNumber(admin.employeeCount),
          managers: this.toNumber(admin.managersCount),
          reception: this.toNumber(admin.receptionCount),
          kitchen: this.toNumber(admin.kitchenStaffCount),
          recentlyAdded: admin.recentEmployeeActivities ?? [],
        },
        userStatistics: admin.userStatistics ?? {},
        systemHealth: {
          status: "healthy",
          dbStatus: "UP",
          uptime: process.uptime().toFixed(0),
          lastBackup: "not_configured",
          details: admin.systemHealth ?? {},
        },
        databaseHealth: admin.databaseHealth ?? {},
        roleStatistics: admin.roleStatistics ?? {},
        restaurantSettings: admin.restaurantSettingsSummary ?? null,
        taxSettings: admin.taxSettings ?? {},
        notificationSettings: admin.notificationSettings ?? {},
        gameSettings: admin.gameSettings ?? {},
        loyaltySettings: admin.loyaltySettings ?? {},
        recentEmployeeActivities: admin.recentEmployeeActivities ?? [],
        auditLogs: [],
        auditLogsSummary: this.auditLogsSummary(),
        permissionStatistics: this.permissionStatistics(),
        storageUsage: this.storageUsage(),
      },
      {
        quickActions: [
          "Manage Employees",
          "Manage Roles",
          "Manage Permissions",
          "Restaurant Settings",
          "System Settings",
          "Audit Logs",
        ],
      },
    );
  }

  private toManagerDashboard(row: DashboardRawRow | null): DashboardPayload {
    const source = row ?? {};
    const dashboardStats = this.asRecord(source.dashboardStatistics);
    const tableOccupancy = this.asRecord(dashboardStats.tableOccupancy);
    const roomOccupancy = this.asRecord(dashboardStats.roomOccupancy);
    const occupiedTables = this.asArray(source.occupiedTables).length;
    const occupiedRooms = this.asArray(source.occupiedRooms).length;
    const totalTables = Object.values(tableOccupancy).reduce<number>((sum, value) => sum + this.toNumber(value), 0);
    const totalRooms = Object.values(roomOccupancy).reduce<number>((sum, value) => sum + this.toNumber(value), 0);
    const pendingPayments = this.asArray(source.pendingPayments);

    return this.withBase({
      stats: {
        todayRevenue: this.toNumber(source.todaysRevenue),
        monthlyRevenue: this.toNumber(source.monthlyRevenue),
        todayOrders: this.toNumber(source.todaysOrders),
        todayBookings: this.toNumber(source.todaysBookings),
        todayCustomers: this.toNumber(source.todaysCustomers),
        occupiedTables,
        occupiedRooms,
        totalTables,
        totalRooms,
        kitchenQueueCount: this.toNumber(source.kitchenQueueCount),
        pendingPayments: pendingPayments.length,
        pendingInvoices: this.toNumber(dashboardStats.pendingInvoices),
        revenueChange: this.toNumber(source.revenueChange),
        ordersChange: this.toNumber(source.ordersChange),
        customersChange: this.toNumber(source.customersChange),
        totalCustomers: this.toNumber(this.asRecord(source.customerStatistics).totalCustomers),
      },
      topSellingFoods: source.topSellingFoods ?? [],
      topCategories: source.topCategories ?? [],
      customerStatistics: source.customerStatistics ?? {},
      recentOrders: source.recentOrders ?? [],
      recentBookings: source.recentBookings ?? [],
      recentPayments: source.recentPayments ?? [],
      recentFeedback: source.recentFeedback ?? [],
      currentOffers: source.currentOffers ?? [],
      lowAvailabilityMenuItems: source.lowAvailabilityMenuItems ?? [],
      dashboardStatistics: source.dashboardStatistics ?? {},
      revenueChart: source.revenueChart ?? [],
      ordersChart: source.ordersChart ?? [],
      orderBreakdown: source.orderBreakdown ?? [],
      tableUtilization: totalTables ? Math.round((occupiedTables / totalTables) * 100) : 0,
      roomUtilization: totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      quickActions: [
        "Add Menu Item",
        "Update Menu",
        "Add Category",
        "Add Table",
        "Update Table",
        "Add Room",
        "Update Room",
        "Create Offer",
        "Manage Orders",
        "Manage Bookings",
        "Customer Search",
      ],
    });
  }

  private withBase(row: DashboardRawRow | null, extras: DashboardPayload = {}): DashboardPayload {
    return {
      restaurantName: "SAFNAM Restaurant",
      generatedAt: new Date().toISOString(),
      ...(row ?? {}),
      ...extras,
    };
  }

  private permissionStatistics() {
    return {
      permissionCount: Object.keys(OPERATION_PERMISSIONS).length,
      rolePermissionCounts: Object.fromEntries(
        Object.entries(ROLE_PERMISSION_MAP).map(([role, permissions]) => [role, permissions.length]),
      ),
    };
  }

  private storageUsage() {
    return {
      provider: env.STORAGE_PROVIDER,
      uploadBasePath: env.UPLOAD_BASE_PATH,
      publicPath: env.UPLOAD_PUBLIC_PATH,
      maxImageSizeBytes: env.MAX_IMAGE_SIZE_BYTES,
    };
  }

  private auditLogsSummary() {
    return {
      configured: false,
      storage: "not_implemented",
      reason: "The current audit service exposes contracts only and has no persisted audit log table.",
    };
  }

  private asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private toNumber(value: unknown): number {
    if (typeof value === "number") return value;
    if (typeof value === "bigint") return Number(value);
    if (typeof value === "string") return Number(value) || 0;
    return 0;
  }

  private loyaltyStatus(spending: number) {
    if (spending >= 100000) return "PLATINUM";
    if (spending >= 50000) return "GOLD";
    if (spending >= 15000) return "SILVER";
    return "BRONZE";
  }
}

export const dashboardService = new DashboardService(new DashboardRepository());
