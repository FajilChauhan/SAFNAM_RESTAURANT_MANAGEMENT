import api from "./axios";

export const paymentApi = {
  initiatePayment: (data: { invoiceId: string; method: string }) => api.post("/api/payments", data),
  verifyPayment: (data: unknown) => api.post("/api/payments/verify", data),
  getMyPayments: () => api.get("/api/payments"),
  getAllPayments: () => api.get("/api/payments"),
  getPaymentById: (id: string) => api.get(`/api/payments/${id}`),
};

