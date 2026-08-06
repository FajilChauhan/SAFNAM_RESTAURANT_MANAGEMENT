import api from "./axios";

export const floorApi = {
  getFloors: () => api.get("/api/floors"),
  createFloor: (data: unknown) => api.post("/api/floors", data),
  updateFloor: (id: string, data: unknown) => api.patch(`/api/floors/${id}`, data),
  deleteFloor: (id: string) => api.delete(`/api/floors/${id}`),
};

