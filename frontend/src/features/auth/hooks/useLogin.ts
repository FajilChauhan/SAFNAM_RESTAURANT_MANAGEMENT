import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../../api/auth.api'
import type { LoginDto } from '../../../api/auth.api'
import { useAuthStore } from '../../../store/authStore'

// Role → dashboard route mapping based on REAL roles from the backend.
const roleRedirectMap: Record<string, string> = {
  CUSTOMER: '/customer/dashboard',
  RECEPTION: '/reception',
  KITCHEN: '/kitchen',
  MANAGER: '/manager',
  ADMIN: '/admin',
}

export const useLogin = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const { mutate: login, isPending, error, isError } = useMutation({
    mutationFn: async (data: LoginDto) => {
      // POST /api/auth/login
      // Backend response: { success, data: { accessToken, user } }
      // refreshToken is set as httpOnly cookie — NOT returned in body.
      const loginRes = await authApi.login(data)
      const { accessToken, user } = loginRes.data.data

      // Store access token for the axios interceptor.
      localStorage.setItem('accessToken', accessToken)

      return { user, accessToken }
    },

    onSuccess: ({ user, accessToken }) => {
      // Update Zustand store (no refreshToken — it's a cookie).
      setAuth(user, accessToken)

      // If the user was redirected to login from a protected route, go back there.
      const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin')
      if (redirectAfterLogin) {
        sessionStorage.removeItem('redirectAfterLogin')
        navigate(redirectAfterLogin, { replace: true })
        return
      }

      // Otherwise navigate to the role-specific dashboard.
      navigate(roleRedirectMap[user.role] ?? '/customer/dashboard', { replace: true })
    },

    onError: (loginError: unknown) => {
      console.error('Login failed:', loginError)
    },
  })

  const errorMessage = (() => {
    if (!isError || !error) return null
    const err = error as { response?: { data?: { message?: string } } }
    return err.response?.data?.message || 'Login failed. Please try again.'
  })()

  return { login, isLoading: isPending, errorMessage }
}
