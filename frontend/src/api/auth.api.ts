import api from './axios'
import type { ApiResponse, LoginResponse, MeResponse, RegisterResponse } from '../types/auth.types'

// ── DTOs sent TO the backend ──────────────────────────────────────────────────

export interface LoginDto {
  email?: string
  phoneNumber?: string
  password: string
}

export interface RegisterDto {
  name: string       // backend accepts 'name' as alias for 'fullName'
  email?: string
  phone: string      // backend accepts 'phone' as alias for 'phoneNumber'
  password: string
}

export interface ChangePasswordDto {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const authApi = {
  // POST /api/auth/login
  // Response body: { success, data: { accessToken, user } }
  // refreshToken → httpOnly cookie (NOT in body)
  login: (data: LoginDto) =>
    api.post<ApiResponse<LoginResponse>>('/api/auth/login', data),

  // POST /api/auth/register
  // Response body: { success, data: { user } }  (201 Created)
  // Does NOT issue tokens — user must log in after registration.
  register: (data: RegisterDto) =>
    api.post<ApiResponse<RegisterResponse>>('/api/auth/register', data),

  // POST /api/auth/refresh-token
  // Backend reads the refresh token from the httpOnly cookie (req.cookies).
  // We send NO body — withCredentials: true on the axios instance sends the cookie.
  refreshToken: () =>
    api.post<ApiResponse<{ accessToken: string }>>('/api/auth/refresh-token'),

  // POST /api/auth/logout
  // Clears the httpOnly refresh-token cookie server-side.
  logout: () =>
    api.post('/api/auth/logout'),

  // POST /api/auth/logout-all  (requires auth)
  logoutAll: () =>
    api.post('/api/auth/logout-all'),

  // PATCH /api/auth/change-password  (requires auth)
  changePassword: (data: ChangePasswordDto) =>
    api.patch('/api/auth/change-password', data),

  // GET /api/auth/me  (requires auth)
  // Response body: { success, data: { user } }
  getMe: () =>
    api.get<ApiResponse<MeResponse>>('/api/auth/me'),
}
