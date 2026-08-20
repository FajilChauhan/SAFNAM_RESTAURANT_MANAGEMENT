import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { Link } from "react-router-dom";
import { useRestaurantSettings, resolveImageUrl } from "@/hooks/useRestaurantSettings";

const highlights = [
  { label: "Book tables and rooms" },
  { label: "Track orders and invoices" },
  { label: "Access exclusive rewards" },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  const { settings } = useRestaurantSettings();
  const logoUrl = resolveImageUrl(settings.logoUrl);

  return (
    <div className="min-h-screen bg-white text-slate-900 lg:grid lg:grid-cols-[1fr_500px]">
      <div className="relative hidden overflow-hidden lg:block">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200")' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
        />
        {/* Side gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.2) 100%)' }}
        />
        {/* Bottom gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }}
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/customer" className="flex items-center gap-2 text-amber-400 font-bold text-2xl tracking-widest">
            {logoUrl ? (
              <img src={logoUrl} alt={settings.name} className="h-8 w-8 rounded-lg object-cover" />
            ) : null}
            {settings.name}
          </Link>
          <div className="max-w-xl space-y-4">
            <h1
              className="text-white font-bold text-4xl leading-tight"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}
            >
              Where Every Meal Tells a Story
            </h1>
            <p
              className="text-amber-300 font-medium text-lg mt-2"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
            >
              {settings.name} — Premium Dining Experience
            </p>
          </div>
          <div className="grid gap-4">
            {highlights.map((item, index) => {
              const icons = [CalendarDays, UtensilsCrossed, ShieldCheck];
              const Icon = icons[index] ?? ShieldCheck;
              return (
                <motion.div
                  key={item.label}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 w-fit"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.15, duration: 0.4 }}
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                    <Icon className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="text-white font-semibold text-sm">{item.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 text-center lg:hidden">
            <Link to="/customer" className="inline-flex items-center gap-2 font-display text-3xl font-bold text-slate-900">
              {logoUrl ? (
                <img src={logoUrl} alt={settings.name} className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <UtensilsCrossed className="h-7 w-7 text-amber-500" />
              )}
              {settings.name}
            </Link>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
