import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import ReceptionDashboardPage from "../features/reception/pages/ReceptionDashboardPage";

const ReceptionRoutes = () => (
  <ProtectedRoute allowedRoles={["RECEPTION"]}>
    <Routes>
      <Route index element={<ReceptionDashboardPage />} />
      <Route path="bookings" element={<ReceptionDashboardPage />} />
      <Route path="walkin" element={<ReceptionDashboardPage />} />
      <Route path="checkin" element={<ReceptionDashboardPage />} />
      <Route path="checkout" element={<ReceptionDashboardPage />} />
      <Route path="tables" element={<ReceptionDashboardPage />} />
      <Route path="rooms" element={<ReceptionDashboardPage />} />
      <Route path="customers" element={<ReceptionDashboardPage />} />
      <Route path="payments" element={<ReceptionDashboardPage />} />
      <Route path="invoices" element={<ReceptionDashboardPage />} />
      <Route path="*" element={<Navigate to="/reception" replace />} />
    </Routes>
  </ProtectedRoute>
);

export default ReceptionRoutes;
