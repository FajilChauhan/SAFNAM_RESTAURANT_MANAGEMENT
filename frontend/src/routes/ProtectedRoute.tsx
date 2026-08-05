import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore()

  // Debug log — remove after testing
  console.log('ProtectedRoute check:', {
    isAuthenticated,
    userRole: user?.role,
    allowedRoles,
    hasAccess: user ? allowedRoles.includes(user.role) : false
  })

  // Not logged in
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Wrong role
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
