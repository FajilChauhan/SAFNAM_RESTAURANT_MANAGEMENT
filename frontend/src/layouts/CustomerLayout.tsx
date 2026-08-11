import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LayoutDashboard, LogOut, Menu, ShoppingCart, UtensilsCrossed, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";

const navItems = [
  { label: "Home", to: "/customer" },
  { label: "Menu", to: "/customer/menu" },
  { label: "Offers", to: "/customer/offers" },
  { label: "Gallery", to: "/customer/gallery" },
  { label: "About", to: "/customer#about" },
] as const;

const mobileProtectedItems = [
  { label: "Dashboard", to: "/customer/dashboard" },
  { label: "Bookings", to: "/customer/bookings" },
  { label: "Orders", to: "/customer/orders" },
  { label: "Cart", to: "/customer/cart" },
  { label: "Profile", to: "/customer/profile" },
] as const;

export function CustomerLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
  }, []);

  const handleBookTable = () => {
    if (!isAuthenticated) {
      sessionStorage.setItem("redirectAfterLogin", "/customer/book-table");
      navigate("/login");
      return;
    }

    navigate("/customer/book-table");
  };

  const handleBookRoom = () => {
    if (!isAuthenticated) {
      sessionStorage.setItem("redirectAfterLogin", "/customer/book-room");
      navigate("/login");
      return;
    }

    navigate("/customer/book-room");
  };

  const avatarLabel = user?.name?.slice(0, 2)?.toUpperCase() ?? "SA";

  return (
    <div className="min-h-screen bg-surface text-slate-900 dark:bg-dark dark:text-slate-100">
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-dark/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/customer" className="flex items-center gap-2 font-display text-xl font-bold text-emerald-700">
            <UtensilsCrossed className="h-5 w-5 text-amber-500" />
            SAFNAM
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "border-b-2 border-transparent py-1 text-sm font-medium text-gray-600 transition-colors hover:text-emerald-700",
                    isActive && "border-emerald-700 text-emerald-700",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {!isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="rounded-xl border border-emerald-700 px-4 py-2 text-sm text-emerald-700 transition-colors hover:bg-emerald-50"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={handleBookTable}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-500/30 transition-colors hover:bg-amber-600"
                >
                  Book Table
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => navigate("/customer/dashboard")} className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10" aria-label="Dashboard">
                  <LayoutDashboard className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => navigate("/customer/cart")} className="relative rounded-xl p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10" aria-label="Cart">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                    0
                  </span>
                </button>
                <button type="button" onClick={() => navigate("/customer/notifications")} className="relative rounded-xl p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    0
                  </span>
                </button>
                <div className="group relative">
                  <button type="button" className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-gray-100 dark:hover:bg-white/10">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-700 text-sm font-semibold text-white">
                      {avatarLabel}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>
                  <div className="invisible absolute right-0 top-full mt-2 w-56 rounded-2xl border border-gray-100 bg-white p-2 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 dark:border-white/10 dark:bg-gray-900">
                    <button
                      type="button"
                      onClick={() => navigate("/customer/profile")}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                      My Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/customer/bookings")}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                      My Bookings
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/customer/orders")}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                      My Orders
                    </button>
                    <div className="my-2 h-px bg-gray-100 dark:bg-white/10" />
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        navigate("/customer");
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <button type="button" className="rounded-xl p-2 md:hidden" onClick={() => setIsOpen(true)}>
            <Menu className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </nav>

      <div className="h-16" />
      <main>{children}</main>

      {isOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/40 md:hidden" onClick={() => setIsOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-[82%] max-w-sm bg-white p-4 shadow-2xl dark:bg-gray-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-display text-lg font-bold text-emerald-700">
                <UtensilsCrossed className="h-5 w-5 text-amber-500" />
                SAFNAM
              </span>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-xl p-2">
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>
            <div className="mt-6 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-xl px-3 py-3 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {item.label}
                </NavLink>
              ))}
              {isAuthenticated ? (
                <>
                  <div className="my-3 h-px bg-gray-100 dark:bg-white/10" />
                  {mobileProtectedItems.map((item) => (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      onClick={() => setIsOpen(false)}
                      className="block rounded-xl px-3 py-3 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                      {item.label}
                    </NavLink>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                      navigate("/customer");
                    }}
                    className="block w-full rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </>
              ) : null}
            </div>
            <div className="mt-6 space-y-3">
              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/login");
                  }}
                  className="w-full rounded-xl border border-emerald-700 px-4 py-3 text-sm font-semibold text-emerald-700"
                >
                  Sign In
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  handleBookTable();
                }}
                className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white"
              >
                Book Table
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  handleBookRoom();
                }}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700"
              >
                Book Room
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
