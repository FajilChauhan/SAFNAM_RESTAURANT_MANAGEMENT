import api from "./axios";

export const tableApi = {
  getTables: (params?: { floorId?: string }) => api.get("/api/tables", { params }),
  createTable: (data: unknown) => api.post("/api/tables", data),
  updateTable: (id: string, data: unknown) => api.patch(`/api/tables/${id}`, data),
  deleteTable: (id: string) => api.delete(`/api/tables/${id}`),
};

