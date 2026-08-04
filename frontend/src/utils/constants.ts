export const USER_ROLES = ["CUSTOMER", "RECEPTION", "KITCHEN", "MANAGER", "ADMIN"] as const;
export const ORDER_STATUSES = ["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"] as const;
export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"] as const;
export const TABLE_STATUSES = ["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"] as const;

export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    refreshToken: "/api/auth/refresh-token",
    logout: "/api/auth/logout",
    logoutAll: "/api/auth/logout-all",
    changePassword: "/api/auth/change-password",
    me: "/api/auth/me",
  },
  bookings: "/api/bookings",
  menu: "/api/menu",
  orders: "/api/orders",
  kitchen: "/api/kitchen",
  customer: "/api/customer",
  invoices: "/api/invoices",
  payments: "/api/payments",
  operations: "/api/operations",
  restaurant: "/api/restaurant",
  floor: "/api/floors",
  table: "/api/tables",
  room: "/api/rooms",
} as const;
