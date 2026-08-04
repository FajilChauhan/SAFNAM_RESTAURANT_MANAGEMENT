import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/auth.types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: Boolean(user && get().accessToken) }),
      setToken: (accessToken) => set({ accessToken, isAuthenticated: Boolean(accessToken && get().user) }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
      initialize: () => {
        const accessToken = localStorage.getItem("accessToken");
        const userRaw = localStorage.getItem("user");
        const user = userRaw ? (JSON.parse(userRaw) as User) : null;
        set({ accessToken, user, isAuthenticated: Boolean(accessToken && user) });
      },
    }),
    {
      name: "safnam-auth",
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => {
        if (state) state.initialize();
      },
    },
  ),
);
