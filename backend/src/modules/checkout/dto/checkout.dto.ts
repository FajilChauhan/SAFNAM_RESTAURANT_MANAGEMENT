// DTOs keep checkout request shapes explicit before service-level business rules run.
export type CheckoutBookingDto = {
  bookingId: string;
};

export type CheckoutHistoryQueryDto = {
  customerId?: string;
};
