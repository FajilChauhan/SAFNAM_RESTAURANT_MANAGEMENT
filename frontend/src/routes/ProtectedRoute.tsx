import { Navigate, Outlet } from "react-router-dom";
import type { UserRole } from "@/types/common.types";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user) return <Navigate to="/unauthorized" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}
