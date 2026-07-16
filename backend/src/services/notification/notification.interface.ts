export type NotificationPayload = {
  recipientId: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export interface NotificationService {
  send(payload: NotificationPayload): Promise<void>;
}
