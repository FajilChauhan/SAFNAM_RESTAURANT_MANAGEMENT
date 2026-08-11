import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export const useAuthBootstrap = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (accessToken) localStorage.setItem("accessToken", accessToken);
  }, [accessToken]);

  return { isLoading: false };
};
