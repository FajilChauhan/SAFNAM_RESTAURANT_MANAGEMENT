import api from "./axios";
export const floorApi = {
  list: () => api.get("/api/floors"),
  create: (data: unknown) => api.post("/api/floors", data),
  update: (id: string, data: unknown) => api.patch(`/api/floors/${id}`, data),
  remove: (id: string) => api.delete(`/api/floors/${id}`),
};
