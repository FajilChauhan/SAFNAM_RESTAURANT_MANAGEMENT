import { api } from "./axios";
export const tableApi = {
  list: () => api.get("/api/tables"),
  create: (data: unknown) => api.post("/api/tables", data),
  update: (id: string, data: unknown) => api.patch(`/api/tables/${id}`, data),
  remove: (id: string) => api.delete(`/api/tables/${id}`),
};
