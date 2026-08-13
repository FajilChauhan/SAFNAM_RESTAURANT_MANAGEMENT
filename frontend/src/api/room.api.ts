import api from "./axios";

export const roomApi = {
  getRooms: () => api.get("/api/rooms"),
  createRoom: (data: unknown) => api.post("/api/rooms", data, data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined),
  updateRoom: (id: string, data: unknown) => api.patch(`/api/rooms/${id}`, data, data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined),
  deleteRoom: (id: string) => api.delete(`/api/rooms/${id}`),
};
