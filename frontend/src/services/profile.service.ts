import { api } from "./api";

export const profileService = {
  getProfile: () => api.get("/api/profile"),
};
