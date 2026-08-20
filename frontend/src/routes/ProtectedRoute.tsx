import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
  requiredPermissions?: string[]
}

const ProtectedRoute = ({ children, allowedRoles, requiredPermissions = [] }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore()

  // Not logged in
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Wrong role
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requiredPermissions.length > 0) {
    const userPermissions = user.permissions ?? []
    const hasAllPermissions = requiredPermissions.every((permission) => userPermissions.includes(permission))
    if (!hasAllPermissions) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute
