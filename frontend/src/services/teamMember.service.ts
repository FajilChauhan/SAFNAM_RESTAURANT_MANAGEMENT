import { api } from "./api";

export const teamMemberService = {
  list: () => api.get("/api/team-members"),
};
