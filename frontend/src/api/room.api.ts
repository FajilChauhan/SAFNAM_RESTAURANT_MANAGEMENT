import api from "./axios";
export const roomApi = {
  list: () => api.get("/api/rooms"),
  create: (data: unknown) => api.post("/api/rooms", data),
  update: (id: string, data: unknown) => api.patch(`/api/rooms/${id}`, data),
  remove: (id: string) => api.delete(`/api/rooms/${id}`),
};
