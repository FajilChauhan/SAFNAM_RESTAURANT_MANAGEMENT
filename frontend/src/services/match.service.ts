import { api } from "./api";

export const matchService = {
  list: () => api.get("/api/matches"),
};
