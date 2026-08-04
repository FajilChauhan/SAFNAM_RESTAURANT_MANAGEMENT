import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Bell, Menu, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-slate-900 dark:bg-dark dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-dark/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="font-display text-2xl text-primary-700">SAFNAM</Link>
          <nav className="hidden gap-6 md:flex">
            <Link to="/customer/home">Home</Link>
            <Link to="/customer/menu">Menu</Link>
            <Link to="/customer/bookings/current">Booking</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" leftIcon={<ShoppingCart size={16} />}>Cart</Button>
            <Button variant="ghost" size="sm" leftIcon={<Bell size={16} />} />
            <Button variant="ghost" size="sm" leftIcon={<Menu size={16} />} className="md:hidden" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4">{children}</main>
    </div>
  );
}
