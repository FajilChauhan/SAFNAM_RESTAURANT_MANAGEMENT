export type PaymentReceipt = {
  paymentNumber: string;
  invoiceNumber: string;
  bookingId: string;
  method: string;
  amount: string;
  paidAt: Date;
  receivedBy: string;
};

export type InvoicePaymentSummary = {
  invoiceId: string;
  invoiceNumber: string;
  grandTotal: string;
  paidAmount: string;
  balanceAmount: string;
  status: string;
};
