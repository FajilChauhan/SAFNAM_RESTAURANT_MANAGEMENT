import { api } from "./api";

export const userService = {
  list: () => api.get("/api/users"),
};
