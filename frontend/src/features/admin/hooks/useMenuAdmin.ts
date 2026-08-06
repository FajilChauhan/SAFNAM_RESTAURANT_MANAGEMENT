import { useQuery } from "@tanstack/react-query";
import { menuApi } from "@/api/menu.api";

export function useMenuCategories() {
  return useQuery({
    queryKey: ["admin", "menu", "categories"],
    queryFn: async () => {
      const { data } = await menuApi.getCategories();
      return data.data as Array<{ id: string; name: string; description?: string; image?: string; isActive?: boolean }>;
    },
  });
}

export function useMenuItems() {
  return useQuery({
    queryKey: ["admin", "menu", "items"],
    queryFn: async () => {
      const { data } = await menuApi.getItems();
      return data.data as Array<{
        id: string;
        name: string;
        price: number;
        image?: string;
        isVeg?: boolean;
        prepTime?: number;
        isAvailable?: boolean;
        category?: { name: string };
      }>;
    },
  });
}
