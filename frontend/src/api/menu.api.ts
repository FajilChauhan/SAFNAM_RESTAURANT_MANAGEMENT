import { api } from "./axios";
export const menuApi = {
  categories: {
    list: () => api.get("/api/menu/categories"),
    create: (data: unknown) => api.post("/api/menu/categories", data),
    update: (id: string, data: unknown) => api.patch(`/api/menu/categories/${id}`, data),
    remove: (id: string) => api.delete(`/api/menu/categories/${id}`),
  },
  items: {
    list: () => api.get("/api/menu/items"),
    create: (data: unknown) => api.post("/api/menu/items", data),
    update: (id: string, data: unknown) => api.patch(`/api/menu/items/${id}`, data),
    remove: (id: string) => api.delete(`/api/menu/items/${id}`),
  },
};
