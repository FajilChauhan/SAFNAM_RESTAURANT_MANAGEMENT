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

const AppRouter = () => {
  const { isAuthenticated, user } = useAuthStore();
  const roleMap: Record<string, string> = {
    CUSTOMER: "/customer",
    RECEPTION: "/reception",
    KITCHEN: "/kitchen",
    MANAGER: "/manager",
    ADMIN: "/admin",
  };
  const home = !isAuthenticated || !user ? "/customer" : roleMap[user.role] ?? "/customer";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={home} replace />} />
      <Route path="/customer" element={<CustomerHomePage />} />
      <Route path="/customer/*" element={<CustomerRoutes />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/manager/*" element={<ManagerRoutes />} />
      <Route path="/kitchen/*" element={<KitchenRoutes />} />
      <Route path="/reception/*" element={<ReceptionRoutes />} />
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
};

export default AppRouter;
