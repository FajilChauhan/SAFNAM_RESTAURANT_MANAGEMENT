export type InvoiceStatus = "PENDING" | "PAID" | "CANCELLED";

export interface Invoice {
  id: string;
  orderId: string;
  bookingId: string;
  customerId: string;
  items: unknown[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  paidAt?: string;
}
