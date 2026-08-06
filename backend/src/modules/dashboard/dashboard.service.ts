import { env } from "../../config/env.config.js";
import {
  OPERATION_PERMISSIONS,
  ROLE_PERMISSION_MAP,
} from "../operations/constants/operationPermissions.js";
import type { DashboardPayload, DashboardQueryDto, DashboardRawRow } from "./dashboard.dto.js";
import { DashboardRepository } from "./dashboard.repository.js";

export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async customer(customerId: string, query: DashboardQueryDto): Promise<DashboardPayload> {
    return this.withBase(await this.dashboardRepository.customer(customerId, query), {
      quickActions: ["Book Table", "Book Room", "Order Food", "Track Order"],
    });
  }

  async reception(query: DashboardQueryDto): Promise<DashboardPayload> {
    return this.withBase(await this.dashboardRepository.reception(query), {
      quickActions: ["Walk In", "Book Table", "Book Room", "Check In", "Checkout", "Payment"],
    });
  }

  async kitchen(query: DashboardQueryDto): Promise<DashboardPayload> {
    return this.withBase(await this.dashboardRepository.kitchen(query), {
      quickActions: ["Accept", "Preparing", "Ready", "Served"],
    });
  }

  async manager(query: DashboardQueryDto): Promise<DashboardPayload> {
    return this.withManagerBase(await this.dashboardRepository.manager(query));
  }

  async admin(query: DashboardQueryDto): Promise<DashboardPayload> {
    const [managerDashboard, adminSystem] = await Promise.all([
      this.dashboardRepository.manager(query),
      this.dashboardRepository.adminSystem(),
    ]);

    return this.withBase(
      {
        ...(managerDashboard ?? {}),
        ...(adminSystem ?? {}),
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

  private withManagerBase(row: DashboardRawRow | null): DashboardPayload {
    return this.withBase(row, {
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
}

export const dashboardService = new DashboardService(new DashboardRepository());
