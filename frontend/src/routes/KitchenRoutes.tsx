import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import KitchenDashboardPage from "../features/kitchen/pages/KitchenDashboardPage";

const KitchenRoutes = () => (
  <ProtectedRoute allowedRoles={["KITCHEN"]}>
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<KitchenDashboardPage />} />
        <Route
          path="orders"
          element={
            <ProtectedRoute allowedRoles={["KITCHEN"]} requiredPermissions={["operations.orders.view"]}>
              <KitchenDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="history"
          element={
            <ProtectedRoute allowedRoles={["KITCHEN"]} requiredPermissions={["operations.orders.view"]}>
              <KitchenDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="stats" element={<Navigate to="/kitchen" replace />} />
        <Route path="dashboard" element={<Navigate to="/kitchen" replace />} />
        <Route path="*" element={<Navigate to="/kitchen" replace />} />
      </Route>
    </Routes>
  </ProtectedRoute>
);

export default KitchenRoutes;
