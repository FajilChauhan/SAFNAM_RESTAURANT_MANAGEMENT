export type BookingStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";

export interface Floor {
  id: string;
  name: string;
  level: number;
}

export interface Table {
  id: string;
  floorId: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  x?: number;
  y?: number;
}

export interface Booking {
  id: string;
  customerId: string;
  tableId?: string;
  roomId?: string;
  floorId: string;
  date: string;
  timeSlot: string;
  status: BookingStatus;
  guests: number;
  notes?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
}
