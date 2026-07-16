export type AuditActor = {
  id: string;
  role: string;
};

export type AuditLogPayload = {
  actor?: AuditActor;
  action: string;
  resource: string;
  resourceId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
};

export interface AuditLogService {
  record(payload: AuditLogPayload): Promise<void>;
}
