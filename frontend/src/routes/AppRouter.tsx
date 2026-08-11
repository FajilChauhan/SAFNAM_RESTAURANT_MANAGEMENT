import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import UnauthorizedPage from "../features/auth/pages/UnauthorizedPage";
import CustomerHomePage from "../features/customer/pages/CustomerHomePage";
import CustomerRoutes from "./CustomerRoutes";
import AdminRoutes from "./AdminRoutes";
import ManagerRoutes from "./ManagerRoutes";
import KitchenRoutes from "./KitchenRoutes";
import ReceptionRoutes from "./ReceptionRoutes";

// Role → first authenticated landing route.
const roleHomeMap: Record<string, string> = {
  CUSTOMER: "/customer/dashboard",
  RECEPTION: "/reception",
  KITCHEN: "/kitchen",
  MANAGER: "/manager",
  ADMIN: "/admin",
};

const AppRouter = () => {
  const { isAuthenticated, user } = useAuthStore();

  // Determine where authenticated users land.
  const authenticatedHome = isAuthenticated && user
    ? (roleHomeMap[user.role] ?? "/customer/dashboard")
    : null;

  return (
    <Routes>
      {/* Public root — show the SAFNAM public landing page when not logged in */}
      <Route
        path="/"
        element={
          authenticatedHome
            ? <Navigate to={authenticatedHome} replace />
            : <CustomerHomePage />
        }
      />

      {/* Public customer-facing landing / home page */}
      <Route path="/customer" element={<CustomerHomePage />} />

      {/* Customer authenticated routes (includes /customer/dashboard) */}
      <Route path="/customer/*" element={<CustomerRoutes />} />

      {/* Auth pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Staff / admin routes — each is protected by role inside */}
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/manager/*" element={<ManagerRoutes />} />
      <Route path="/kitchen/*" element={<KitchenRoutes />} />
      <Route path="/reception/*" element={<ReceptionRoutes />} />

      {/* Catch-all: send authenticated users to their dashboard, others to home */}
      <Route
        path="*"
        element={
          authenticatedHome
            ? <Navigate to={authenticatedHome} replace />
            : <Navigate to="/" replace />
        }
      />
    </Routes>
  );
};

export default AppRouter;
