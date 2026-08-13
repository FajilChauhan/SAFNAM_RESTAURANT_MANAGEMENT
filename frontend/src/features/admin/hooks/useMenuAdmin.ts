import { useQuery } from "@tanstack/react-query";
import { menuApi } from "@/api/menu.api";

export function useMenuCategories() {
  return useQuery({
    queryKey: ["admin", "menu", "categories"],
    queryFn: async () => {
      const { data } = await menuApi.getCategories();
      return data.data.categories as Array<{ id: string; name: string; description?: string; imageUrl?: string; status?: string; displayOrder?: number }>;
    },
  });
}

export function useMenuItems() {
  return useQuery({
    queryKey: ["admin", "menu", "items"],
    queryFn: async () => {
      const { data } = await menuApi.getItems();
      return data.data.items as Array<{
        id: string;
        name: string;
        price: number;
        imageUrl?: string;
        foodType?: string;
        preparationTimeMin?: number;
        isAvailable?: boolean;
        status?: string;
        isTodaySpecial?: boolean;
        category?: { name: string };
      }>;
    },
  });
}
