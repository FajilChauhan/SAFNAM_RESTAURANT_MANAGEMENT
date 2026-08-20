/**
 * usePermissionsRefresh
 *
 * Periodically fetches GET /api/auth/me to pick up the latest permissions
 * from PostgreSQL. This ensures that when an Admin removes/adds a permission
 * for a role, the logged-in Manager (or any other staff) sees the change
 * within the configured interval without needing to log out and log back in.
 *
 * Behavior:
 * - Runs only when the user is authenticated.
 * - Fetches on mount (immediately after first render).
 * - Re-fetches every REFRESH_INTERVAL_MS milliseconds.
 * - Updates authStore.user so the entire app reacts.
 * - On 401 / network error: silently ignores (the axios interceptor handles 401).
 */
import { useEffect, useRef } from "react";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";

const REFRESH_INTERVAL_MS = 60_000; // refresh every 60 seconds

export function usePermissionsRefresh() {
  const { isAuthenticated, setUser } = useAuthStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    try {
      const res = await authApi.getMe();
      const freshUser = res.data?.data?.user;
      if (freshUser) {
        setUser(freshUser);
      }
    } catch {
      // Silently ignore — 401 is handled globally by the axios interceptor
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch immediately on mount
    void refresh();

    // Then refresh on an interval
    intervalRef.current = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return { refresh };
}
