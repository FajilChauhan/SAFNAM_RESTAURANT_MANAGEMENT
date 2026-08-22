import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import ManagerDashboardPage from "../features/manager/pages/ManagerDashboardPage";
import { createStaffFallbackRoute, createStaffManagementRoutes } from "./StaffManagementRoutes";

const ManagerRoutes = () => (
  <ProtectedRoute allowedRoles={["MANAGER"]}>
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<ManagerDashboardPage />} />
        <Route path="dashboard" element={<Navigate to="/manager" replace />} />
        {createStaffManagementRoutes("MANAGER")}
        {createStaffFallbackRoute("/manager")}
      </Route>
    </Routes>
  </ProtectedRoute>
);

export default ManagerRoutes;
