export const SINGLE_RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

export const SINGLE_RESTAURANT_DEFAULTS = {
  id: SINGLE_RESTAURANT_ID,
  name: "SAFNAM Restaurant",
  phone: "9999999999",
  email: "hello@safnam.local",
  address: "SAFNAM Restaurant",
  description: "SAFNAM Restaurant configuration",
  openingTime: "08:00",
  closingTime: "23:00",
  currency: "INR",
  timezone: "Asia/Kolkata",
} as const;
