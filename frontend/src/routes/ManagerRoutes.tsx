import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import ManagerDashboardPage from "../features/manager/pages/ManagerDashboardPage";
import MenuItemsPage from "../features/admin/pages/MenuItemsPage";
import MenuCategoriesPage from "../features/admin/pages/MenuCategoriesPage";
import TablesPage from "../features/admin/pages/TablesPage";
import RoomsPage from "../features/admin/pages/RoomsPage";
import BookingsPage from "../features/admin/pages/BookingsPage";
import CustomersPage from "../features/admin/pages/CustomersPage";
import OffersPage from "../features/admin/pages/OffersPage";
import ReportsPage from "../features/admin/pages/ReportsPage";

const ManagerRoutes = () => (
  <ProtectedRoute allowedRoles={["MANAGER"]}>
    <Routes>
      <Route index element={<ManagerDashboardPage />} />
      <Route path="menu/items" element={<MenuItemsPage />} />
      <Route path="menu/categories" element={<MenuCategoriesPage />} />
      <Route path="tables" element={<TablesPage />} />
      <Route path="rooms" element={<RoomsPage />} />
      <Route path="orders" element={<Navigate to="/manager" replace />} />
      <Route path="bookings" element={<BookingsPage />} />
      <Route path="customers" element={<CustomersPage />} />
      <Route path="offers" element={<OffersPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="*" element={<Navigate to="/manager" replace />} />
    </Routes>
  </ProtectedRoute>
);

export default ManagerRoutes;
