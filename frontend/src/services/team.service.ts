import { api } from "./api";

export const teamService = {
  list: () => api.get("/api/teams"),
};
