import { useMemo, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BarChart3,
  BedDouble,
  CalendarDays,
  Grid3X3,
  LayoutDashboard,
  Layers,
  LogOut,
  Percent,
  Settings,
  Tag,
  UserCheck,
  Users,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
  Shield,
  ScrollText,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";
import { Avatar } from "@/components/ui";
import { adminApi } from "@/api/admin.api";
import { useRestaurantSettings, resolveImageUrl } from "@/hooks/useRestaurantSettings";
import { usePermissionsRefresh } from "@/hooks/usePermissionsRefresh";

// permission: null means "always visible regardless of permissions"
type NavItem = {
  label: string;
  to: string;
  icon: ReactNode;
  permission: string | null;
};

// ─── Navigation config — single source of truth ───────────────────────────────
// "permission: null" items are always visible (e.g. Dashboard landing page).
// All other items are shown only when the user holds that exact permission key.
const navGroups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Overview",
    items: [
      // Dashboard is always visible — it renders only the widgets the user is permitted to see
      { label: "Dashboard", to: "/admin", icon: <LayoutDashboard size={18} />, permission: null },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Employees",  to: "/admin/employees", icon: <Users size={18} />,       permission: "operations.employees.view" },
      { label: "Customers",  to: "/admin/customers", icon: <UserCheck size={18} />,   permission: "operations.customers.view" },
      { label: "Bookings",   to: "/admin/bookings",  icon: <CalendarDays size={18} />, permission: "operations.bookings.view" },
      { label: "Orders",     to: "/admin/orders",    icon: <ScrollText size={18} />,   permission: "operations.orders.view" },
    ],
  },
  {
    title: "Restaurant",
    items: [
      { label: "Menu Items", to: "/admin/menu/items",       icon: <UtensilsCrossed size={18} />, permission: "operations.menu.view" },
      { label: "Categories", to: "/admin/menu/categories", icon: <Tag size={18} />,              permission: "operations.categories.view" },
      { label: "Tables",     to: "/admin/tables",     icon: <Grid3X3 size={18} />,          permission: "operations.tables.view" },
      { label: "Floors",     to: "/admin/floors",     icon: <Layers size={18} />,           permission: "operations.floors.view" },
      { label: "Rooms",      to: "/admin/rooms",      icon: <BedDouble size={18} />,        permission: "operations.rooms.view" },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "Offers",        to: "/admin/offers",        icon: <Percent size={18} />,    permission: "operations.offers.view" },
      { label: "Reports",       to: "/admin/reports",       icon: <BarChart3 size={18} />,  permission: "operations.reports.view" },
      { label: "Notifications", to: "/admin/notifications", icon: <Bell size={18} />,       permission: "operations.notifications.view" },
      { label: "Roles",         to: "/admin/roles",         icon: <Shield size={18} />,     permission: "operations.roles.view" },
      { label: "Permissions",   to: "/admin/permissions",   icon: <Shield size={18} />,     permission: "operations.permissions.manage" },
      { label: "Audit Logs",    to: "/admin/audit-logs",    icon: <ScrollText size={18} />, permission: "operations.audit-logs.view" },
      { label: "Settings",      to: "/admin/settings",      icon: <Settings size={18} />,   permission: "operations.settings.view" },
    ],
  },
];

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/manager": "Dashboard",
  "/admin/employees": "Employees",
  "/admin/menu": "Menu Items",
  "/admin/menu/items": "Menu Items",
  "/admin/categories": "Menu Categories",
  "/admin/menu/categories": "Menu Categories",
  "/admin/tables": "Tables",
  "/admin/floors": "Floors",
  "/admin/rooms": "Rooms",
  "/admin/bookings": "Bookings",
  "/admin/orders": "Orders",
  "/manager/orders": "Orders",
  "/admin/customers": "Customers",
  "/admin/offers": "Offers",
  "/admin/settings": "Restaurant Settings",
  "/admin/reports": "Reports",
  "/admin/notifications": "Notifications",
  "/admin/roles": "Roles",
  "/admin/permissions": "Permissions",
  "/admin/audit-logs": "Audit Logs",
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Centralized restaurant settings — no hardcoded branding
  const { settings } = useRestaurantSettings();
  // Auto-refresh user+permissions from /api/auth/me every 60s
  // so Admin permission changes propagate without requiring a logout
  usePermissionsRefresh();

  const notificationsQuery = useQuery({
    queryKey: ["admin", "layout-notifications"],
    queryFn: async () => (await adminApi.auditLogs({ limit: 5 })).data.data.audit.activities,
    retry: false,
  });

  // Normalise pathname: /manager/xxx or /kitchen/xxx → /admin/xxx for title lookup
  const normalizedPathname = useMemo(
    () => location.pathname.replace(/^\/(manager|reception|kitchen)/, "/admin"),
    [location.pathname],
  );
  const pageTitle = useMemo(() => pageTitles[normalizedPathname] ?? "Dashboard", [normalizedPathname]);

  const restaurantName = settings.name;
  const logoUrl = resolveImageUrl(settings.logoUrl);
  const notificationCount = notificationsQuery.data?.length ?? 0;

  const isAdmin = user?.role === "ADMIN";
  const userPermissions = useMemo(() => user?.permissions ?? [], [user]);
  const prefix = user?.role === "ADMIN" ? "/admin" : user?.role === "MANAGER" ? "/manager" : user?.role === "KITCHEN" ? "/kitchen" : "/reception";

  // ── Dynamic sidebar ────────────────────────────────────────────────────────
  // ADMIN: bypass permission filtering — show every group.
  // Manager / other staff: filter by their actual permission set.
  // Groups with zero visible items are entirely hidden.
  const visibleNavGroups = useMemo(() => {
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items
          .filter((item) => {
            if (isAdmin) return true; // Admin always sees everything
            if (item.permission === null) return true; // Dashboard always visible
            return userPermissions.includes(item.permission);
          })
          .map((item) => ({
            ...item,
            to: item.to.replace(/^\/admin/, prefix),
          })),
      }))
      .filter((group) => group.items.length > 0);
  }, [isAdmin, userPermissions, prefix]);

  const SidebarContent = (
    <>
      {/* Brand header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <div className={cn("flex min-w-0 items-center gap-2 transition-all", collapsed && "opacity-0 pointer-events-none")}>
          {logoUrl ? (
            <img src={logoUrl} alt={restaurantName} className="h-8 w-8 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600">
              <UtensilsCrossed size={16} className="text-white" />
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-bold text-white">{restaurantName}</div>
            <div className="text-[10px] text-slate-400">
              {user?.role === "ADMIN" ? "Admin Panel" : user?.role === "MANAGER" ? "Manager Panel" : user?.role === "KITCHEN" ? "Kitchen Panel" : "Reception Panel"}
            </div>
          </div>
        </div>
        {/* Desktop collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="hidden shrink-0 rounded-xl p-2 text-gray-300 hover:bg-white/10 lg:flex"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        {/* Mobile close */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="shrink-0 rounded-xl p-2 text-gray-300 hover:bg-white/10 lg:hidden"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Nav groups */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {visibleNavGroups.map((group) => (
            <div key={group.title}>
              <div className={cn("mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500", collapsed && "hidden")}>
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === prefix || item.to === "/admin" || item.to === "/manager"}
                    title={collapsed ? item.label : undefined}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white",
                        isActive && "border-r-2 border-emerald-500 bg-emerald-600/20 text-white",
                        collapsed && "justify-center px-0",
                      )
                    }
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User + Logout */}
      <div className={cn("shrink-0 border-t border-white/10 bg-gray-900 p-4", collapsed && "p-2")}>
        <div className={cn("mb-3 flex items-center gap-3 rounded-2xl bg-white/5 p-3", collapsed && "justify-center")}>
          <Avatar name={user?.name ?? "User"} />
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{user?.name ?? "User"}</div>
              <div className="text-xs text-gray-400">
                {user?.role === "ADMIN" ? "Administrator" : user?.role === "MANAGER" ? "Manager" : user?.role === "KITCHEN" ? "Kitchen Staff" : "Receptionist"}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => { logout(); navigate("/login"); }}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut size={18} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Desktop Sidebar ────────────────────────────────────────────── */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen flex-col bg-gray-900 text-white transition-all duration-300 lg:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {SidebarContent}
      </aside>

      {/* ── Mobile Sidebar Overlay ─────────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative flex w-64 flex-col bg-gray-900 text-white">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* ── Main area ─────────────────────────────────────────────────── */}
      <div className="flex min-h-screen flex-1 flex-col bg-gray-50">
        {/* Top header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
          {/* Mobile sidebar toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              <ChevronRight size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{pageTitle}</h1>
              <p className="hidden text-xs text-gray-400 sm:block">{restaurantName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell — only if permitted */}
            {(isAdmin || userPermissions.includes("operations.notifications.view")) && (
              <button
                type="button"
                onClick={() => navigate(`${prefix}/notifications`)}
                className="relative rounded-xl p-2 text-gray-600 transition-all hover:bg-gray-100"
              >
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                    {notificationCount}
                  </span>
                )}
              </button>
            )}
            {/* Avatar chip */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                <span className="text-sm font-bold text-white">{user?.name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <span className="hidden text-sm font-medium text-gray-700 sm:block">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
