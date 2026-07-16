import type {
  FoodType,
  MenuAvailabilityType,
  MenuEntityStatus,
  SpicyLevel,
} from "@prisma/client";

export type CreateCategoryDto = {
  restaurantId: string;
  name: string;
  description?: string;
  displayOrder?: number;
  status?: MenuEntityStatus;
  imageUrl?: string;
};

export type UpdateCategoryDto = Partial<Omit<CreateCategoryDto, "restaurantId">>;

export type CreateMenuItemDto = {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  preparationTimeMin: number;
  imageUrl?: string;
  foodType: FoodType;
  spicyLevel?: SpicyLevel;
  status?: MenuEntityStatus;
  isTodaySpecial?: boolean;
  isAvailable?: boolean;
};

export type UpdateMenuItemDto = Partial<CreateMenuItemDto>;

export type CreateVariantDto = {
  menuItemId: string;
  name: string;
  priceDifference?: number;
  status?: MenuEntityStatus;
};

export type UpdateVariantDto = Partial<Omit<CreateVariantDto, "menuItemId">>;

export type CreateAddOnDto = {
  menuItemId: string;
  name: string;
  additionalPrice: number;
  status?: MenuEntityStatus;
};

export type UpdateAddOnDto = Partial<Omit<CreateAddOnDto, "menuItemId">>;

export type CreateAvailabilityDto = {
  menuItemId: string;
  type: MenuAvailabilityType;
  startTime?: string;
  endTime?: string;
};

export type UpdateAvailabilityDto = Partial<CreateAvailabilityDto>;
