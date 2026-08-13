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
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";
import { Avatar } from "@/components/ui";
import { restaurantApi } from "@/api/restaurant.api";
import { adminApi } from "@/api/admin.api";

type NavItem = {
  label: string;
  to: string;
  icon: ReactNode;
};

const navGroups: Array<{ title: string; items: NavItem[] }> = [
  { title: "Overview", items: [{ label: "Dashboard", to: "/admin", icon: <LayoutDashboard size={18} /> }] },
  {
    title: "Management",
    items: [
      { label: "Employees", to: "/admin/employees", icon: <Users size={18} /> },
      { label: "Customers", to: "/admin/customers", icon: <UserCheck size={18} /> },
      { label: "Bookings", to: "/admin/bookings", icon: <CalendarDays size={18} /> },
    ],
  },
  {
    title: "Restaurant",
    items: [
      { label: "Menu Items", to: "/admin/menu", icon: <UtensilsCrossed size={18} /> },
      { label: "Categories", to: "/admin/categories", icon: <Tag size={18} /> },
      { label: "Tables", to: "/admin/tables", icon: <Grid3X3 size={18} /> },
      { label: "Floors", to: "/admin/floors", icon: <Layers size={18} /> },
      { label: "Rooms", to: "/admin/rooms", icon: <BedDouble size={18} /> },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "Offers", to: "/admin/offers", icon: <Percent size={18} /> },
      { label: "Reports", to: "/admin/reports", icon: <BarChart3 size={18} /> },
      { label: "Notifications", to: "/admin/notifications", icon: <Bell size={18} /> },
      { label: "Roles", to: "/admin/roles", icon: <Shield size={18} /> },
      { label: "Permissions", to: "/admin/permissions", icon: <Shield size={18} /> },
      { label: "Audit Logs", to: "/admin/audit-logs", icon: <ScrollText size={18} /> },
      { label: "Settings", to: "/admin/settings", icon: <Settings size={18} /> },
    ],
  },
];

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/employees": "Employees",
  "/admin/menu": "Menu Items",
  "/admin/categories": "Menu Categories",
  "/admin/tables": "Tables",
  "/admin/floors": "Floors",
  "/admin/rooms": "Rooms",
  "/admin/bookings": "Bookings",
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
  const restaurantQuery = useQuery({ queryKey: ["restaurant"], queryFn: async () => (await restaurantApi.getInfo()).data.data.restaurant });
  const notificationsQuery = useQuery({ queryKey: ["admin", "layout-notifications"], queryFn: async () => (await adminApi.auditLogs({ limit: 5 })).data.data.audit.activities });

  const title = useMemo(() => pageTitles[location.pathname] ?? "Dashboard", [location.pathname]);
  const restaurantName = restaurantQuery.data?.name ?? "SAFNAM Restaurant";
  const notificationCount = notificationsQuery.data?.length ?? 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className={cn("sticky top-0 flex h-screen flex-col bg-gray-900 text-white transition-all duration-300", collapsed ? "w-16" : "w-64")}>
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className={cn("transition-all", collapsed && "opacity-0")}>
            <div className="font-display text-xl font-bold text-amber-400">SAFNAM</div>
            <div className="text-xs text-slate-400">Admin Panel</div>
          </div>
          <button type="button" onClick={() => setCollapsed((value) => !value)} className="rounded-xl p-2 text-gray-300 hover:bg-white/10">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div className="admin-sidebar-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {navGroups.map((group) => (
              <div key={group.title}>
                <div className={cn("mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500", collapsed && "hidden")}>
                  {group.title}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white",
                          isActive && "border-r-2 border-emerald-500 bg-emerald-600/20 text-white",
                          collapsed && "justify-center px-0",
                        )
                      }
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!collapsed ? <span>{item.label}</span> : null}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cn("shrink-0 border-t border-white/10 bg-gray-900 p-4", collapsed && "p-2")}>
          <div className={cn("mb-3 flex items-center gap-3 rounded-2xl bg-white/5 p-3", collapsed && "justify-center")}>
            <Avatar name={user?.name ?? "Administrator"} />
            {!collapsed ? (
              <div>
                <div className="text-sm font-semibold">{user?.name ?? "Administrator"}</div>
                <div className="text-xs text-gray-400">Administrator</div>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className={cn("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white", collapsed && "justify-center px-0")}
          >
            <LogOut size={18} />
            {!collapsed ? "Logout" : null}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            <p className="text-xs text-gray-400">SAFNAM Restaurant</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/admin/notifications")}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-600"
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">{user?.name?.charAt(0)}</span>
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
