import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BedDouble,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Crown,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { menuApi } from "@/api/menu.api";
import { operationsApi } from "@/api/operations.api";
import { restaurantApi } from "@/api/restaurant.api";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/authStore";

type MenuItemCard = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: string;
  category?: { name?: string };
  foodType?: string;
  prepTimeMinutes?: number;
};

type OfferCard = {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  code?: string;
  validTill?: string;
};

type LeaderboardCustomer = {
  id: string;
  fullName: string;
  visitCount: number;
  totalSpending: string;
  avatarUrl: string | null;
};

type ChefCard = {
  name: string;
  specialty: string;
  experience: string;
  imageUrl: string;
};

type RestaurantCard = {
  name: string;
  description?: string | null;
  phone: string;
  email: string;
  address: string;
  openingTime?: string;
  closingTime?: string;
};

type HomeData = {
  todaysSpecials: MenuItemCard[];
  topFoods: MenuItemCard[];
  bestCustomers: LeaderboardCustomer[];
  aboutRestaurant: RestaurantCard;
  chef: ChefCard[];
};

type MenuResponse = {
  categories: Array<{ id: string; name: string }>;
  items: MenuItemCard[];
};

type LeaderboardResponse = {
  topCustomers: LeaderboardCustomer[];
  currentRank: number | null;
};

const fallbackHome: HomeData = {
  todaysSpecials: [
    {
      id: "1",
      name: "Truffle Butter Prawns",
      description: "Sizzling prawns finished in truffle butter and herbs.",
      imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800",
      price: "450",
      category: { name: "Seafood" },
      foodType: "NON_VEG",
      prepTimeMinutes: 25,
    },
    {
      id: "2",
      name: "Herb Garden Risotto",
      description: "Creamy risotto with parmesan, seasonal greens and herbs.",
      imageUrl: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800",
      price: "380",
      category: { name: "Mains" },
      foodType: "VEG",
      prepTimeMinutes: 20,
    },
    {
      id: "3",
      name: "Charcoal Grilled Chicken",
      description: "Smoky grilled chicken served with house spices and salad.",
      imageUrl: "https://images.unsplash.com/photo-1529692236671-f1d1c2d4c9a6?w=800",
      price: "520",
      category: { name: "Grill" },
      foodType: "NON_VEG",
      prepTimeMinutes: 30,
    },
  ],
  topFoods: [
    { id: "p1", name: "Butter Garlic Naan", price: "90", imageUrl: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400", foodType: "VEG" },
    { id: "p2", name: "Paneer Tikka", price: "240", imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400", foodType: "VEG" },
    { id: "p3", name: "Chicken Biryani", price: "320", imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400", foodType: "NON_VEG" },
    { id: "p4", name: "Espresso Tiramisu", price: "260", imageUrl: "https://images.unsplash.com/photo-1511910849309-0dffb8785146?w=400", foodType: "VEG" },
  ],
  bestCustomers: [
    { id: "c1", fullName: "Arjun Sharma", visitCount: 42, totalSpending: "38400", avatarUrl: null },
    { id: "c2", fullName: "Priya Patel", visitCount: 38, totalSpending: "34100", avatarUrl: null },
    { id: "c3", fullName: "Rahul Mehta", visitCount: 33, totalSpending: "31850", avatarUrl: null },
  ],
  aboutRestaurant: {
    name: "SAFNAM",
    description: "A refined dining space blending warm hospitality, seasonal cuisine and premium service.",
    phone: "+91 98765 43210",
    email: "hello@safnam.com",
    address: "MG Road, Kochi, Kerala",
    openingTime: "12:00 PM",
    closingTime: "11:00 PM",
  },
  chef: [
    { name: "Chef Aarav", specialty: "Indian Coastal Cuisine", experience: "12 years experience", imageUrl: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800" },
    { name: "Chef Nandini", specialty: "Contemporary Desserts", experience: "9 years experience", imageUrl: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=800" },
    { name: "Chef Imran", specialty: "Charcoal Grill Master", experience: "15 years experience", imageUrl: "https://images.unsplash.com/photo-1623855247424-1d7df2d85d6b?w=800" },
    { name: "Chef Meera", specialty: "Pan-Asian Fine Dining", experience: "11 years experience", imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800" },
  ],
};

const galleryImages = [
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600",
];

const testimonials = [
  { name: "Arjun Sharma", review: "Absolutely divine experience. The service and presentation were world-class.", date: "12 Jan 2025" },
  { name: "Priya Patel", review: "The ambiance is breathtaking and the food felt genuinely crafted with care.", date: "22 Jan 2025" },
  { name: "Rahul Mehta", review: "Best fine dining in the city. Every course had a story and a polish.", date: "03 Feb 2025" },
  { name: "Sneha Joshi", review: "Chef's special was outstanding and the staff made us feel at home.", date: "11 Feb 2025" },
  { name: "Vikram Singh", review: "Worth every penny. The booking flow was smooth and the evening was memorable.", date: "18 Feb 2025" },
  { name: "Ananya Gupta", review: "A magical evening with family. SAFNAM has become our celebration spot.", date: "02 Mar 2025" },
];

const statCards = [
  { value: "12+", label: "Years of Excellence" },
  { value: "50+", label: "Expert Chefs" },
  { value: "2400+", label: "Happy Customers" },
  { value: "98%", label: "Satisfaction Rate" },
];

const safe = <T,>(value: T | undefined, fallback: T) => value ?? fallback;

export default function CustomerHomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const restaurantQuery = useQuery<RestaurantCard>({
    queryKey: ["restaurant"],
    queryFn: async () => {
      const response = await restaurantApi.getInfo();
      return response.data.data.restaurant as RestaurantCard;
    },
  });

  const menuQuery = useQuery<MenuResponse>({
    queryKey: ["menu-categories"],
    queryFn: async () => {
      const response = await menuApi.getCategories();
      return response.data.data as MenuResponse;
    },
  });

  const specialsQuery = useQuery<MenuItemCard[]>({
    queryKey: ["menu-specials"],
    queryFn: async () => {
      const response = await menuApi.getItems({ featured: true });
      return response.data.data.items as MenuItemCard[];
    },
  });

  const popularQuery = useQuery<MenuItemCard[]>({
    queryKey: ["menu-popular"],
    queryFn: async () => {
      const response = await menuApi.getItems({ popular: true });
      return response.data.data.items as MenuItemCard[];
    },
  });

  const offersQuery = useQuery<OfferCard[]>({
    queryKey: ["offers"],
    queryFn: async () => {
      const response = await operationsApi.getOffers();
      return response.data.data.offers as OfferCard[];
    },
  });

  const leaderboardQuery = useQuery<LeaderboardResponse>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const response = await operationsApi.getLeaderboard();
      return response.data.data.leaderboard as LeaderboardResponse;
    },
  });

  const restaurant = restaurantQuery.data ?? fallbackHome.aboutRestaurant;
  const categories = menuQuery.data?.categories ?? [];
  const specials = specialsQuery.data ?? fallbackHome.todaysSpecials;
  const popular = popularQuery.data ?? fallbackHome.topFoods;
  const offers = offersQuery.data ?? [
    { id: "o1", title: "20% Off on All Starters", description: "Perfect for a shared table feast.", code: "SAFNAM20", validTill: "31 Jan 2025" },
    { id: "o2", title: "Complimentary Dessert", description: "On bookings of 6 or more guests.", code: "SWEETSAFNAM", validTill: "Every Sunday" },
    { id: "o3", title: "Family Dinner Special", description: "Set menu savings for evening reservations.", code: "FAMILY10", validTill: "Weekend only" },
  ];
  const leaderboard = leaderboardQuery.data ?? { topCustomers: fallbackHome.bestCustomers, currentRank: null };
  const topCustomers = safe(leaderboard.topCustomers, fallbackHome.bestCustomers);
  const stats = useMemo(() => statCards, []);

  const handleBookingRedirect = (path: string) => {
    if (!isAuthenticated) {
      sessionStorage.setItem("redirectAfterLogin", path);
      navigate("/login");
      return;
    }

    navigate(path);
  };

  return (
    <CustomerLayout>
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600")' }} />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.3)_100%)]" />

        <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/20 px-4 py-2 backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              <span className="text-sm font-medium text-amber-300">Now Open - Reservations Available</span>
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="font-display text-5xl font-bold leading-tight text-white md:text-7xl">
            Fine Dining,
            <br />
            <span className="text-amber-400">Redefined</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 md:text-xl">
            Experience the art of cuisine at SAFNAM. Where every dish tells a story of passion, tradition and culinary excellence.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={() => handleBookingRedirect("/customer/book-table")}
              className="flex items-center gap-2 rounded-2xl bg-amber-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-amber-500/40 transition-all duration-200 hover:scale-105 hover:bg-amber-600 active:scale-95"
            >
              <CalendarDays size={18} />
              Book Table
            </button>
            <button
              type="button"
              onClick={() => handleBookingRedirect("/customer/book-room")}
              className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/20 active:scale-95"
            >
              <BedDouble size={18} />
              Book Room
            </button>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/60">
          <span className="text-xs">Scroll to explore</span>
          <ChevronDown className="animate-bounce" size={20} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/40 py-4 backdrop-blur-md">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 px-4 text-center md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-amber-400">{stat.value}</div>
                <div className="text-xs text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Today&apos;s Specials</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-gray-900">Chef&apos;s Recommendations</h2>
            <p className="mt-2 text-gray-500">Handpicked by our head chef every morning</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {safe(specials, fallbackHome.todaysSpecials).slice(0, 6).map((item) => (
              <motion.div key={item.id} whileHover={{ scale: 1.02 }} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="relative h-48">
                  <img src={item.imageUrl ?? "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800"} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
                  <div className="absolute left-0 top-0 rounded-br-xl bg-amber-500 px-2 py-1 text-xs font-semibold text-white">TODAY&apos;S SPECIAL</div>
                  <div className="absolute right-3 top-3 rounded border border-white/50 bg-white/20 px-2 py-1 text-xs text-white backdrop-blur-sm">
                    {item.foodType === "VEG" ? "Veg" : "Non Veg"}
                  </div>
                  <div className="absolute bottom-0 right-0 rounded-tl-xl bg-black/50 px-2 py-1 text-xs text-white">{item.prepTimeMinutes ?? 25} mins</div>
                </div>
                <div className="p-4">
                  <p className="text-xs uppercase tracking-wide text-amber-600">{item.category?.name ?? "Chef Special"}</p>
                  <h3 className="mt-1 text-base font-semibold text-gray-900">{item.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-lg font-bold text-emerald-700">₹{item.price}</span>
                    <button type="button" onClick={() => handleBookingRedirect("/login")} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600">
                      {isAuthenticated ? "Add to Cart" : "Order Now"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Most Loved</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-gray-900">Popular Dishes</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {safe(popular, fallbackHome.topFoods).slice(0, 4).map((item) => (
              <motion.div key={item.id} whileHover={{ scale: 1.03 }} className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                <img src={item.imageUrl ?? "https://images.unsplash.com/photo-1547592180-85f173990554?w=400"} alt={item.name} loading="lazy" className="mx-auto h-20 w-20 rounded-full object-cover" />
                <h3 className="mt-3 text-sm font-semibold text-gray-900">{item.name}</h3>
                <p className="mt-1 text-sm font-bold text-amber-600">₹{item.price}</p>
                <div className="mx-auto mt-2 h-2 w-2 rounded-full bg-emerald-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Exclusive Deals</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-gray-900">Today&apos;s Offers</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {(offers.length ? offers : [
              { id: "o1", title: "20% Off on All Starters", description: "Perfect for a shared table feast.", code: "SAFNAM20", validTill: "31 Jan 2025" },
              { id: "o2", title: "Complimentary Dessert", description: "On bookings of 6 or more guests.", code: "SWEETSAFNAM", validTill: "Every Sunday" },
              { id: "o3", title: "Family Dinner Special", description: "Set menu savings for evening reservations.", code: "FAMILY10", validTill: "Weekend only" },
            ]).map((offer, index) => {
              const gradient = index === 0 ? "from-emerald-600 to-emerald-800" : index === 1 ? "from-amber-500 to-amber-700" : "from-gray-800 to-gray-900";
              return (
                <div key={offer.id} className={cn("relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white", gradient)}>
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                  <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/5" />
                  <div className="relative">
                    <span className="inline-flex rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">Limited Time</span>
                    <h3 className="mt-3 text-xl font-bold">{offer.title ?? offer.name ?? "Special Offer"}</h3>
                    <p className="mt-2 text-sm text-emerald-100">{offer.description ?? "Enjoy a premium dining benefit crafted for today."}</p>
                    <p className="mt-3 text-xs text-emerald-200">Valid till: {offer.validTill ?? "This week"}</p>
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-white/20 px-4 py-2">
                      <span className="font-mono text-sm font-bold text-white">Use code: {offer.code ?? "SAFNAM20"}</span>
                      <button type="button" onClick={() => navigator.clipboard?.writeText(offer.code ?? "SAFNAM20")} className="rounded-lg p-1 text-white/90 hover:bg-white/10">
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-gray-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Meet Our Team</p>
            <h2 className="mt-2 font-display text-3xl font-bold">Expert Chefs</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {fallbackHome.chef.slice(0, 4).map((chef) => (
              <div key={chef.name} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <img src={chef.imageUrl} alt={chef.name} loading="lazy" className="h-64 w-full object-cover transition-transform duration-300 hover:scale-105" />
                <div className="p-4">
                  <h3 className="font-semibold text-white">{chef.name}</h3>
                  <p className="text-sm text-amber-400">{chef.specialty}</p>
                  <p className="text-xs text-gray-400">{chef.experience}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Our Gallery</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-gray-900">A Visual Feast</h2>
          </div>
          <div className="grid auto-rows-[200px] grid-cols-2 gap-3 md:grid-cols-4">
            {galleryImages.map((image, index) => (
              <div key={image} className={cn("group relative overflow-hidden rounded-2xl", index % 5 === 0 ? "md:row-span-2" : "")}>
                <img src={image} alt={`Gallery ${index + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Loyalty Rewards</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-gray-900">Top Customers This Month</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {topCustomers.slice(0, 3).map((customer, index) => (
              <div key={customer.id} className={cn("rounded-3xl p-6 text-center", index === 0 ? "bg-amber-500 text-white" : index === 1 ? "bg-gray-200 text-gray-900" : "bg-amber-100 text-gray-900")}>
                <Crown className="mx-auto mb-3 h-6 w-6" />
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/30 text-lg font-bold">{customer.fullName.slice(0, 2).toUpperCase()}</div>
                <h3 className="mt-3 text-lg font-bold">{customer.fullName}</h3>
                <p className="text-sm">#{index + 1} | {customer.visitCount} visits</p>
              </div>
            ))}
          </div>
          <div className="mt-8 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            {topCustomers.slice(3, 10).map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between border-b border-gray-100 px-4 py-3 odd:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-sm font-semibold text-gray-500">{index + 4}</span>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-700 text-xs font-bold text-white">{customer.fullName.slice(0, 2).toUpperCase()}</span>
                  <span className="font-medium text-gray-900">{customer.fullName}</span>
                </div>
                <div className="text-sm text-gray-600">{customer.visitCount} visits</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <button type="button" onClick={() => handleBookingRedirect("/customer/book-table")} className="rounded-2xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-lg shadow-amber-500/30 transition-colors hover:bg-amber-600">
              Join the leaderboard - Book your table now!
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10">
            <h2 className="font-display text-3xl font-bold text-gray-900">What Our Guests Say</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {testimonials.concat(testimonials).map((item, index) => (
              <div key={`${item.name}-${index}`} className="w-80 flex-shrink-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600">{item.review}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-700 text-sm font-bold text-white">{item.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-xs text-emerald-700">Verified Customer</div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-500">{item.date}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-gray-900 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Our Story</p>
            <h2 className="mt-2 font-display text-3xl font-bold">A Legacy of Culinary Excellence</h2>
            <p className="mt-4 text-gray-300">{restaurant.description}</p>
            <div className="mt-6 space-y-3 text-sm text-gray-200">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Farm-to-table ingredients</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Award-winning chefs</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Unforgettable ambiance</div>
            </div>
            <button type="button" onClick={() => handleBookingRedirect("/customer/book-table")} className="mt-8 rounded-2xl bg-amber-500 px-6 py-3 font-semibold text-white">
              Make a Reservation
            </button>
          </div>
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3"><MapPin className="text-amber-400" /> <span>{restaurant.address}</span></div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3"><Phone className="text-amber-400" /> <span>{restaurant.phone}</span></div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3"><Clock3 className="text-amber-400" /> <span>Mon-Fri: 12pm - 11pm | Sat-Sun: 11am - 11:30pm</span></div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3"><ShieldCheck className="text-amber-400" /> <span>{restaurant.email}</span></div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-black py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-4">
          <div>
            <div className="font-display text-2xl font-bold text-amber-400">SAFNAM</div>
            <p className="mt-2 text-sm text-gray-400">Where Every Meal Tells a Story</p>
          </div>
          <div>
            <h3 className="font-semibold">Quick Links</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-400">
              <li>Home</li>
              <li>Menu</li>
              <li>Gallery</li>
              <li>Offers</li>
              <li>About</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Dining</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-400">
              <li>Book Table</li>
              <li>Book Room</li>
              <li>Special Events</li>
              <li>Private Dining</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Contact</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-400">
              <li>{restaurant.address}</li>
              <li>{restaurant.phone}</li>
              <li>{restaurant.email}</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-4 pt-6 text-sm text-gray-500">
          © 2025 SAFNAM. All rights reserved.
        </div>
      </footer>
    </CustomerLayout>
  );
}
