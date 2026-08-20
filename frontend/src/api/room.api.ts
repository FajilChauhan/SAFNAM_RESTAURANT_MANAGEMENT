import api from "./axios";

export const roomApi = {
  getRooms: (params?: Record<string, string>) => api.get("/api/rooms", { params }),
  createRoom: (data: FormData | Record<string, unknown>) => api.post("/api/rooms", data),
  updateRoom: (id: string, data: FormData | Record<string, unknown>) => api.patch(`/api/rooms/${id}`, data),
  deleteRoom: (id: string) => api.delete(`/api/rooms/${id}`),
  getTypes: () => api.get<{ success: true; data: { types: string[] } }>("/api/rooms/types"),
};

