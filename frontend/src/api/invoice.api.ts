import api from "./axios";

export const invoiceApi = {
  getMyInvoices: () => api.get("/api/invoices"),
  getAllInvoices: () => api.get("/api/invoices"),
  getInvoiceById: (id: string) => api.get(`/api/invoices/${id}`),
  getInvoiceByBookingId: (bookingId: string) => api.get(`/api/invoices/booking/${bookingId}`),
  generateInvoice: (bookingId: string) => api.post("/api/invoices/generate", { bookingId }),
};

