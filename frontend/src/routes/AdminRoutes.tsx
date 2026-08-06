import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage";
import EmployeesPage from "../features/admin/pages/EmployeesPage";
import MenuCategoriesPage from "../features/admin/pages/MenuCategoriesPage";
import MenuItemsPage from "../features/admin/pages/MenuItemsPage";
import TablesPage from "../features/admin/pages/TablesPage";
import FloorsPage from "../features/admin/pages/FloorsPage";
import RoomsPage from "../features/admin/pages/RoomsPage";
import BookingsPage from "../features/admin/pages/BookingsPage";
import CustomersPage from "../features/admin/pages/CustomersPage";
import OffersPage from "../features/admin/pages/OffersPage";
import RestaurantSettingsPage from "../features/admin/pages/RestaurantSettingsPage";
import ReportsPage from "../features/admin/pages/ReportsPage";
import NotificationsPage from "../features/admin/pages/NotificationsPage";

const AdminRoutes = () => (
  <ProtectedRoute allowedRoles={["ADMIN"]}>
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="menu/categories" element={<MenuCategoriesPage />} />
        <Route path="menu/items" element={<MenuItemsPage />} />
        <Route path="tables" element={<TablesPage />} />
        <Route path="floors" element={<FloorsPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="settings" element={<RestaurantSettingsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  </ProtectedRoute>
);

export default AdminRoutes;
