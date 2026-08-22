import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import ReceptionDashboardPage from "../features/reception/pages/ReceptionDashboardPage";
import { createStaffFallbackRoute, createStaffManagementRoutes } from "./StaffManagementRoutes";

const ReceptionRoutes = () => (
  <ProtectedRoute allowedRoles={["RECEPTION"]}>
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<ReceptionDashboardPage />} />
        <Route path="dashboard" element={<Navigate to="/reception" replace />} />
        {createStaffManagementRoutes("RECEPTION")}
        {createStaffFallbackRoute("/reception")}
      </Route>
    </Routes>
  </ProtectedRoute>
);

export default ReceptionRoutes;
