import { api } from "./axios";
import type { ApiResponse } from "@/types/common.types";
import type { AuthTokens, LoginDto, RegisterDto, User } from "@/types/auth.types";

export const authApi = {
  login: (data: LoginDto) => api.post<ApiResponse<AuthTokens>>("/api/auth/login", data),
  register: (data: RegisterDto) => api.post<ApiResponse<AuthTokens>>("/api/auth/register", data),
  refreshToken: (refreshToken: string) => api.post("/api/auth/refresh-token", { refreshToken }),
  logout: () => api.post("/api/auth/logout"),
  logoutAll: () => api.post("/api/auth/logout-all"),
  changePassword: (data: { oldPassword: string; newPassword: string; confirmPassword: string }) =>
    api.post("/api/auth/change-password", data),
  getMe: () => api.get<ApiResponse<User>>("/api/auth/me"),
};
