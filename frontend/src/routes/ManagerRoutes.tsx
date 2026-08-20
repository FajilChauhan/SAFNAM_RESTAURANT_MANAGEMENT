import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import ManagerDashboardPage from "../features/manager/pages/ManagerDashboardPage";
import MenuItemsPage from "../features/admin/pages/MenuItemsPage";
import MenuCategoriesPage from "../features/admin/pages/MenuCategoriesPage";
import TablesPage from "../features/admin/pages/TablesPage";
import FloorsPage from "../features/admin/pages/FloorsPage";
import RoomsPage from "../features/admin/pages/RoomsPage";
import BookingsPage from "../features/admin/pages/BookingsPage";
import CustomersPage from "../features/admin/pages/CustomersPage";
import OffersPage from "../features/admin/pages/OffersPage";
import ReportsPage from "../features/admin/pages/ReportsPage";
import NotificationsPage from "../features/admin/pages/NotificationsPage";
import AuditLogsPage from "../features/admin/pages/AuditLogsPage";
import EmployeesPage from "../features/admin/pages/EmployeesPage";
import RolesPage from "../features/admin/pages/RolesPage";
import PermissionsPage from "../features/admin/pages/PermissionsPage";
import RestaurantSettingsPage from "../features/admin/pages/RestaurantSettingsPage";
import OrderManagementPage from "../features/admin/pages/OrderManagementPage";

const ManagerRoutes = () => (
  <ProtectedRoute allowedRoles={["MANAGER"]}>
    <Routes>
      <Route element={<AdminLayout />}>
        {/* Dashboard — always accessible; page renders only permitted widgets */}
        <Route index element={<ManagerDashboardPage />} />
        {/* Orders */}
        <Route
          path="orders"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]} requiredPermissions={["operations.orders.view"]}>
              <OrderManagementPage />
            </ProtectedRoute>
          }
        />
        {/* Menu Items */}
        <Route
          path="menu/items"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]} requiredPermissions={["operations.menu.view"]}>
              <MenuItemsPage />
            </ProtectedRoute>
          }
        />
        {/* Menu Categories */}
        <Route
          path="menu/categories"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]} requiredPermissions={["operations.categories.view"]}>
              <MenuCategoriesPage />
            </ProtectedRoute>
          }
        />
        {/* Tables */}
        <Route
          path="tables"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]} requiredPermissions={["operations.tables.view"]}>
              <TablesPage />
            </ProtectedRoute>
          }
        />
        {/* Floors */}
        <Route
          path="floors"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]} requiredPermissions={["operations.floors.view"]}>
              <FloorsPage />
            </ProtectedRoute>
          }
        />
        {/* Rooms */}
        <Route
          path="rooms"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]} requiredPermissions={["operations.rooms.view"]}>
              <RoomsPage />
            </ProtectedRoute>
          }
        />
        {/* Bookings */}
        <Route
          path="bookings"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]} requiredPermissions={["operations.bookings.view"]}>
              <BookingsPage />
            </ProtectedRoute>
          }
        />
        {/* Customers */}
        <Route
          path="customers"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]} requiredPermissions={["operations.customers.view"]}>
              <CustomersPage />
            </ProtectedRoute>
          }
        />
        {/* Offers */}
        <Route
          path="offers"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]} requiredPermissions={["operations.offers.view"]}>
              <OffersPage />
            </ProtectedRoute>
          }
        />
        {/* Reports */}
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]} requiredPermissions={["operations.reports.view"]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        {/* Notifications */}
        <Route
          path="notifications"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]} requiredPermissions={["operations.notifications.view"]}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        {/* Employees */}
        <Route
          path="employees"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]} requiredPermissions={["operations.employees.view"]}>
              <EmployeesPage />
            </ProtectedRoute>
          }
        />
        {/* Roles */}
        <Route
          path="roles"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]} requiredPermissions={["operations.roles.view"]}>
              <RolesPage />
            </ProtectedRoute>
          }
        />
        {/* Permissions */}
        <Route
          path="permissions"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]} requiredPermissions={["operations.permissions.manage"]}>
              <PermissionsPage />
            </ProtectedRoute>
          }
        />
        {/* Audit Logs */}
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]} requiredPermissions={["operations.audit-logs.view"]}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        {/* Settings */}
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]} requiredPermissions={["operations.settings.view"]}>
              <RestaurantSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/manager" replace />} />
      </Route>
    </Routes>
  </ProtectedRoute>
);

export default ManagerRoutes;
