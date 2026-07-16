import { api } from "./api";

export const tournamentService = {
  list: () => api.get("/api/tournaments"),
};
