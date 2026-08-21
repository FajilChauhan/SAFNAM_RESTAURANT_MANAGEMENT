import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ChefHat, ClipboardList, History, BarChart3, LogOut, Activity } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";

const kitchenNav = [
  { label: "Queue", to: "/kitchen", icon: ChefHat, end: true },
  { label: "Orders", to: "/kitchen/orders", icon: ClipboardList, end: false },
  { label: "History", to: "/kitchen/history", icon: History, end: false },
  { label: "Stats", to: "/kitchen/stats", icon: BarChart3, end: false },
];

export function KitchenLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 flex flex-col flex-shrink-0 border-r border-gray-800">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <ChefHat size={16} className="text-white" />
            </div>
            <div>
              <p className="text-amber-400 font-bold text-base leading-none">SAFNAM</p>
              <p className="text-gray-500 text-[10px] mt-0.5">Kitchen Station</p>
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <div className="px-4 py-2 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live · Auto-refresh 5s
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {kitchenNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )
              }
            >
              <item.icon size={18} className="flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() ?? "K"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name ?? "Kitchen"}</p>
              <p className="text-xs text-gray-400">Chef</p>
            </div>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="text-gray-400 hover:text-white transition-colors p-1"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Dark header */}
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-orange-400" />
            <span className="text-white font-semibold text-sm">Kitchen Queue Board</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>SAFNAM Restaurant</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
