import api from "./axios";

export const roomApi = {
  getRooms: () => api.get("/api/rooms"),
  createRoom: (data: unknown) => api.post("/api/rooms", data),
  updateRoom: (id: string, data: unknown) => api.patch(`/api/rooms/${id}`, data),
  deleteRoom: (id: string) => api.delete(`/api/rooms/${id}`),
};

