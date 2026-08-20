import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '../types/auth.types'

// refreshToken is managed as an httpOnly cookie by the backend.
// We only store the accessToken and the user object client-side.

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string) => void
  setUser: (user: User) => void
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken)
        set({
          user,
          accessToken,
          isAuthenticated: true,
        })
      },

      setUser: (user) => set({ user }),

      hasPermission: (permission: string): boolean =>
        get().user?.permissions?.includes(permission) ?? false,

      hasAnyPermission: (permissions: string[]): boolean =>
        permissions.some((permission) => get().user?.permissions?.includes(permission)),

      hasAllPermissions: (permissions: string[]): boolean =>
        permissions.every((permission) => get().user?.permissions?.includes(permission)),

      logout: () => {
        localStorage.removeItem('accessToken')
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'safnam-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist user and isAuthenticated — accessToken is
      // re-stored in localStorage separately for the axios interceptor.
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
