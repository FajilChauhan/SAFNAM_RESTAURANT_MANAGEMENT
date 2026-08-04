import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { CustomerRoutes } from "./CustomerRoutes";
import { ReceptionRoutes } from "./ReceptionRoutes";
import { KitchenRoutes } from "./KitchenRoutes";
import { ManagerRoutes } from "./ManagerRoutes";
import { AdminRoutes } from "./AdminRoutes";
import { useAuth } from "@/hooks/useAuth";

const Placeholder = ({ title }: { title: string }) => <div className="p-6 text-slate-700 dark:text-slate-200">{title}</div>;

export function AppRouter() {
  const { user, isAuthenticated } = useAuth();

  const home = !isAuthenticated ? "/login" : user?.role === "CUSTOMER" ? "/customer" : user?.role === "RECEPTION" ? "/reception" : user?.role === "KITCHEN" ? "/kitchen" : user?.role === "MANAGER" ? "/manager" : "/admin";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={home} replace />} />
      <Route path="/login" element={<Placeholder title="Login Page" />} />
      <Route path="/register" element={<Placeholder title="Register Page" />} />
      <Route path="/unauthorized" element={<Placeholder title="Unauthorized Page" />} />
      <Route element={<ProtectedRoute allowedRoles={["CUSTOMER"]} />}>
        <Route path="/customer/*" element={<CustomerRoutes />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["RECEPTION"]} />}>
        <Route path="/reception/*" element={<ReceptionRoutes />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["KITCHEN"]} />}>
        <Route path="/kitchen/*" element={<KitchenRoutes />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} />}>
        <Route path="/manager/*" element={<ManagerRoutes />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Route>
    </Routes>
  );
}
