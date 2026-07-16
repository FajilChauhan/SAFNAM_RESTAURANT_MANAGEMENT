// Shared checkout response contracts keep controllers thin and future API docs stable.
export type CheckoutSummary = {
  checkoutNumber: string;
  bookingNumber: string;
  invoiceNumber: string;
  invoiceTotal: string;
  checkedOutAt: Date;
  customer: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
};
