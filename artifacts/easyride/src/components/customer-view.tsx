import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import type { EasyRideState } from "@workspace/api-client-react";
import type { EasyRideUser } from "@/hooks/use-auth";
import {
  completeCustomerRental,
  customerRentalId,
  forgetCustomerRental,
  KAMPALA_STATIONS,
} from "@/lib/customer-bridge";
import { money } from "@/lib/format";

export interface CustomerFleetBike {
  id: string;
  code: string;
  name: string;
  brand: string;
  type: "electric" | "mountain" | "city" | "racing" | "hybrid";
  station: string;
  rate: number;
  rating: number;
  reviews: number;
  status: "available" | "rented" | "maintenance";
  certified: boolean;
  imageBg: string;
}

export interface CustomerOrder {
  orderId: string;
  bikeId: string;
  bikeName: string;
  bikeCode: string;
  customerName: string;
  phone: string;
  station: string;
  hours: number;
  totalAmount: number;
  startTime: string;
  date: string;
  status: "active" | "completed";
}

export { KAMPALA_STATIONS };

export const BASE_CUSTOMER_BIKES: CustomerFleetBike[] = [
  {
    id: "BK-001-KMP",
    code: "#BK-001-KMP",
    name: "Trek FX 3 Disc",
    brand: "BikeRental",
    type: "city",
    station: "Makerere Hill Road",
    rate: 100,
    rating: 4.5,
    reviews: 25,
    status: "maintenance",
    certified: true,
    imageBg: "bg-[#646874]",
  },
  {
    id: "BK-002-KMP",
    code: "#BK-002-KMP",
    name: "Giant Escape 2",
    brand: "BikeRental",
    type: "city",
    station: "Wandegeya Market",
    rate: 100,
    rating: 4.5,
    reviews: 25,
    status: "maintenance",
    certified: true,
    imageBg: "bg-[#646874]",
  },
  {
    id: "BK-003-KMP",
    code: "#BK-003-KMP",
    name: "Specialized Sirrus",
    brand: "BikeRental",
    type: "city",
    station: "Kiwatule Rec Centre",
    rate: 100,
    rating: 4.5,
    reviews: 25,
    status: "rented",
    certified: true,
    imageBg: "bg-slate-100",
  },
  {
    id: "BK-004-KMP",
    code: "#BK-004-KMP",
    name: "Cannondale Quick 4",
    brand: "BikeRental",
    type: "city",
    station: "Ntinda Junction",
    rate: 150,
    rating: 4.5,
    reviews: 25,
    status: "maintenance",
    certified: true,
    imageBg: "bg-[#646874]",
  },
  {
    id: "BK-005-KMP",
    code: "#BK-005-KMP",
    name: "GT Aggressor Pro",
    brand: "BikeRental",
    type: "mountain",
    station: "Bugolobi Village Mall",
    rate: 150,
    rating: 4.5,
    reviews: 25,
    status: "available",
    certified: true,
    imageBg: "bike-card-backdrop",
  },
  {
    id: "BK-006-KMP",
    code: "#BK-006-KMP",
    name: "Raleigh Cadent 2",
    brand: "BikeRental",
    type: "city",
    station: "Acacia Mall",
    rate: 100,
    rating: 4.5,
    reviews: 25,
    status: "available",
    certified: true,
    imageBg: "bike-card-backdrop",
  },
  {
    id: "BK-007-KMP",
    code: "#BK-007-KMP",
    name: "Fuji Feather",
    brand: "BikeRental",
    type: "hybrid",
    station: "Nakaserero Market",
    rate: 120,
    rating: 4.5,
    reviews: 25,
    status: "available",
    certified: true,
    imageBg: "bike-card-backdrop",
  },
  {
    id: "BK-008-KMP",
    code: "#BK-008-KMP",
    name: "Kona Dew",
    brand: "BikeRental",
    type: "city",
    station: "Kasubi Tombs",
    rate: 100,
    rating: 4.5,
    reviews: 25,
    status: "available",
    certified: true,
    imageBg: "bike-card-backdrop",
  },
];

export function generate100Fleet(): CustomerFleetBike[] {
  const fleet: CustomerFleetBike[] = [...BASE_CUSTOMER_BIKES];
  const stationsList = KAMPALA_STATIONS.map((s) => s.name);

  const mountainModels = [
    "Trek Marlin 7", "Giant Talon 29", "Specialized Rockhopper Comp", "Cannondale Trail 8",
    "Scott Aspect 950", "Marin Bobcat Trail 3", "Polygon Siskiu D5", "Cube Aim Race",
    "Kona Mahuna", "Co-op Cycles DRT 1.1", "Trek Roscoe 7", "Giant ATX 27.5",
    "Diamondback Overdrive", "Santa Cruz Chameleon", "Norco Storm 4",
  ];

  const cityModels = [
    "Linus Roadster Sport", "Public C7 Commuter", "Marin Presidio 1", "Trek District 4",
    "Priority Classic Plus", "Electra Loft 7D",
  ];

  const hybridModels = [
    "Marin Fairfax 2", "Schwinn Discover", "Trek FX 2 Disc", "Specialized Sirrus X",
    "Giant Roam Disc", "Cannondale Quick CX 3", "Kona Splice", "Jamis Allegro A3",
  ];

  let idCounter = 9;

  // Add Mountain bikes up to 40 (1 base + 39)
  for (let i = 0; i < 39; i++) {
    const numStr = String(idCounter++).padStart(3, "0");
    const model = mountainModels[i % mountainModels.length] + ` (#${i + 1})`;
    fleet.push({
      id: `BK-${numStr}-KMP`,
      code: `#BK-${numStr}-KMP`,
      name: model,
      brand: "BikeRental",
      type: "mountain",
      station: stationsList[i % stationsList.length],
      rate: i % 3 === 0 ? 150 : i % 3 === 1 ? 120 : 100,
      rating: 4.5,
      reviews: 18 + (i % 15),
      status: i % 6 === 0 ? "rented" : i % 11 === 0 ? "maintenance" : "available",
      certified: true,
      imageBg: i % 11 === 0 ? "bg-[#646874]" : i % 6 === 0 ? "bg-slate-100" : "bike-card-backdrop",
    });
  }

  // Add City bikes up to 14 (6 base + 8)
  for (let i = 0; i < 8; i++) {
    const numStr = String(idCounter++).padStart(3, "0");
    const model = cityModels[i % cityModels.length] + ` (#${i + 1})`;
    fleet.push({
      id: `BK-${numStr}-KMP`,
      code: `#BK-${numStr}-KMP`,
      name: model,
      brand: "BikeRental",
      type: "city",
      station: stationsList[(i + 2) % stationsList.length],
      rate: 100,
      rating: 4.6,
      reviews: 20 + (i % 10),
      status: i % 4 === 0 ? "rented" : "available",
      certified: true,
      imageBg: i % 4 === 0 ? "bg-slate-100" : "bike-card-backdrop",
    });
  }

  // Add Hybrid bikes up to 26 (1 base + 25)
  for (let i = 0; i < 25; i++) {
    const numStr = String(idCounter++).padStart(3, "0");
    const model = hybridModels[i % hybridModels.length] + ` (#${i + 1})`;
    fleet.push({
      id: `BK-${numStr}-KMP`,
      code: `#BK-${numStr}-KMP`,
      name: model,
      brand: "BikeRental",
      type: "hybrid",
      station: stationsList[(i + 4) % stationsList.length],
      rate: i % 2 === 0 ? 120 : 100,
      rating: 4.5,
      reviews: 15 + (i % 12),
      status: i % 5 === 0 ? "rented" : "available",
      certified: true,
      imageBg: i % 5 === 0 ? "bg-slate-100" : "bike-card-backdrop",
    });
  }

  // Add 20 Campus Cruisers to bring total to 100
  for (let i = 0; i < 20; i++) {
    const numStr = String(idCounter++).padStart(3, "0");
    fleet.push({
      id: `BK-${numStr}-KMP`,
      code: `#BK-${numStr}-KMP`,
      name: `Campus Cruiser ${i + 1}`,
      brand: "BikeRental",
      type: "city",
      station: stationsList[i % stationsList.length],
      rate: 80,
      rating: 4.4,
      reviews: 14 + (i % 8),
      status: "available",
      certified: true,
      imageBg: "bike-card-backdrop",
    });
  }

  return fleet;
}

const FLEET_STORAGE_KEY = "bikerent_customer_fleet_v1";
const ORDERS_STORAGE_KEY = "bikerent_customer_orders_v1";

export function CustomerView({
  state,
  save,
  currentUser,
  onSignOut,
  onBackToGuest,
}: {
  state?: EasyRideState;
  save?: (state: EasyRideState) => void;
  currentUser?: EasyRideUser | null;
  onSignOut?: () => void;
  onBackToGuest?: () => void;
}) {
  // Currency comes from the shared configuration so the rider app and the
  // staff console always quote a hire the same way.
  const currency = state?.config.currency ?? "UGX";
  const [, navigate] = useLocation();

  const [fleet, setFleet] = useState<CustomerFleetBike[]>(() => {
    if (typeof window === "undefined") return generate100Fleet();
    try {
      const stored = localStorage.getItem(FLEET_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const init = generate100Fleet();
    try {
      localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(init));
    } catch {}
    return init;
  });

  const [orders, setOrders] = useState<CustomerOrder[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const saveFleetLocal = (newFleet: CustomerFleetBike[]) => {
    setFleet(newFleet);
    try {
      localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(newFleet));
    } catch {}
  };

  const saveOrdersLocal = (newOrders: CustomerOrder[]) => {
    setOrders(newOrders);
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(newOrders));
    } catch {}
  };

  // Filter & Search states
  const [category, setCategory] = useState<string>("all");
  const [location, setLocation] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [certifiedOnly, setCertifiedOnly] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Modals & Feedback
  const [ordersModalOpen, setOrdersModalOpen] = useState<boolean>(false);
  const [hubsModalOpen, setHubsModalOpen] = useState<boolean>(false);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ title: string; desc: string } | null>(null);

  const catalogSectionRef = useRef<HTMLDivElement>(null);

  const showToast = (title: string, desc: string) => {
    setToast({ title, desc });
    setTimeout(() => setToast(null), 4000);
  };

  // Filter Logic
  const filteredBikes = useMemo(() => {
    return fleet.filter((bike) => {
      if (category !== "all" && bike.type.toLowerCase() !== category.toLowerCase()) return false;
      if (location !== "all" && !bike.station.toLowerCase().includes(location.toLowerCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          bike.name.toLowerCase().includes(q) ||
          bike.code.toLowerCase().includes(q) ||
          bike.station.toLowerCase().includes(q) ||
          bike.type.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (bike.rate > maxPrice) return false;
      if (inStockOnly && bike.status !== "available") return false;
      if (certifiedOnly && !bike.certified) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.rate - b.rate;
      if (sortBy === "price-high") return b.rate - a.rate;
      if (sortBy === "newest") return b.id.localeCompare(a.id);
      return 0;
    });
  }, [fleet, category, location, searchQuery, maxPrice, inStockOnly, certifiedOnly, sortBy]);

  const totalBikes = filteredBikes.length;
  const totalPages = Math.max(1, Math.ceil(totalBikes / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageBikes = filteredBikes.slice(startIndex, startIndex + itemsPerPage);

  const resetAllFilters = () => {
    setCategory("all");
    setLocation("all");
    setSearchQuery("");
    setMaxPrice(2000);
    setInStockOnly(false);
    setCertifiedOnly(true);
    setSortBy("popularity");
    setCurrentPage(1);
  };

  const handleReturnBike = (orderId: string) => {
    const updatedOrders = orders.map((o) => (o.orderId === orderId ? { ...o, status: "completed" as const } : o));
    saveOrdersLocal(updatedOrders);

    const order = orders.find((o) => o.orderId === orderId);
    if (order) {
      const updatedFleet = fleet.map((b) => (b.id === order.bikeId ? { ...b, status: "available" as const } : b));
      saveFleetLocal(updatedFleet);
    }

    // Close the matching hire in the shared state so it also leaves the
    // staff "Borrowed Bikes" list.
    if (state && save) {
      save(completeCustomerRental(state, customerRentalId(orderId)));
    }
    forgetCustomerRental(orderId);

    showToast("Bike Returned Successfully", "Thank you for riding with BikeRent Uganda! Receipt saved.");
  };

  const activeOrdersCount = orders.filter((o) => o.status === "active").length;

  return (
    <div className="bg-[#f6f9f8] text-slate-800 font-sans antialiased selection:bg-brand-mint selection:text-white min-h-screen flex flex-col justify-between">
      <div>
        {/* BEGIN: Top Announcement Banner */}
        <header className="bg-brand-dark text-slate-200 text-xs py-2 px-4 sm:px-8 border-b border-white/10" data-purpose="top-announcement-bar">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2 font-medium">
            <div className="flex items-center space-x-6">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                Free Delivery on rentals above {money(150000, currency)}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                100% Verified Fleet &amp; Secure Payments
              </span>
            </div>
            <div className="flex items-center space-x-4 text-slate-300">
              <button onClick={() => setOrdersModalOpen(true)} className="hover:text-white flex items-center gap-1 transition cursor-pointer text-xs">
                <svg className="w-3.5 h-3.5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                My Orders
                <span className="ml-1 px-1.5 py-0.2 bg-brand-gold text-brand-dark rounded-full text-[10px] font-bold">
                  {activeOrdersCount}
                </span>
              </button>
              <span className="text-white/20">|</span>

              {/* User Profile with Dropdown Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 cursor-pointer group text-xs text-slate-200 hover:text-white focus:outline-none"
                >
                  <div className="w-5 h-5 rounded-full bg-brand-gold text-brand-dark flex items-center justify-center font-bold text-[10px]">
                    {(currentUser?.name || "Atugonza")[0].toUpperCase()}
                  </div>
                  <span>
                    HELLO, <strong className="text-white">{currentUser?.name?.toUpperCase() || "ATUGONZA"}</strong>
                  </span>
                  <svg
                    className={`w-3 h-3 text-slate-400 group-hover:text-white transition transform ${userMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 p-2 text-slate-700 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <div className="font-bold text-xs text-brand-dark">{currentUser?.name || "Atugonza"}</div>
                      <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified Customer · Rider
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setUserMenuOpen(false); setOrdersModalOpen(true); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                    >
                      <span>🛍️</span>
                      <span>My Orders ({activeOrdersCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onBackToGuest) onBackToGuest();
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-teal-800 rounded-xl hover:bg-teal-50 transition cursor-pointer"
                    >
                      <span>←</span>
                      <span>Return to Guest Dashboard</span>
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onSignOut) onSignOut();
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Visible Sign Out Button */}
              {onSignOut && (
                <>
                  <span className="text-white/20">|</span>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-rose-600 hover:text-white text-slate-200 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                    title="Sign Out to Guest Dashboard"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
        {/* END: Top Announcement Banner */}

        {/* BEGIN: Main Navigation Bar */}
        <nav className="bg-white sticky top-0 z-40 border-b border-brand-border/60 shadow-sm" data-purpose="primary-navigation">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-6">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center space-x-3 shrink-0 no-underline">
              <div className="w-10 h-10 rounded-xl bg-brand-dark flex items-center justify-center text-white shadow-md shadow-brand-dark/20 border border-emerald-800">
                <svg className="w-6 h-6 text-brand-gold" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
                  <circle cx="5.5" cy="17.5" r="3.5"></circle>
                  <circle cx="18.5" cy="17.5" r="3.5"></circle>
                  <path d="M15 17.5V11L12 7H9L7 13"></path>
                  <path d="M12 17.5V13h3.5"></path>
                  <path d="M8 8h3"></path>
                </svg>
              </div>
              <div>
                <div className="flex items-center">
                  <span className="text-xl font-extrabold tracking-tight font-display text-brand-dark">Bike</span>
                  <span className="text-xl font-extrabold tracking-tight font-display text-brand-gold">Rent</span>
                  <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-brand-mintLight text-brand-dark rounded">UG</span>
                </div>
                <p className="text-[10px] tracking-wider font-semibold text-slate-400 uppercase">Your Trusted Ride Partner</p>
              </div>
            </Link>

            {/* Search Input Center */}
            <div className="flex-1 max-w-2xl hidden md:block">
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition"
                  placeholder="Search for bikes, brands, or rental locations..."
                  type="text"
                />
                <button
                  onClick={() => catalogSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="absolute right-1.5 px-5 py-1.5 bg-brand-dark hover:bg-brand-primary text-white text-xs font-semibold rounded-full shadow-sm transition hover:scale-[1.02] active:scale-95 cursor-pointer"
                  type="button"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Quick Actions / Notifications / Profile */}
            <div className="flex items-center space-x-4 shrink-0">
              <button
                onClick={() => showToast("Notifications", "You have 1 active promotional credit for free weekend rides!")}
                aria-label="Notifications"
                className="relative p-2 rounded-full text-slate-600 hover:text-brand-dark hover:bg-slate-100 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-gold ring-2 ring-white"></span>
              </button>

              <button
                onClick={() => showToast("Saved Favorites", "You can bookmark your favorite bike models by clicking their cards.")}
                aria-label="Favorites"
                className="p-2 rounded-full text-slate-600 hover:text-brand-dark hover:bg-slate-100 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </button>

              <button
                onClick={() => setHubsModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-brand-mintLight text-brand-dark hover:bg-emerald-200 transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                Live Hubs (4 Open)
              </button>
            </div>
          </div>
        </nav>
        {/* END: Main Navigation Bar */}

        {/* BEGIN: Breadcrumb Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onBackToGuest}
              className="hover:text-brand-dark transition text-teal-800 font-semibold cursor-pointer flex items-center gap-1"
            >
              <span>← Guest Home</span>
            </button>
            <span>›</span>
            <span className="text-brand-dark font-semibold">Customer Dashboard (Bike Rentals)</span>
          </div>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer flex items-center gap-1"
            >
              Sign out of {currentUser?.name || "Atugonza"} →
            </button>
          )}
        </div>
        {/* END: Breadcrumb Bar */}

        <main className="max-w-7xl mx-auto px-4 sm:px-8 pb-16 space-y-7">
          {/* BEGIN: Shop by Category Row */}
          <section className="space-y-3" data-purpose="category-tabs">
            <div className="flex items-center space-x-2 text-brand-dark">
              <svg className="w-4 h-4 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <h2 className="text-base font-bold font-display tracking-tight text-slate-900">Shop by Category</h2>
            </div>

            {/* Category Filter Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {/* All Bikes */}
              <button
                onClick={() => { setCategory("all"); setCurrentPage(1); }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl transition transform hover:-translate-y-0.5 cursor-pointer ${
                  category === "all"
                    ? "bg-brand-dark text-white shadow-sm ring-2 ring-brand-dark"
                    : "bg-white border border-brand-border text-slate-700 hover:border-brand-primary hover:shadow-sm"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${category === "all" ? "bg-white/10 text-brand-gold" : "bg-slate-50 text-slate-500"}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <span className="text-sm font-bold tracking-wide">All Bikes</span>
                <span className={`text-[11px] font-medium ${category === "all" ? "text-brand-mint" : "text-slate-400"}`}>100 bikes</span>
              </button>

              {/* Electric */}
              <button
                onClick={() => { setCategory("electric"); setCurrentPage(1); }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl transition transform hover:-translate-y-0.5 cursor-pointer group ${
                  category === "electric"
                    ? "bg-brand-dark text-white shadow-sm ring-2 ring-brand-dark"
                    : "bg-white border border-brand-border text-slate-700 hover:border-brand-primary hover:shadow-sm"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${category === "electric" ? "bg-white/10 text-brand-gold" : "bg-slate-50 text-slate-500"}`}>
                  <svg className="w-5 h-5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <span className="text-sm font-semibold">Electric</span>
                <span className="text-[11px] text-slate-400">0 bikes</span>
              </button>

              {/* Mountain */}
              <button
                onClick={() => { setCategory("mountain"); setCurrentPage(1); }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl transition transform hover:-translate-y-0.5 cursor-pointer group ${
                  category === "mountain"
                    ? "bg-brand-dark text-white shadow-sm ring-2 ring-brand-dark"
                    : "bg-white border border-brand-border text-slate-700 hover:border-brand-primary hover:shadow-sm"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${category === "mountain" ? "bg-white/10 text-brand-gold" : "bg-slate-50 text-emerald-600"}`}>
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <span className="text-sm font-semibold">Mountain</span>
                <span className="text-[11px] text-slate-400">40 bikes</span>
              </button>

              {/* City */}
              <button
                onClick={() => { setCategory("city"); setCurrentPage(1); }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl transition transform hover:-translate-y-0.5 cursor-pointer group ${
                  category === "city"
                    ? "bg-brand-dark text-white shadow-sm ring-2 ring-brand-dark"
                    : "bg-white border border-brand-border text-slate-700 hover:border-brand-primary hover:shadow-sm"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${category === "city" ? "bg-white/10 text-brand-gold" : "bg-slate-50 text-slate-600"}`}>
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <span className="text-sm font-semibold">City</span>
                <span className="text-[11px] text-slate-400">14 bikes</span>
              </button>

              {/* Racing */}
              <button
                onClick={() => { setCategory("racing"); setCurrentPage(1); }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl transition transform hover:-translate-y-0.5 cursor-pointer group ${
                  category === "racing"
                    ? "bg-brand-dark text-white shadow-sm ring-2 ring-brand-dark"
                    : "bg-white border border-brand-border text-slate-700 hover:border-brand-primary hover:shadow-sm"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${category === "racing" ? "bg-white/10 text-brand-gold" : "bg-slate-50 text-amber-600"}`}>
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <span className="text-sm font-semibold">Racing</span>
                <span className="text-[11px] text-slate-400">0 bikes</span>
              </button>

              {/* Hybrid */}
              <button
                onClick={() => { setCategory("hybrid"); setCurrentPage(1); }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl transition transform hover:-translate-y-0.5 cursor-pointer group ${
                  category === "hybrid"
                    ? "bg-brand-dark text-white shadow-sm ring-2 ring-brand-dark"
                    : "bg-white border border-brand-border text-slate-700 hover:border-brand-primary hover:shadow-sm"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${category === "hybrid" ? "bg-white/10 text-brand-gold" : "bg-slate-50 text-teal-600"}`}>
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <span className="text-sm font-semibold">Hybrid</span>
                <span className="text-[11px] text-slate-400">26 bikes</span>
              </button>
            </div>
          </section>
          {/* END: Shop by Category Row */}

          {/* BEGIN: Hero Search & Map Preview Hub */}
          <section className="bg-white rounded-3xl border border-brand-border shadow-sm p-6 lg:p-8" data-purpose="search-hub-banner">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Hero Content & Quick Booking Controls */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-goldLight text-brand-dark rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                    <svg className="w-3.5 h-3.5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    Easy Ride Reservation
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-brand-dark leading-tight">Find and Book Your Next Ride</h1>
                  <p className="text-slate-600 text-sm mt-2 max-w-xl">
                    Explore all available bikes, filter by category or station location, and reserve instantly with real-time fleet availability.
                  </p>
                </div>

                {/* Quick Select Dropdowns Box */}
                <div className="bg-brand-surface p-4 sm:p-5 rounded-2xl border border-brand-border space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Location Select */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Location</label>
                      <div className="relative">
                        <select
                          value={location}
                          onChange={(e) => { setLocation(e.target.value); setCurrentPage(1); }}
                          className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2.5 pr-8 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary appearance-none cursor-pointer"
                        >
                          <option value="all">All Locations</option>
                          <option value="Makerere Hill Road">Makerere Hill Road Station</option>
                          <option value="Wandegeya Market">Wandegeya Market Hub</option>
                          <option value="Kiwatule Rec Centre">Kiwatule Rec Centre</option>
                          <option value="Ntinda Junction">Ntinda Junction Station</option>
                          <option value="Bugolobi Village Mall">Bugolobi Village Mall</option>
                          <option value="Acacia Mall">Acacia Mall Hub</option>
                          <option value="Nakaserero Market">Nakaserero Market</option>
                          <option value="Kasubi Tombs">Kasubi Tombs Hub</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-slate-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Ride Category Select */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Ride Category</label>
                      <div className="relative">
                        <select
                          value={category}
                          onChange={(e) => { setCategory(e.target.value); setCurrentPage(1); }}
                          className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2.5 pr-8 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary appearance-none cursor-pointer"
                        >
                          <option value="all">All Categories</option>
                          <option value="electric">Electric Bikes (E-Bikes)</option>
                          <option value="mountain">Mountain Bikes</option>
                          <option value="city">City Commuters</option>
                          <option value="racing">Racing Road Bikes</option>
                          <option value="hybrid">Hybrids</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-slate-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => catalogSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-dark hover:bg-brand-primary text-white text-xs font-bold rounded-xl shadow-md shadow-brand-dark/20 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                      </svg>
                      Find Rides
                    </button>
                    <button
                      onClick={() => catalogSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                      className="px-4 py-2.5 bg-brand-gold hover:bg-amber-500 text-brand-dark text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                    >
                      Browse Bikes
                    </button>
                    <button
                      onClick={() => window.scrollTo({ top: 120, behavior: "smooth" })}
                      className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-slate-300 transition cursor-pointer"
                    >
                      View Top Categories
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Fleet & Route Map Wireframe Container */}
              <div className="lg:col-span-5 h-full">
                <div
                  onClick={() => setHubsModalOpen(true)}
                  className="w-full h-full min-h-[220px] rounded-2xl border-2 border-dashed border-brand-primary/25 bg-gradient-to-br from-brand-surface to-[#edf4f3] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-brand-gold/10 pointer-events-none"></div>
                  <div className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-brand-mint/10 pointer-events-none"></div>
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-brand-border flex items-center justify-center mb-3 text-brand-dark group-hover:scale-110 transition duration-300">
                    <svg className="w-7 h-7 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                    </svg>
                  </div>
                  <h3 className="font-display font-bold text-sm tracking-wide text-brand-dark">[Browse Rides Map &amp; Fleet Wireframe]</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">Interactive station &amp; route exploration across Kampala hubs</p>
                  <span className="mt-3 px-3 py-1 bg-white text-brand-primary text-[11px] font-bold rounded-full border border-brand-border shadow-xs">
                    Live GPS Sync Active
                  </span>
                </div>
              </div>
            </div>
          </section>
          {/* END: Hero Search & Map Preview Hub */}

          {/* BEGIN: Catalog Main Layout (Sidebar + Bike Grid) */}
          <div ref={catalogSectionRef} className="grid grid-cols-1 lg:grid-cols-4 gap-7" id="explore-fleet">
            {/* BEGIN: Left Filters Sidebar */}
            <aside className="lg:col-span-1 space-y-5" data-purpose="catalog-filters">
              <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-sm space-y-6">
                {/* Filters Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2 text-brand-dark">
                    <svg className="w-4 h-4 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    <h3 className="font-display font-bold text-sm text-brand-dark">Filters</h3>
                  </div>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-brand-mintLight text-brand-dark rounded-full">
                    {[category !== "all", location !== "all", searchQuery.trim() !== "", maxPrice < 2000, inStockOnly, certifiedOnly].filter(Boolean).length} active
                  </span>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <svg className="w-3.5 h-3.5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    <span>Price Range (Hourly)</span>
                  </div>

                  {/* Range Track */}
                  <div className="pt-2 px-1">
                    <input
                      max="2000"
                      min="0"
                      step="10"
                      type="range"
                      value={maxPrice}
                      onChange={(e) => { setMaxPrice(parseInt(e.target.value)); setCurrentPage(1); }}
                      className="w-full cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <div className="bg-brand-surface px-2.5 py-1.5 rounded-lg border border-brand-border font-semibold text-brand-dark">
                      {money(0, currency)}
                    </div>
                    <span className="text-slate-400 font-medium">to</span>
                    <div className="bg-brand-surface px-2.5 py-1.5 rounded-lg border border-brand-border font-semibold text-brand-dark">
                      {money(maxPrice, currency)}
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Brand Filter */}
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    <span>Brand</span>
                  </div>
                  <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      checked={certifiedOnly}
                      onChange={(e) => { setCertifiedOnly(e.target.checked); setCurrentPage(1); }}
                      className="w-4 h-4 rounded text-brand-dark focus:ring-brand-primary border-slate-300"
                      type="checkbox"
                    />
                    <span className="font-semibold text-brand-dark">BikeRental Certified</span>
                  </label>
                </div>

                <hr className="border-slate-100" />

                {/* Availability Filter */}
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    <span>Availability</span>
                  </div>
                  <label className="flex items-center space-x-2.5 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      checked={inStockOnly}
                      onChange={(e) => { setInStockOnly(e.target.checked); setCurrentPage(1); }}
                      className="w-4 h-4 rounded text-brand-dark focus:ring-brand-primary border-slate-300"
                      type="checkbox"
                    />
                    <span>In Stock Only</span>
                  </label>
                </div>

                {/* Clear Filters Button */}
                <div className="pt-2">
                  <button
                    onClick={resetAllFilters}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>

              {/* Station Summary Mini Widget */}
              <div className="bg-gradient-to-br from-brand-dark to-brand-primary text-white p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-brand-mint">Campus &amp; City Hubs</span>
                  <span className="w-2 h-2 rounded-full bg-brand-gold animate-ping"></span>
                </div>
                <h4 className="font-display font-bold text-sm">Need help picking a bike?</h4>
                <p className="text-xs text-slate-200 leading-relaxed">
                  All rentals include calibrated helmets, anti-puncture tubes, and instant mobile QR lock unlocks.
                </p>
                <button onClick={() => showToast("Rental Guidelines", "All rentals include calibrated helmet, road safety lights & mobile QR lock.")} className="inline-flex items-center gap-1 text-xs text-brand-gold font-bold hover:underline cursor-pointer">
                  View rental terms ›
                </button>
              </div>
            </aside>
            {/* END: Left Filters Sidebar */}

            {/* BEGIN: Bike Catalog Grid & Controls */}
            <section className="lg:col-span-3 space-y-5" data-purpose="bike-grid-section">
              {/* Header row of the catalog */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-brand-border shadow-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-mint"></span>
                  <h3 className="font-display font-extrabold text-base text-brand-dark">
                    {category === "all" ? "All Bikes" : category.charAt(0).toUpperCase() + category.slice(1) + " Bikes"}
                  </h3>
                  <span className="text-xs font-medium text-slate-400">· <strong className="text-slate-700">{totalBikes}</strong> products found</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <span>Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border-0 bg-transparent py-0 pl-1 pr-6 text-xs font-bold text-brand-dark focus:ring-0 cursor-pointer"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="newest">Newest Fleet</option>
                  </select>
                </div>
              </div>

              {/* Catalog Bike Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {pageBikes.map((bike) => {
                  const isMaintenance = bike.status === "maintenance";
                  const isRented = bike.status === "rented";

                  return (
                    <article key={bike.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition duration-200 flex flex-col justify-between group" data-purpose="bike-card">
                      <div>
                        {isMaintenance ? (
                          <div className="h-44 bg-[#646874] flex flex-col items-center justify-center text-center p-4">
                            <span className="text-white font-bold text-sm tracking-wider uppercase font-display">UNDER MAINTENANCE</span>
                            <span className="text-slate-300 text-xs mt-1 font-normal">Being serviced</span>
                          </div>
                        ) : isRented ? (
                          <div className="relative h-44 bg-slate-100 flex items-center justify-center overflow-hidden">
                            <span className="absolute top-3 left-3 px-2 py-0.5 bg-white/90 text-slate-600 text-[10px] font-mono font-bold rounded shadow-xs z-10">
                              {bike.code}
                            </span>
                            <span className="absolute top-3 right-3 px-2.5 py-0.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[9px] font-extrabold uppercase rounded-full z-10 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span> Currently Rented
                            </span>
                            <div className="text-slate-300 transform group-hover:scale-105 transition duration-300">
                              <svg className="w-28 h-28" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                                <circle cx="5.5" cy="17.5" r="3.5"></circle>
                                <circle cx="18.5" cy="17.5" r="3.5"></circle>
                                <path d="M15 17.5V11L12 7H9L7 13"></path>
                                <path d="M12 17.5V13h3.5"></path>
                                <path d="M8 8h3"></path>
                              </svg>
                            </div>
                            <div className="absolute bottom-2 inset-x-2 py-1 bg-brand-primary/90 text-white text-[10px] font-bold text-center rounded">
                              Will be available soon
                            </div>
                          </div>
                        ) : (
                          <div className="relative h-44 bike-card-backdrop flex items-center justify-center overflow-hidden">
                            <span className="absolute top-3 left-3 px-2 py-0.5 bg-white/90 text-slate-600 text-[10px] font-mono font-bold rounded shadow-xs">
                              {bike.code}
                            </span>
                            <span className="absolute top-3 right-3 px-2.5 py-0.5 bg-brand-mintLight text-brand-dark border border-brand-mint/30 text-[10px] font-extrabold uppercase rounded-full">
                              ● Available
                            </span>
                            <div className="text-brand-primary transform group-hover:scale-105 transition duration-300">
                              <svg className="w-28 h-28" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                                <circle cx="5.5" cy="17.5" r="3.5"></circle>
                                <circle cx="18.5" cy="17.5" r="3.5"></circle>
                                <path d="M15 17.5V11L12 7H9L7 13"></path>
                                <path d="M12 17.5V13h3.5"></path>
                                <path d="M8 8h3"></path>
                              </svg>
                            </div>
                          </div>
                        )}

                        <div className="p-5 space-y-2">
                          <h4 className="font-bold text-base text-slate-900 leading-snug font-display">${bike.name}</h4>
                          <p className="text-xs text-slate-400 font-medium">${bike.brand}</p>
                          <div className="flex items-center text-xs font-semibold text-slate-800 pt-0.5">
                            <span className="text-slate-900">★★★★☆</span>
                            <span className="ml-1.5 font-bold text-slate-900 text-xs">{bike.rating}</span>
                            <span className="ml-1 text-slate-400 font-normal">({bike.reviews})</span>
                          </div>
                          <div className="flex items-baseline space-x-1 pt-1">
                            <span className="text-lg font-extrabold text-slate-900 font-display">{money(bike.rate, currency)}</span>
                            <span className="text-xs text-slate-400 font-normal">/hour</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                            <span className="truncate">{bike.station}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 pt-0 space-y-3">
                        <span className="inline-block px-2 py-1 text-[10px] font-bold tracking-wider bg-slate-100 text-slate-500 rounded uppercase">HOURLY RATE</span>
                        {isMaintenance ? (
                          <button disabled className="w-full py-2.5 bg-[#e9ecef] text-slate-500 font-bold text-xs rounded-xl flex items-center justify-center cursor-not-allowed border border-slate-300/80 shadow-xs">
                            Under Maintenance
                          </button>
                        ) : isRented ? (
                          <button disabled className="w-full py-2.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                            Currently Rented
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/reserve?bike=${bike.id}`)}
                            className="w-full py-2.5 bg-brand-dark hover:bg-brand-primary active:bg-brand-dark text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition transform hover:scale-[1.02] cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                            Rent Now
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* BEGIN: Pagination Section */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-6 pb-2" data-purpose="catalog-pagination">
                <nav aria-label="Pagination" className="flex items-center space-x-1.5 text-xs font-semibold">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); catalogSectionRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                    className={`w-8 h-8 rounded-lg border border-brand-border flex items-center justify-center transition ${
                      currentPage === 1 ? "bg-white text-slate-300 cursor-not-allowed" : "bg-white text-slate-500 hover:bg-slate-100 cursor-pointer"
                    }`}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => { setCurrentPage(p); catalogSectionRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                        currentPage === p
                          ? "bg-brand-dark text-white font-bold shadow-xs"
                          : "border border-brand-border bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  {totalPages > 5 && (
                    <>
                      <span className="px-1 text-slate-400">...</span>
                      <button
                        onClick={() => { setCurrentPage(totalPages); catalogSectionRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                        className={`w-8 h-8 rounded-lg border border-brand-border flex items-center justify-center transition cursor-pointer ${
                          currentPage === totalPages
                            ? "bg-brand-dark text-white font-bold"
                            : "bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); catalogSectionRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                    className={`w-8 h-8 rounded-lg border border-brand-border flex items-center justify-center transition ${
                      currentPage === totalPages ? "bg-white text-slate-300 cursor-not-allowed" : "bg-white text-slate-500 hover:bg-slate-100 cursor-pointer"
                    }`}
                  >
                    &gt;
                  </button>
                </nav>
                <div className="text-xs text-slate-500">
                  Showing <span className="font-bold text-slate-800">{totalBikes === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalBikes)}</span> of {totalBikes} bikes
                </div>
              </div>
              {/* END: Pagination Section */}
            </section>
            {/* END: Bike Catalog Grid & Controls */}
          </div>
          {/* END: Catalog Main Layout */}

          {/* BEGIN: Value Proposition Cards (EasyRide Style) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4" data-purpose="value-proposition-cards">
            {/* Pricing Guarantee Card */}
            <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 flex flex-col justify-between shadow-xs">
              <div className="space-y-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-accent">Clear Price, No Surprises</span>
                <h3 className="text-2xl font-display font-extrabold text-brand-dark">A simple hourly rate.</h3>
                <p className="text-slate-600 text-sm max-w-sm">
                  The current configured rate is charged strictly by the hour. Your final transparent amount is auto-calculated when the bicycle is returned.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="inline-flex items-baseline px-5 py-2.5 bg-brand-surface border border-brand-border rounded-2xl">
                  <span className="text-xl font-extrabold font-display text-brand-dark">{money(100, currency)}</span>
                  <span className="text-xs font-semibold text-slate-500 ml-1.5 uppercase">Per Hour Avg</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">Instant mobile money &amp; card checkout</span>
              </div>
            </div>

            {/* Fleet Quality Card */}
            <div className="bg-gradient-to-br from-[#eaf2f1] to-[#e1ecea] rounded-3xl border border-brand-border/60 p-6 sm:p-8 flex flex-col justify-between shadow-xs relative overflow-hidden">
              <div className="space-y-3 relative z-10">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark">Before You Roll</span>
                <h3 className="text-2xl font-display font-extrabold text-brand-dark">Recorded condition is your first check.</h3>
                <p className="text-slate-700 text-sm max-w-sm">
                  Availability reflects live recorded status. Inspect the bicycle before leaving the docking bay and report any issue to station marshals.
                </p>
              </div>
              <div className="mt-6 flex items-center space-x-2 text-xs font-bold text-brand-dark relative z-10">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                <span>Student &amp; Campus Verified Friendly</span>
              </div>
            </div>
          </section>
          {/* END: Value Proposition Cards */}
        </main>
      </div>

      {/* BEGIN: Footer */}
      <footer className="border-t border-brand-border bg-white text-slate-500 text-xs py-6 mt-12" data-purpose="site-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-brand-dark font-display">BikeRent Uganda</span>
            <span>—</span>
            <span>Guest Public Dashboard · Makerere routes · Kampala, Uganda</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <a className="hover:text-brand-dark cursor-pointer" onClick={() => showToast("Safety Guidelines", "Always wear the provided helmet and obey university path speed limits.")}>Safety Guidelines</a>
            <a className="hover:text-brand-dark cursor-pointer" onClick={() => setHubsModalOpen(true)}>Station Locations</a>
            <a className="hover:text-brand-dark cursor-pointer" onClick={() => showToast("Terms", "Bikes must be returned to an authorized dock in Kampala.")}>Terms of Service</a>
          </div>
        </div>
      </footer>
      {/* END: Footer */}


      {/* Orders Modal */}
      {ordersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-brand-border space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-dark text-white flex items-center justify-center">
                  <svg className="w-4 h-4 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-brand-dark">My Active &amp; Past Rides</h3>
                  <p className="text-[11px] text-slate-400">{currentUser?.name || "Atugonza"} · Customer Fleet Portal</p>
                </div>
              </div>
              <button onClick={() => setOrdersModalOpen(false)} className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1 text-xs">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <svg className="w-10 h-10 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path></svg>
                  <p className="font-bold text-slate-600">No active or past rentals yet</p>
                  <p className="text-[11px]">Select any available bike from the catalog to book your first ride.</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.orderId} className={`p-4 rounded-2xl border ${order.status === "active" ? "border-brand-mint bg-emerald-50/40" : "border-slate-200 bg-white"} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{order.bikeName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${order.status === "active" ? "bg-brand-mintLight text-brand-dark" : "bg-slate-100 text-slate-500"}`}>
                        {order.status === "active" ? "● On Ride" : "Returned"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between text-slate-500 text-[11px] pt-1">
                      <span>Code: <b>{order.bikeCode}</b></span>
                      <span>Hub: <b>{order.station}</b></span>
                      <span>Amount: <b className="text-brand-dark">{money(order.totalAmount, currency)}</b></span>
                    </div>
                    {order.status === "active" && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleReturnBike(order.orderId)}
                          className="px-3 py-1.5 bg-brand-dark hover:bg-brand-primary text-white text-[11px] font-bold rounded-lg cursor-pointer transition"
                        >
                          Return Bike &amp; Complete Trip
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button onClick={() => setOrdersModalOpen(false)} className="px-5 py-2.5 bg-brand-dark text-white text-xs font-bold rounded-xl cursor-pointer">
                Close Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Hubs Drawer */}
      {hubsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-brand-border space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-mintLight text-brand-dark flex items-center justify-center font-bold">
                  <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-brand-dark">Kampala Live Stations</h3>
                  <p className="text-[11px] text-slate-400">Real-time dock availability &amp; marshals on site</p>
                </div>
              </div>
              <button onClick={() => setHubsModalOpen(false)} className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 text-xs">
              {KAMPALA_STATIONS.map((station) => {
                const availableCount = fleet.filter((b) => b.station === station.name && b.status === "available").length;
                return (
                  <div
                    key={station.name}
                    onClick={() => { setLocation(station.name); setHubsModalOpen(false); setCurrentPage(1); catalogSectionRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-brand-primary/40 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-mintLight text-brand-dark flex items-center justify-center font-bold text-xs">
                        ⚲
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900">{station.name}</h5>
                        <p className="text-[11px] text-slate-400">{station.desc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {availableCount} bikes ready
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Marshal on duty</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-brand-dark text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-brand-mint/40 animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-6 h-6 rounded-full bg-brand-mint flex items-center justify-center text-brand-dark font-bold text-xs">✓</div>
          <div>
            <h5 className="font-bold text-xs">{toast.title}</h5>
            <p className="text-[11px] text-slate-200">{toast.desc}</p>
          </div>
        </div>
      )}
    </div>
  );
}
