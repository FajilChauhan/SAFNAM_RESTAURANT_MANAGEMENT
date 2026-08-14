import api from "./axios";

export const paymentApi = {
  initiatePayment: (data: { invoiceId: string; method: string }) => api.post("/api/payments", data),
  verifyPayment: (data: unknown) => api.post("/api/payments/verify", data),
  getMyPayments: () => api.get("/api/payments"),
  getAllPayments: () => api.get("/api/payments"),
  getPaymentById: (id: string) => api.get(`/api/payments/${id}`),
  recordPayment: (data: {
    invoiceId: string;
    method: string;
    amount: number;
    transactionId?: string;
    referenceNumber?: string;
    remarks?: string;
  }) => api.post("/api/payments", data),
  getInvoicePayments: (invoiceId: string) => api.get(`/api/payments/invoice/${invoiceId}/history`),
};

