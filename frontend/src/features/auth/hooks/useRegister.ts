import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../../api/auth.api'
import { useAuthStore } from '../../../store/authStore'
import type { RegisterDto } from '../../../api/auth.api'

export const useRegister = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const { mutate: register, isPending, error, isError } = useMutation({
    mutationFn: async (data: RegisterDto) => {
      const registerRes = await authApi.register(data)
      const { accessToken, refreshToken } = registerRes.data.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)

      const meRes = await authApi.getMe()
      const user = meRes.data.data

      return { user, accessToken, refreshToken }
    },

    onSuccess: ({ user, accessToken, refreshToken }) => {
      setAuth(user, accessToken, refreshToken)
      navigate('/customer', { replace: true })
    },

    onError: (error: unknown) => {
      console.error('Register failed:', error)
    },
  })

  const errorMessage = (() => {
    if (!isError || !error) return null
    const err = error as { response?: { data?: { message?: string } } }
    return err.response?.data?.message || 'Registration failed. Please try again.'
  })()

  return { register, isLoading: isPending, errorMessage }
}
