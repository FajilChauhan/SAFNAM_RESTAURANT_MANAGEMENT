import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export const useAuthBootstrap = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  useEffect(() => {
    if (accessToken) localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  }, [accessToken, refreshToken]);

  return { isLoading: false };
};
