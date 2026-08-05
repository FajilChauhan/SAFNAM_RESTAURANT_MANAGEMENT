import api from "./axios";
export const invoiceApi = {
  generate: (data: unknown) => api.post("/api/invoices/generate", data),
  getByBooking: (bookingId: string) => api.get(`/api/invoices/booking/${bookingId}`),
  updateDiscount: (invoiceId: string, data: unknown) => api.patch(`/api/invoices/${invoiceId}/discount`, data),
  addCharge: (invoiceId: string, data: unknown) => api.post(`/api/invoices/${invoiceId}/charges`, data),
  removeCharge: (invoiceItemId: string) => api.delete(`/api/invoices/charges/${invoiceItemId}`),
  cancel: (invoiceId: string) => api.patch(`/api/invoices/${invoiceId}/cancel`),
  summary: (invoiceId: string) => api.get(`/api/invoices/${invoiceId}/summary`),
};
