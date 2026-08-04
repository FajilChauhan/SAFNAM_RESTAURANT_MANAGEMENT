export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  itemCount: number;
  isActive: boolean;
}

export interface Variant {
  id: string;
  name: string;
  price: number;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  isVeg: boolean;
  prepTime: number;
  isAvailable: boolean;
  isFeatured: boolean;
  variants?: Variant[];
  addons?: Addon[];
}
