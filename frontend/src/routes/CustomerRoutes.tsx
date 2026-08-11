import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import CustomerDashboardPage from "../features/customer/pages/CustomerDashboardPage";
import CustomerPlaceholderPage from "../features/customer/pages/CustomerPlaceholderPage";

const CustomerRoutes = () => {
  return (
    <Routes>
      {/* ── Public customer routes (no login required) ─────────────────── */}
      <Route path="gallery" element={<CustomerPlaceholderPage title="Gallery" />} />
      <Route path="offers" element={<CustomerPlaceholderPage title="Offers" />} />

      {/* ── Authenticated customer routes ───────────────────────────────── */}
      <Route
        path="dashboard"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <CustomerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="book-table"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <CustomerPlaceholderPage title="Book Table" />
          </ProtectedRoute>
        }
      />
      <Route
        path="book-room"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <CustomerPlaceholderPage title="Book Room" />
          </ProtectedRoute>
        }
      />
      <Route
        path="bookings"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <CustomerPlaceholderPage title="Booking History" />
          </ProtectedRoute>
        }
      />
      <Route
        path="menu"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <CustomerPlaceholderPage title="Menu" />
          </ProtectedRoute>
        }
      />
      <Route
        path="cart"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <CustomerPlaceholderPage title="Cart" />
          </ProtectedRoute>
        }
      />
      <Route
        path="orders"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <CustomerPlaceholderPage title="Orders" />
          </ProtectedRoute>
        }
      />
      <Route
        path="profile"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <CustomerPlaceholderPage title="Profile" />
          </ProtectedRoute>
        }
      />
      <Route
        path="notifications"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <CustomerPlaceholderPage title="Notifications" />
          </ProtectedRoute>
        }
      />
      <Route
        path="games"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <CustomerPlaceholderPage title="Games" />
          </ProtectedRoute>
        }
      />
      <Route
        path="invoice/:id"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <CustomerPlaceholderPage title="Invoice" />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/customer" replace />} />
    </Routes>
  );
};

export default CustomerRoutes;
