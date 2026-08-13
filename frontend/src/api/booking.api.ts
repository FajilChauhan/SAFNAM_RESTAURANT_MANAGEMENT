import api from "./axios";

// ─── Enums ────────────────────────────────────────────────────────────────────
export type BookingType = "TABLE" | "ROOM";
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";
export type BookingSource = "CUSTOMER_APP" | "RECEPTION" | "ADMIN";

// ─── Related models ────────────────────────────────────────────────────────────
export type BookingCustomer = {
  id: string;
  fullName: string;
  phoneNumber?: string | null;
  email?: string | null;
};

export type BookingTable = {
  id: string;
  tableNumber: string;
  capacity: number;
  shape?: string;
  floor?: { id: string; name: string };
};

export type BookingRoom = {
  id: string;
  roomNumber: string;
  roomType: string;
  capacity: number;
  pricePerDay?: string | number;
  imageUrl?: string | null;
};

// ─── Booking record ────────────────────────────────────────────────────────────
export type Booking = {
  id: string;
  bookingNumber: string;
  bookingType: BookingType;
  status: BookingStatus;
  source: BookingSource;
  bookingDate: string; // ISO date
  startTime: string;   // "HH:mm"
  endTime: string;     // "HH:mm"
  startAt: string;     // ISO datetime
  endAt: string;       // ISO datetime
  members: number;
  notes?: string | null;
  cancelledAt?: string | null;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  noShowAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: BookingCustomer;
  table?: BookingTable | null;
  room?: BookingRoom | null;
};

// ─── Availability ─────────────────────────────────────────────────────────────
export type AvailabilityResult<T> = {
  resource: T;
  status: "AVAILABLE" | "RESERVED" | "BLOCKED";
  available: boolean;
  reason?: string;
};

export type TableAvailabilityResult = AvailabilityResult<BookingTable & { floor: { id: string; name: string; restaurant: object } }>;
export type RoomAvailabilityResult = AvailabilityResult<BookingRoom & { restaurant: object }>;

// ─── API params ───────────────────────────────────────────────────────────────
export type AvailabilityParams = {
  date: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  members: number;
  floorId?: string;
  restaurantId?: string;
};

export type CreateBookingPayload = {
  bookingType: BookingType;
  customerId: string;
  tableId?: string;
  roomId?: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  members: number;
  notes?: string;
  source: BookingSource;
};

export type UpdateBookingPayload = {
  tableId?: string;
  roomId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  members?: number;
  notes?: string;
  status?: BookingStatus;
};

export type BookingListParams = {
  customerId?: string;
  bookingType?: BookingType;
  status?: BookingStatus;
  source?: BookingSource;
  tableId?: string;
  roomId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

// ─── API ──────────────────────────────────────────────────────────────────────
export const bookingApi = {
  /** Get available tables for a given time window */
  getAvailableTables: (params: AvailabilityParams) =>
    api.get<{ success: true; data: { tables: TableAvailabilityResult[] } }>(
      "/api/bookings/available-tables",
      { params }
    ),

  /** Get available rooms for a given time window */
  getAvailableRooms: (params: AvailabilityParams) =>
    api.get<{ success: true; data: { rooms: RoomAvailabilityResult[] } }>(
      "/api/bookings/available-rooms",
      { params }
    ),

  /** Create a booking (table or room) */
  createBooking: (data: CreateBookingPayload) =>
    api.post<{ success: true; data: { booking: Booking } }>("/api/bookings", data),

  /** List bookings (paginated, filterable) */
  listBookings: (params?: BookingListParams) =>
    api.get<{ success: true; data: { bookings: Booking[] }; meta: { page: number; limit: number; total: number; totalPages: number } }>(
      "/api/bookings",
      { params }
    ),

  /** Get a single booking by ID */
  getBookingById: (id: string) =>
    api.get<{ success: true; data: { booking: Booking } }>(`/api/bookings/${id}`),

  /** Update a booking's details/status */
  updateBooking: (id: string, data: UpdateBookingPayload) =>
    api.patch<{ success: true; data: { booking: Booking } }>(`/api/bookings/${id}`, data),

  /** Cancel a booking */
  cancelBooking: (id: string) =>
    api.patch<{ success: true; data: { booking: Booking } }>(`/api/bookings/${id}/cancel`),

  /** Check in a booking */
  checkIn: (id: string) =>
    api.patch<{ success: true; data: { booking: Booking } }>(`/api/bookings/${id}/check-in`),

  /** Check out a booking */
  checkOut: (id: string) =>
    api.patch<{ success: true; data: { booking: Booking } }>(`/api/bookings/${id}/check-out`),
};
