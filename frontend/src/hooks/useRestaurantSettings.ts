import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { restaurantApi } from "@/api/restaurant.api";

export type RestaurantSettings = {
  id?: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  phone: string;
  email: string | null;
  address: string;
  openingTime: string;
  closingTime: string;
  gstNumber?: string | null;
  currency: string;
  timezone: string;
};

const DEFAULT_SETTINGS: RestaurantSettings = {
  name: "SAFNAM Restaurant",
  logoUrl: null,
  description: "Premium dining, warm hospitality, real SAFNAM experiences.",
  phone: "9999999999",
  email: "hello@safnam.local",
  address: "SAFNAM Restaurant",
  openingTime: "08:00",
  closingTime: "23:00",
  currency: "INR",
  timezone: "Asia/Kolkata",
};

export const restaurantSettingsQueryKey = ["restaurant"] as const;

export function useRestaurantSettings() {
  const query = useQuery({
    queryKey: restaurantSettingsQueryKey,
    queryFn: async () => (await restaurantApi.getInfo()).data.data.restaurant as RestaurantSettings,
    staleTime: 60_000,
  });

  const settings = useMemo(
    () => ({
      ...DEFAULT_SETTINGS,
      ...(query.data ?? {}),
    }),
    [query.data],
  );

  return {
    ...query,
    settings,
  };
}

export function resolveImageUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}

export function formatOperatingHours(settings: Pick<RestaurantSettings, "openingTime" | "closingTime">) {
  return `${settings.openingTime} - ${settings.closingTime}`;
}
