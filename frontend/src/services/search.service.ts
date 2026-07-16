import { api } from "./api";

export const searchService = {
  search: (query: string) => api.get("/api/search", { params: { q: query } }),
};
