import api from "./axios";
export const paymentApi = {
  create: (data: unknown) => api.post("/api/payments", data),
  get: (paymentId: string) => api.get(`/api/payments/${paymentId}`),
  history: (invoiceId: string) => api.get(`/api/payments/invoice/${invoiceId}/history`),
  summary: (invoiceId: string) => api.get(`/api/payments/invoice/${invoiceId}/summary`),
  refund: (paymentId: string, data: unknown) => api.post(`/api/payments/${paymentId}/refund`, data),
};
