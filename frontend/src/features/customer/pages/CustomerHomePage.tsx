import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BedDouble, CalendarDays, ChefHat, Clock3, Image, MapPin, MessageSquare, Phone, Star, UtensilsCrossed } from "lucide-react";
import { customerApi } from "@/api/customer.api";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { useAuthStore } from "@/store/authStore";
import { useRestaurantSettings, resolveImageUrl } from "@/hooks/useRestaurantSettings";

type RestaurantInfo = {
  name?: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  openingTime?: string | null;
  closingTime?: string | null;
};

type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price?: string | number;
  category?: { name?: string };
  isTodaySpecial?: boolean;
};

type Offer = {
  id: string;
  title: string;
  description?: string | null;
  code?: string | null;
  discountType?: string;
  discountValue?: string | number;
  endsAt?: string;
};

type LeaderboardCustomer = {
  id: string;
  fullName: string;
  visitCount: number;
  avatarUrl?: string | null;
};

type HomePayload = {
  heroBanner?: RestaurantInfo | null;
  todaysSpecials?: MenuItem[];
  todaysOffers?: Offer[];
  topFoods?: Array<{ menuItemId?: string; itemNameSnapshot?: string; _sum?: { quantity?: number | null } }>;
  bestCustomers?: LeaderboardCustomer[];
  gallery?: string[];
  aboutRestaurant?: RestaurantInfo | null;
  chef?: Array<{ id?: string; name: string; designation?: string; imageUrl?: string }> | null;
  contact?: RestaurantInfo | null;
};

const heroImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600";

export default function CustomerHomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { settings } = useRestaurantSettings();
  const logoUrl = resolveImageUrl(settings.logoUrl);

  const homeQuery = useQuery<HomePayload>({
    queryKey: ["customer-home"],
    queryFn: async () => (await customerApi.home()).data.data.home as HomePayload,
  });

  const menuQuery = useQuery<{ categories: Array<{ id: string; name: string }>; items: MenuItem[] }>({
    queryKey: ["customer-menu"],
    queryFn: async () => (await customerApi.menu()).data.data as { categories: Array<{ id: string; name: string }>; items: MenuItem[] },
  });

  const home = homeQuery.data;
  const specials = home?.todaysSpecials ?? [];
  const offers = home?.todaysOffers ?? [];
  const gallery = home?.gallery ?? [];
  const chefs = home?.chef ?? [];
  const menuItems = menuQuery.data?.items ?? [];
  const menuGroups = useMemo(() => {
    const names = ["Breakfast", "Lunch", "Dinner"];
    return names.map((name) => ({
      name,
      items: menuItems.filter((item) => item.category?.name?.toLowerCase() === name.toLowerCase()).slice(0, 4),
    }));
  }, [menuItems]);

  const protectedNavigate = (path: string) => {
    if (!isAuthenticated) {
      sessionStorage.setItem("redirectAfterLogin", path);
      navigate("/login");
      return;
    }

    navigate(path);
  };

  return (
    <CustomerLayout>
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${heroImage}")` }} />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center px-4 py-20 text-center">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-full bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-100">
            Welcome to {settings.name}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-5xl font-bold leading-tight text-white md:text-7xl">
            {settings.name}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-6 max-w-2xl text-lg leading-8 text-gray-100">
            {settings.description ?? "A premium dining experience built around warm hospitality, fresh flavours, and memorable moments."}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-10 flex flex-wrap justify-center gap-4">
            <button type="button" onClick={() => protectedNavigate("/customer/book-table")} className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-7 py-4 font-semibold text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600">
              <CalendarDays className="h-5 w-5" />
              Book Table
            </button>
            <button type="button" onClick={() => protectedNavigate("/customer/book-room")} className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-7 py-4 font-semibold text-white backdrop-blur hover:bg-white/25">
              <BedDouble className="h-5 w-5" />
              Book Room
            </button>
            <Link to="/customer/menu" className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-semibold text-emerald-800 hover:bg-gray-100">
              <UtensilsCrossed className="h-5 w-5" />
              View Menu
            </Link>
          </motion.div>
        </div>
      </section>

      <main className="bg-gray-50 text-gray-900">
        <Section eyebrow="Today's Special" title="Fresh from the kitchen">
          {specials.length ? (
            <div className="grid gap-6 md:grid-cols-3">
              {specials.slice(0, 6).map((item) => <FoodCard key={item.id} item={item} special />)}
            </div>
          ) : (
            <EmptyState title="No specials published today" description="Today's special dishes will appear here when the kitchen marks menu items as today's specials." />
          )}
        </Section>

        <Section eyebrow="Today's Menu" title="Breakfast, lunch and dinner">
          <div className="grid gap-6 lg:grid-cols-3">
            {menuGroups.map((group) => (
              <div key={group.name} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                <div className="mt-4 space-y-3">
                  {group.items.length ? group.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                      <span className="text-sm font-bold text-emerald-700">{formatPrice(item.price)}</span>
                    </div>
                  )) : <p className="text-sm text-gray-500">No {group.name.toLowerCase()} items available yet.</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section eyebrow={`About ${settings.name}`} title="A restaurant made for memorable dining">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="leading-7 text-gray-600">
                {settings.description ?? "A restaurant that brings together thoughtful service, comfortable dining, and carefully prepared food for guests who want a relaxed premium experience."}
              </p>
              <button type="button" onClick={() => protectedNavigate("/customer/book-table")} className="mt-6 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">
                Reserve Your Table
              </button>
            </div>
            <div className="grid gap-3">
              <Info icon={<MapPin className="h-5 w-5" />} label={settings.address || "Address will be updated soon"} />
              <Info icon={<Phone className="h-5 w-5" />} label={settings.phone || "Phone will be updated soon"} />
              <Info icon={<Clock3 className="h-5 w-5" />} label={`${settings.openingTime} - ${settings.closingTime}`} />
            </div>
          </div>
        </Section>

        <Section eyebrow="Our Chefs" title="The people behind the plate">
          {chefs.length ? (
            <div className="grid gap-6 md:grid-cols-3">
              {chefs.map((chef) => (
                <div key={chef.id ?? chef.name} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  {chef.imageUrl ? <img src={chef.imageUrl} alt={chef.name} className="h-48 w-full rounded-xl object-cover" /> : null}
                  <h3 className="mt-4 font-bold text-gray-900">{chef.name}</h3>
                  <p className="text-sm text-gray-500">{chef.designation ?? "Culinary team"}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<ChefHat className="h-8 w-8" />} title="Chef profiles coming soon" description="Chef profile data has not been published yet." />
          )}
        </Section>

        <Section eyebrow="Gallery" title="A glimpse of our restaurant">
          {gallery.length ? (
            <div className="grid auto-rows-[180px] grid-cols-2 gap-3 md:grid-cols-4">
              {gallery.map((image) => <img key={image} src={image} alt="Restaurant gallery" className="h-full w-full rounded-2xl object-cover" />)}
            </div>
          ) : (
            <EmptyState icon={<Image className="h-8 w-8" />} title="Gallery coming soon" description="Restaurant, food and interior photos will appear here when gallery data is available." />
          )}
        </Section>

        <Section eyebrow="Customer Reviews" title="What Our Customers Say">
          <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="Be the first to share your experience" description="A public reviews API is not available yet, so no guest reviews are displayed." />
        </Section>

        <Section eyebrow="Leaderboard" title="Top guests">
          {home?.bestCustomers?.length ? (
            <div className="grid gap-4 md:grid-cols-3">
              {home.bestCustomers.slice(0, 3).map((customer, index) => (
                <div key={customer.id} className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-100 font-bold text-amber-700">#{index + 1}</div>
                  <h3 className="mt-3 font-bold text-gray-900">{customer.fullName}</h3>
                  <p className="text-sm text-gray-500">{customer.visitCount} visits</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Leaderboard is waiting for visits" description="Top customers will appear here after real visits are recorded." />
          )}
        </Section>

        <Section eyebrow="Offers" title="Current offers">
          {offers.length ? (
            <div className="grid gap-6 md:grid-cols-3">
              {offers.map((offer) => (
                <div key={offer.id} className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Offer</span>
                  <h3 className="mt-4 text-xl font-bold text-gray-900">{offer.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{offer.description ?? "Special offer."}</p>
                  <p className="mt-4 text-sm font-semibold text-emerald-700">{offer.code ? `Code: ${offer.code}` : formatDiscount(offer)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No active offers today" description="Available offers will appear here." />
          )}
        </Section>
      </main>

      <footer className="bg-gray-950 py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={settings.name} className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500">
                  <UtensilsCrossed className="h-5 w-5 text-white" />
                </div>
              )}
              <h2 className="text-xl font-bold text-amber-400">{settings.name}</h2>
            </div>
            <p className="mt-2 text-sm text-gray-400">{settings.description ?? "Premium dining, warm hospitality, memorable experiences."}</p>
          </div>
          <FooterLinks title="Explore" items={["About", "Menu", "Offers", "Gallery"]} />
          <FooterLinks title="Reserve" items={["Book Table", "Book Room", "Complaint / Suggestion"]} />
          <div>
            <h3 className="font-semibold">Contact</h3>
            <div className="mt-3 space-y-2 text-sm text-gray-400">
              <p>{settings.address || "Address coming soon"}</p>
              <p>{settings.phone || "Phone coming soon"}</p>
              {settings.email ? <p>{settings.email}</p> : null}
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-4 pt-6 text-sm text-gray-500">
          Copyright {new Date().getFullYear()} {settings.name}. All rights reserved.
        </div>
      </footer>
    </CustomerLayout>
  );
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

function FoodCard({ item, special = false }: { item: MenuItem; special?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-48 w-full object-cover" /> : <div className="grid h-48 place-items-center bg-emerald-50 text-emerald-700"><UtensilsCrossed className="h-8 w-8" /></div>}
      <div className="p-5">
        {special ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Special</span> : null}
        <h3 className="mt-3 text-lg font-bold text-gray-900">{item.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{item.description ?? "Description not available."}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-bold text-emerald-700">{formatPrice(item.price)}</span>
          <Link to="/customer/menu" className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">View Menu</Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, description, icon }: { title: string; description: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-amber-600">
        {icon ?? <Star className="h-7 w-7" />}
      </div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500">{description}</p>
    </div>
  );
}

function Info({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-gray-700 shadow-sm">
      <span className="text-amber-600">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function FooterLinks({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-gray-400">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function formatPrice(value?: string | number) {
  const amount = Number(value ?? 0);
  return amount ? `₹${amount.toLocaleString("en-IN")}` : "Price on menu";
}

function formatDiscount(offer: Offer) {
  if (!offer.discountValue) return "Offer details available";
  return `${offer.discountValue}${offer.discountType === "PERCENTAGE" ? "%" : "₹"} off`;
}
