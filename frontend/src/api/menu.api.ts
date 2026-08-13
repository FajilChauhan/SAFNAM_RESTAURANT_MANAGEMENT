import api from "./axios";

export const menuApi = {
  getCategories: () => api.get("/api/menu/categories"),
  createCategory: (data: unknown) => api.post("/api/menu/categories", data, data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined),
  updateCategory: (id: string, data: unknown) => api.patch(`/api/menu/categories/${id}`, data, data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined),
  deleteCategory: (id: string) => api.delete(`/api/menu/categories/${id}`),

  getItems: (params?: { categoryId?: string; featured?: boolean; popular?: boolean; isVeg?: boolean; available?: boolean; search?: string }) =>
    api.get("/api/menu/items", { params }),
  getItemById: (id: string) => api.get(`/api/menu/items/${id}`),
  createItem: (data: FormData) => api.post("/api/menu/items", data, { headers: { "Content-Type": "multipart/form-data" } }),
  updateItem: (id: string, data: FormData) => api.patch(`/api/menu/items/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  deleteItem: (id: string) => api.delete(`/api/menu/items/${id}`),
  updateAvailability: (id: string, isAvailable: boolean) => api.patch(`/api/menu/items/${id}/availability`, { isAvailable }),

  getVariants: (itemId: string) => api.get("/api/menu/variants", { params: { itemId } }),
  createVariant: (data: { itemId: string; name: string; price: number }) => api.post("/api/menu/variants", data),
  deleteVariant: (id: string) => api.delete(`/api/menu/variants/${id}`),

  getAddons: (itemId: string) => api.get("/api/menu/addons", { params: { itemId } }),
  createAddon: (data: { itemId: string; name: string; price: number }) => api.post("/api/menu/addons", data),
  deleteAddon: (id: string) => api.delete(`/api/menu/addons/${id}`),
};
