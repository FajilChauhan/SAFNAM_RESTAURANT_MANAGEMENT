import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import ReceptionDashboardPage from "../features/reception/pages/ReceptionDashboardPage";
import BookingsPage from "../features/admin/pages/BookingsPage";
import OrderManagementPage from "../features/admin/pages/OrderManagementPage";
import TablesPage from "../features/admin/pages/TablesPage";
import RoomsPage from "../features/admin/pages/RoomsPage";
import CustomersPage from "../features/admin/pages/CustomersPage";

const ReceptionRoutes = () => (
  <ProtectedRoute allowedRoles={["RECEPTION"]}>
    <Routes>
      <Route element={<AdminLayout />}>
        {/* Reception Dashboard */}
        <Route index element={<ReceptionDashboardPage />} />
        
        {/* Bookings */}
        <Route
          path="bookings"
          element={
            <ProtectedRoute allowedRoles={["RECEPTION"]} requiredPermissions={["operations.bookings.view"]}>
              <BookingsPage />
            </ProtectedRoute>
          }
        />

        {/* Orders */}
        <Route
          path="orders"
          element={
            <ProtectedRoute allowedRoles={["RECEPTION"]} requiredPermissions={["operations.orders.view"]}>
              <OrderManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Tables */}
        <Route
          path="tables"
          element={
            <ProtectedRoute allowedRoles={["RECEPTION"]} requiredPermissions={["operations.tables.view"]}>
              <TablesPage />
            </ProtectedRoute>
          }
        />

        {/* Rooms */}
        <Route
          path="rooms"
          element={
            <ProtectedRoute allowedRoles={["RECEPTION"]} requiredPermissions={["operations.rooms.view"]}>
              <RoomsPage />
            </ProtectedRoute>
          }
        />

        {/* Customers */}
        <Route
          path="customers"
          element={
            <ProtectedRoute allowedRoles={["RECEPTION"]} requiredPermissions={["operations.customers.view"]}>
              <CustomersPage />
            </ProtectedRoute>
          }
        />

        {/* Walk-in, Check-in, Checkout, Payments, Invoices currently route to Reception Dashboard */}
        <Route path="walkin" element={<ReceptionDashboardPage />} />
        <Route path="checkin" element={<ReceptionDashboardPage />} />
        <Route path="checkout" element={<ReceptionDashboardPage />} />
        <Route path="payments" element={<ReceptionDashboardPage />} />
        <Route path="invoices" element={<ReceptionDashboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/reception" replace />} />
    </Routes>
  </ProtectedRoute>
);

export default ReceptionRoutes;
