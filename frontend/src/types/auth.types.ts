// Backend AuthUserDto: { id, name, phone, email, role, status, avatar }
// These types are derived from the REAL backend response, not assumed.

export type UserRole =
  'CUSTOMER' | 'RECEPTION' | 'KITCHEN' | 'MANAGER' | 'ADMIN'

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'

export interface User {
  id: string
  name: string
  email: string | null
  phone: string
  role: UserRole
  status: UserStatus
  avatar: string | null
}

// Backend login response: { success, data: { accessToken, user } }
// refreshToken is NOT in the body — it is set as an httpOnly cookie.
export interface LoginResponse {
  accessToken: string
  user: User
}

// Backend register response: { success, data: { user } }
// Register does NOT issue tokens — user must log in after registration.
export interface RegisterResponse {
  user: User
}

// Backend GET /api/auth/me response: { success, data: { user } }
export interface MeResponse {
  user: User
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}
