import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../../api/auth.api'
import type { RegisterDto } from '../../../api/auth.api'

// Backend POST /api/auth/register
// Response: { success, data: { user } }  (201 Created)
// Does NOT issue tokens — user must log in after registration.

export const useRegister = () => {
  const navigate = useNavigate()

  const { mutate: register, isPending, error, isError } = useMutation({
    mutationFn: async (data: RegisterDto) => {
      const res = await authApi.register(data)
      // Backend returns { success, data: { user } }
      return res.data.data.user
    },

    onSuccess: () => {
      // After registration, redirect to login.
      // The user must authenticate to receive tokens.
      navigate('/login', { replace: true })
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
