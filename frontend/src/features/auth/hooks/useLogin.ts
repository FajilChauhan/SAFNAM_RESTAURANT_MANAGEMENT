import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../../api/auth.api'
import type { LoginDto } from '../../../api/auth.api'
import { useAuthStore } from '../../../store/authStore'

const roleRedirectMap: Record<string, string> = {
  CUSTOMER: '/customer',
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
      const loginRes = await authApi.login(data)
      const { accessToken, refreshToken } = loginRes.data.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)

      const meRes = await authApi.getMe()
      const user = meRes.data.data

      return { user, accessToken, refreshToken }
    },
    onSuccess: ({ user, accessToken, refreshToken }) => {
      setAuth(user, accessToken, refreshToken)

      const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin')
      if (redirectAfterLogin) {
        sessionStorage.removeItem('redirectAfterLogin')
        navigate(redirectAfterLogin, { replace: true })
        return
      }

      navigate(roleRedirectMap[user.role] ?? '/customer', { replace: true })
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
