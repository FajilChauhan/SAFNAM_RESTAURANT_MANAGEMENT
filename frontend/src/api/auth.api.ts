import api from './axios'
import type { ApiResponse, AuthTokens, User } from '../types/auth.types'

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  name: string
  email: string
  phone: string
  password: string
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

export const authApi = {
  login: (data: LoginDto) =>
    api.post<ApiResponse<AuthTokens>>('/api/auth/login', data),

  register: (data: RegisterDto) =>
    api.post<ApiResponse<AuthTokens>>('/api/auth/register', data),

  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string }>>(
      '/api/auth/refresh-token',
      { refreshToken }
    ),

  logout: () =>
    api.post('/api/auth/logout'),

  logoutAll: () =>
    api.post('/api/auth/logout-all'),

  changePassword: (data: ChangePasswordDto) =>
    api.post('/api/auth/change-password', data),

  getMe: () =>
    api.get<ApiResponse<User>>('/api/auth/me'),
}
