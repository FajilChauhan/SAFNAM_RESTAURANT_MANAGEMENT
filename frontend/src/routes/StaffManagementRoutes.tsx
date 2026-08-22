import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import type { UserRole } from "@/types/auth.types";
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

type StaffRoute = {
  path: string;
  permission: string;
  element: JSX.Element;
};

const staffRoutes: StaffRoute[] = [
  { path: "orders", permission: "operations.orders.view", element: <OrderManagementPage /> },
  { path: "menu", permission: "operations.menu.view", element: <MenuItemsPage /> },
  { path: "menu/items", permission: "operations.menu.view", element: <MenuItemsPage /> },
  { path: "categories", permission: "operations.categories.view", element: <MenuCategoriesPage /> },
  { path: "menu/categories", permission: "operations.categories.view", element: <MenuCategoriesPage /> },
  { path: "tables", permission: "operations.tables.view", element: <TablesPage /> },
  { path: "floors", permission: "operations.floors.view", element: <FloorsPage /> },
  { path: "rooms", permission: "operations.rooms.view", element: <RoomsPage /> },
  { path: "bookings", permission: "operations.bookings.view", element: <BookingsPage /> },
  { path: "customers", permission: "operations.customers.view", element: <CustomersPage /> },
  { path: "offers", permission: "operations.offers.view", element: <OffersPage /> },
  { path: "reports", permission: "operations.reports.view", element: <ReportsPage /> },
  { path: "notifications", permission: "operations.notifications.view", element: <NotificationsPage /> },
  { path: "employees", permission: "operations.employees.view", element: <EmployeesPage /> },
  { path: "roles", permission: "operations.roles.view", element: <RolesPage /> },
  { path: "permissions", permission: "operations.permissions.manage", element: <PermissionsPage /> },
  { path: "audit-logs", permission: "operations.audit-logs.view", element: <AuditLogsPage /> },
  { path: "settings", permission: "operations.settings.view", element: <RestaurantSettingsPage /> },
];

export function createStaffManagementRoutes(allowedRole: Extract<UserRole, "MANAGER" | "RECEPTION" | "KITCHEN">) {
  return staffRoutes.map((route) => (
    <Route
      key={route.path}
      path={route.path}
      element={
        <ProtectedRoute allowedRoles={[allowedRole]} requiredPermissions={[route.permission]}>
          {route.element}
        </ProtectedRoute>
      }
    />
  ));
}

export function createStaffFallbackRoute(basePath: "/manager" | "/reception" | "/kitchen") {
  return <Route path="*" element={<Navigate to={basePath} replace />} />;
}
