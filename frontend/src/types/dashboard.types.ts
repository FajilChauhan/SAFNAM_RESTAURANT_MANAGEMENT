export type DashboardStatus = string;

export interface DashboardMeta {
  restaurantName: string;
  generatedAt: string;
  quickActions?: string[];
}

export interface CartItem {
  id: string;
  menuItemId?: string;
  name?: string;
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  status?: DashboardStatus;
  total?: number;
  totalSnapshot?: number;
  confirmedAt?: string;
  itemCount?: number;
  kitchenStatus?: string;
  priority?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  status?: DashboardStatus;
  grandTotal?: number;
  paidAmount?: number;
  balanceAmount?: number;
  generatedAt?: string;
}

export interface Booking {
  id: string;
  bookingNumber?: string;
  bookingType?: "TABLE" | "ROOM";
  type?: "TABLE" | "ROOM";
  customerName?: string;
  phoneNumber?: string;
  bookingDate?: string;
  startAt?: string;
  startTime?: string;
  endTime?: string;
  timeSlot?: string;
  members?: number;
  guests?: number;
  status?: DashboardStatus;
  tableNumber?: string;
  roomNumber?: string;
  checkedInAt?: string;
}

export interface MenuItem {
  id?: string;
  menuItemId?: string;
  name: string;
  quantity?: number;
  orderCount?: number;
  revenue?: number;
  categoryName?: string;
  status?: string;
  isAvailable?: boolean;
}

export interface Offer {
  id: string;
  title: string;
  description?: string;
  code?: string;
  type?: string;
  discountType?: string;
  discountValue?: number;
  minSpend?: number;
  maxDiscount?: number;
  endsAt?: string;
}

export interface Reward {
  id: string;
  rewardCode: string;
  discountType?: string;
  discountValue?: number;
  expiresAt?: string;
}

export interface Notification {
  id: string;
  type?: string;
  title: string;
  message?: string;
  readAt?: string | null;
  createdAt?: string;
}

export interface Feedback {
  id: string;
  customerName?: string;
  foodRating?: number;
  serviceRating?: number;
  comments?: string;
  createdAt?: string;
}

export interface Customer {
  id: string;
  fullName?: string;
  name?: string;
  phoneNumber?: string;
  bookingNumber?: string;
  bookingType?: string;
  tableNumber?: string;
  roomNumber?: string;
  checkedInAt?: string;
}

export interface Table {
  id: string;
  tableNumber: string;
  status: string;
  capacity?: number;
  floor?: { name?: string };
}

export interface Room {
  id: string;
  roomNumber: string;
  roomType?: string;
  status: string;
  capacity?: number;
}

export interface Payment {
  id: string;
  paymentNumber?: string;
  amount?: number;
  method?: string;
  status?: string;
  paidAt?: string;
}

export interface Activity {
  type: string;
  title?: string;
  status?: string;
  createdAt?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export type HourStat = ChartDataPoint;
export type CategoryStat = ChartDataPoint;

export interface TopFood {
  menuItemId?: string;
  name: string;
  quantity?: number;
  revenue?: number;
}

export interface TopCategory {
  categoryId?: string;
  name: string;
  quantity?: number;
  revenue?: number;
}

export interface KitchenOrder extends Order {
  orderId?: string;
  orderNumber?: string;
  tableNumber?: string;
  roomNumber?: string;
  customerName?: string;
  queuedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  readyAt?: string;
  servedAt?: string;
}

export interface CustomerDashboard extends DashboardMeta {
  user: {
    id: string;
    name: string;
    email: string | null;
    visitCount: number;
    totalSpending: number;
    leaderboardPosition: number;
    rewardPoints: number;
    loyaltyStatus: string;
  };
  currentBooking: Booking | null;
  currentCart: {
    items: CartItem[];
    itemCount?: number;
    totalItems?: number;
    total?: number;
    totalAmount?: number;
  } | null;
  activeOrders: Order[];
  currentInvoice: Invoice | null;
  paymentStatus: string | Record<string, unknown> | null;
  bookingHistory: Booking[];
  recentOrders: Order[];
  favouriteFoods: MenuItem[];
  availableOffers: Offer[];
  rewards: Reward[];
  notifications: Notification[];
  recentFeedback: Feedback[];
}

export interface ReceptionDashboard extends DashboardMeta {
  stats: {
    todayBookings: number;
    todayWalkIns: number;
    todayCheckIns: number;
    todayCheckouts: number;
    occupiedTables: number;
    availableTables: number;
    reservedTables: number;
    cleaningTables: number;
    occupiedRooms: number;
    availableRooms: number;
    pendingPayments: number;
    pendingInvoices: number;
    currentCustomers: number;
  };
  todayBookings: Booking[];
  todaysWalkIns?: Booking[];
  todaysCheckIns?: Booking[];
  todaysCheckouts?: Booking[];
  currentCustomers: Customer[];
  recentActivities: Activity[];
  tableStatus: Table[];
  roomStatus: Room[];
  pendingPaymentsList: Payment[];
  pendingInvoices?: Invoice[];
}

export interface KitchenDashboard extends DashboardMeta {
  stats: {
    pendingOrders: number;
    acceptedOrders: number;
    preparingOrders: number;
    readyOrders: number;
    servedOrders: number;
    priorityOrders: number;
    todayOrders: number;
    avgPreparationTime: number;
  };
  pendingOrders: KitchenOrder[];
  acceptedOrders: KitchenOrder[];
  preparingOrders: KitchenOrder[];
  readyOrders: KitchenOrder[];
  servedOrders: KitchenOrder[];
  kitchenQueue: KitchenOrder[];
  priorityOrders: KitchenOrder[];
  recentlyServed: KitchenOrder[];
  kitchenStatistics: {
    byHour: HourStat[];
    avgTimeByCategory: CategoryStat[];
  } & Record<string, unknown>;
}

export interface ManagerDashboard extends DashboardMeta {
  stats: {
    todayRevenue: number;
    monthlyRevenue: number;
    todayOrders: number;
    todayBookings: number;
    todayCustomers: number;
    occupiedTables: number;
    occupiedRooms: number;
    totalTables?: number;
    totalRooms?: number;
    kitchenQueueCount: number;
    pendingPayments: number;
    pendingInvoices?: number;
    revenueChange: number;
    ordersChange: number;
    customersChange: number;
    totalCustomers?: number;
  };
  topSellingFoods: TopFood[];
  topCategories: TopCategory[];
  customerStatistics?: Record<string, unknown>;
  recentOrders: Order[];
  recentBookings: Booking[];
  recentPayments: Payment[];
  recentFeedback: Feedback[];
  currentOffers: Offer[];
  lowAvailabilityMenuItems?: MenuItem[];
  revenueChart: ChartDataPoint[];
  ordersChart: ChartDataPoint[];
  orderBreakdown?: ChartDataPoint[];
  tableUtilization: number;
  roomUtilization: number;
}

export interface Employee {
  id: string;
  fullName: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  updatedAt?: string;
}

export interface RestaurantSettings {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency?: string;
  timezone?: string;
  openingTime?: string;
  closingTime?: string;
  gstNumber?: string;
}

export interface AuditLog {
  id: string;
  action?: string;
  createdAt?: string;
}

export interface AdminDashboard extends ManagerDashboard {
  employeeStats: {
    total: number;
    managers: number;
    reception: number;
    kitchen: number;
    recentlyAdded: Employee[];
  };
  systemHealth: {
    status: "healthy" | "warning" | "critical";
    dbStatus: string;
    uptime: string;
    lastBackup: string;
    details?: Record<string, unknown>;
  };
  auditLogs: AuditLog[];
  restaurantSettings: RestaurantSettings | null;
  userStatistics: Record<string, unknown>;
  databaseHealth?: Record<string, unknown>;
}
