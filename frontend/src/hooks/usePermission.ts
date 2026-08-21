/**
 * usePermission
 *
 * Thin wrapper around the existing authStore that exposes:
 *  - Role booleans (isAdmin, isManager, isReception, isKitchen, isCustomer)
 *  - can.* helpers matching the existing operations.* permission key format
 *
 * DO NOT duplicate permission logic — this calls authStore.hasPermission()
 * which already handles the Admin bypass (Admin always returns true).
 */
import { useAuthStore } from '../store/authStore';

export const usePermission = () => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, user } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isReception = user?.role === 'RECEPTION';
  const isKitchen = user?.role === 'KITCHEN';
  const isCustomer = user?.role === 'CUSTOMER';

  const can = {
    // Orders
    viewOrders: () => isAdmin || hasPermission('operations.orders.view'),
    createOrders: () => isAdmin || hasPermission('operations.orders.create'),
    editOrders: () => isAdmin || hasPermission('operations.orders.edit'),
    cancelOrders: () => isAdmin || hasPermission('operations.orders.cancel'),
    // Bookings
    viewBookings: () => isAdmin || hasPermission('operations.bookings.view'),
    createBookings: () => isAdmin || hasPermission('operations.bookings.create'),
    editBookings: () => isAdmin || hasPermission('operations.bookings.edit'),
    cancelBookings: () => isAdmin || hasPermission('operations.bookings.cancel'),
    // Tables
    viewTables: () => isAdmin || hasPermission('operations.tables.view'),
    manageTables: () => isAdmin || hasPermission('operations.tables.create'),
    // Floors
    viewFloors: () => isAdmin || hasPermission('operations.floors.view'),
    manageFloors: () => isAdmin || hasPermission('operations.floors.create'),
    // Rooms
    viewRooms: () => isAdmin || hasPermission('operations.rooms.view'),
    manageRooms: () => isAdmin || hasPermission('operations.rooms.create'),
    // Menu
    viewMenu: () => isAdmin || hasPermission('operations.menu.view'),
    manageMenu: () => isAdmin || hasPermission('operations.menu.create'),
    // Categories
    viewCategories: () => isAdmin || hasPermission('operations.categories.view'),
    manageCategories: () => isAdmin || hasPermission('operations.categories.create'),
    // Customers
    viewCustomers: () => isAdmin || hasPermission('operations.customers.view'),
    // Employees
    viewEmployees: () => isAdmin || hasPermission('operations.employees.view'),
    // Offers
    viewOffers: () => isAdmin || hasPermission('operations.offers.view'),
    manageOffers: () => isAdmin || hasPermission('operations.offers.create'),
    // Reports
    viewReports: () => isAdmin || hasPermission('operations.reports.view'),
    // Kitchen
    viewKitchen: () => isAdmin || hasPermission('operations.kitchen.view'),
    updateKitchen: () => isAdmin || hasPermission('operations.kitchen.update'),
    // Payments
    viewPayments: () => isAdmin || hasPermission('operations.payments.view'),
    createPayments: () => isAdmin || hasPermission('operations.payments.create'),
    // Invoices
    viewInvoices: () => isAdmin || hasPermission('operations.invoices.view'),
    createInvoices: () => isAdmin || hasPermission('operations.invoices.create'),
    // Admin-only
    viewRoles: () => isAdmin || hasPermission('operations.roles.view'),
    managePermissions: () => isAdmin || hasPermission('operations.permissions.manage'),
    viewAuditLogs: () => isAdmin || hasPermission('operations.audit-logs.view'),
    viewSettings: () => isAdmin || hasPermission('operations.settings.view'),
    viewNotifications: () => isAdmin || hasPermission('operations.notifications.view'),
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, isManager, isReception, isKitchen, isCustomer, can };
};
