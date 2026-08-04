// Customer platform DTOs describe customer-facing actions over existing ERP flows.
import type { BookingType, DiscountType, OrderSource, PaymentMethod } from "@prisma/client";

export type CustomerBookingDto = {
  bookingType: BookingType;
  tableId?: string;
  roomId?: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  members: number;
  notes?: string;
};

export type CustomerRescheduleDto = Partial<Pick<CustomerBookingDto, "tableId" | "roomId" | "date" | "startTime" | "endTime" | "durationMinutes" | "members" | "notes">>;

export type CustomerAddCartItemDto = {
  bookingId: string;
  menuItemId: string;
  variantId?: string;
  addOnIds?: string[];
  quantity: number;
  specialNotes?: string;
};

export type CustomerConfirmOrderDto = {
  bookingId: string;
  source: OrderSource;
};

export type CustomerPaymentDto = {
  invoiceId: string;
  method: PaymentMethod;
  amount: number;
  transactionId?: string;
  referenceNumber?: string;
  remarks?: string;
};

export type CustomerFeedbackDto = {
  foodRating: number;
  serviceRating: number;
  imageUrls?: string[];
  comments?: string;
};

export type CustomerRewardConfig = {
  discountType: DiscountType;
  discountValue: number;
};
