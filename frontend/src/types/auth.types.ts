export type UserRole =
  'CUSTOMER' | 'RECEPTION' | 'KITCHEN' | 'MANAGER' | 'ADMIN'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  avatar?: string
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: User
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}
