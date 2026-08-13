import { Prisma, type UserRole } from "@prisma/client";
import { prisma } from "../../database/prisma.js";

export type AuditActor = {
  id?: string;
  fullName?: string;
  role?: UserRole;
};

export type AuditEvent = {
  actor?: AuditActor;
  action: string;
  module: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
};

export class AuditService {
  async record(event: AuditEvent) {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: event.actor?.id,
          actorName: event.actor?.fullName,
          actorRole: event.actor?.role,
          action: event.action,
          module: event.module,
          entityType: event.entityType,
          entityId: event.entityId,
          entityName: event.entityName,
          metadata: event.metadata as Prisma.InputJsonObject | undefined,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
        },
      });
    } catch {
      // Audit logging must never break the primary business operation.
    }
  }
}

export const auditService = new AuditService();
