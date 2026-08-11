import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import KitchenDashboardPage from "../features/kitchen/pages/KitchenDashboardPage";

const KitchenRoutes = () => (
  <ProtectedRoute allowedRoles={["KITCHEN"]}>
    <Routes>
      <Route index element={<KitchenDashboardPage />} />
      <Route path="orders" element={<KitchenDashboardPage />} />
      <Route path="history" element={<KitchenDashboardPage />} />
      <Route path="stats" element={<KitchenDashboardPage />} />
      <Route path="*" element={<Navigate to="/kitchen" replace />} />
    </Routes>
  </ProtectedRoute>
);

export default KitchenRoutes;
