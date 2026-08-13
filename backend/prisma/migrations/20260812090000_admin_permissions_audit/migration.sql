-- Adds system authorization configuration and persisted admin audit events.
-- No business data is duplicated; these tables support backend authorization and traceability only.

CREATE TABLE "role_permissions" (
  "id" UUID NOT NULL,
  "role" "UserRole" NOT NULL,
  "permission" VARCHAR(120) NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" UUID,

  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "role_permissions_role_permission_key" ON "role_permissions"("role", "permission");
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");
CREATE INDEX "role_permissions_enabled_idx" ON "role_permissions"("enabled");

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL,
  "actorId" UUID,
  "actorName" VARCHAR(120),
  "actorRole" "UserRole",
  "action" VARCHAR(120) NOT NULL,
  "module" VARCHAR(80) NOT NULL,
  "entityType" VARCHAR(80),
  "entityId" VARCHAR(80),
  "entityName" VARCHAR(160),
  "metadata" JSONB,
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");
CREATE INDEX "audit_logs_actorRole_idx" ON "audit_logs"("actorRole");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
