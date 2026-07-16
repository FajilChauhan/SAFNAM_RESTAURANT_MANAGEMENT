import type { Restaurant } from "@prisma/client";

export type CreateRestaurantDto = {
  name: string;
  logoUrl?: string;
  description?: string;
  phone: string;
  email?: string;
  address: string;
  openingTime: string;
  closingTime: string;
  gstNumber?: string;
  currency: string;
  timezone: string;
};

export type UpdateRestaurantDto = Partial<CreateRestaurantDto>;

export type RestaurantResponseDto = Restaurant;
