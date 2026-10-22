/**
 * Bike reservation screen.
 *
 * Opened from "Rent Now" on the customer dashboard. It shows the bike that
 * was picked, the depot it sits at and the booking controls (duration,
 * pickup time, payment rail) that turn into a hire.
 *
 * The booking is written to the rider-app order list and mirrored into the
 * shared state, so the station team sees the bike as borrowed straight away.
 */

import { useMemo, useState, type ReactNode } from "react";
import { useSearch } from "wouter";
import type { EasyRideState } from "@workspace/api-client-react";
import type { EasyRideUser } from "@/hooks/use-auth";
import {
  bookCustomerBike,
  DAY_PASS_DISCOUNT,
  DAY_PASS_HOURS,
  hireAmount,
  KAMPALA_STATIONS,
  type CustomerPaymentMethod,
} from "@/lib/customer-bridge";
import { money } from "@/lib/format";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  loadCustomerFleet,
  type CustomerFleetBike,
} from "@/components/customer-view";

const MAX_HOURS = 24;

const PAYMENT_OPTIONS: {
  id: CustomerPaymentMethod;
  label: string;
  note: string;
  icon: ReactNode;
}[] = [
  {
    id: "visa",
    label: "Visa card",
    note: "Visa & Mastercard",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <rect height="14" rx="2" strokeWidth="2" width="18" x="3" y="5" />
        <line strokeWidth="2" x1="3" x2="21" y1="10" y2="10" />
      </svg>
    ),
  },
  {
    id: "mobile_money",
    label: "Mobile money",
    note: "MTN & Airtel",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <rect height="20" rx="2" strokeWidth="2" width="10" x="7" y="2" />
        <line strokeWidth="2" x1="11" x2="13" y1="18" y2="18" />
      </svg>
    ),
  },
  {
    id: "cash",
    label: "Use cash at station",
    note: "Pay on unlock",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <rect height="12" rx="2" strokeWidth="2" width="20" x="2" y="6" />
        <circle cx="12" cy="12" r="2" strokeWidth="2" />
      </svg>
    ),
  },
];

/** Neutral placeholder glyph shown before a payment method is picked. */
function WalletIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M19 7V5a1 1 0 00-1-1H5a2 2 0 000 4h14a1 1 0 011 1v3m0 0v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

/** Real bike catalogue photo used for each bike family. */
const BIKE_IMAGES: Record<string, string> = {
  mountain: "/bikes/trek-marlin-7.jpg",
  city: "/bikes/schwinn-wayfarer.jpg",
  hybrid: "/bikes/trek-fx-3.jpg",
  electric: "/bikes/specialized-turbo-vado.jpg",
  racing: "/bikes/specialized-allez.jpg",
};

const BIKE_SPECS: Record<
  string,
  { drivetrain: string; suspension: string; weight: string; tagline: string }
> = {
  mountain: {
    drivetrain: "12-spd Shimano",
    suspension: "Fox 36 Float",
    weight: "13.8 kg",
    tagline: '29" Full Suspension',
  },
  city: {
    drivetrain: "8-spd Shimano",
    suspension: "Rigid Fork",
    weight: "12.4 kg",
    tagline: "Urban Commuter",
  },
  hybrid: {
    drivetrain: "9-spd Shimano",
    suspension: "Front Suspension",
    weight: "13.1 kg",
    tagline: "Fitness Hybrid",
  },
  electric: {
    drivetrain: "8-spd Shimano",
    suspension: "Rigid Fork",
    weight: "21.5 kg",
    tagline: "E-Assist Drive",
  },
  racing: {
    drivetrain: "12-spd Shimano",
    suspension: "Rigid Carbon",
    weight: "7.9 kg",
    tagline: "Road Race Rig",
  },
};

/** Station contact details used on the depot card. */
const DEPOT_PHONE = "256-772-111310";

function defaultPickupTime(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

/** The rider catalogue, rebuilt from the published catalogue when needed. */
function loadFleet(): CustomerFleetBike[] {
  return loadCustomerFleet();
}

export function ReservationView({
  state,
  save,
  currentUser,
  onBack,
  onBooked,
}: {
  state?: EasyRideState;
  save?: (state: EasyRideState) => void;
  currentUser?: EasyRideUser | null;
  /** Go back to the fleet (usually the customer dashboard). */
  onBack?: () => void;
  /** Called once the booking is recorded. */
  onBooked?: (orderId: string) => void;
}) {
  const currency = state?.config.currency ?? "UGX";
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const requestedId = params.get("bike");

  const fleet = useMemo(() => loadFleet(), []);
  const bike = useMemo(
    () =>
      fleet.find((b) => b.id === requestedId) ??
      fleet.find((b) => b.status === "available") ??
      fleet[0],
    [fleet, requestedId],
  );

  const [hours, setHours] = useState(1);
  const [pickupTime, setPickupTime] = useState(defaultPickupTime);
  const [paymentMethod, setPaymentMethod] =
    useState<CustomerPaymentMethod | null>(null);
  // The rider types their own details on the bike — nothing is pre-filled
  // from the signed-in account.
  const [riderName, setRiderName] = useState("");
  const [phone, setPhone] = useState("");
  const [riderDetailsShown, setRiderDetailsShown] = useState(false);

  const isDayPass = hours >= DAY_PASS_HOURS;
  const subtotal = bike ? bike.rate * hours : 0;
  const discount = isDayPass ? subtotal * DAY_PASS_DISCOUNT : 0;
  const total = bike ? hireAmount(bike.rate, hours) : 0;
  const hasRiderDetails =
    riderName.trim().length > 0 && phone.trim().length > 0;
  const canBook =
    Boolean(bike) &&
    bike?.status === "available" &&
    paymentMethod !== null &&
    hasRiderDetails;
  const activePayment = PAYMENT_OPTIONS.find(
    (option) => option.id === paymentMethod,
  );
  /**
   * The rider details are shown whenever they still need filling in (they
   * start empty), and stay on screen once a payment method has been picked.
   */
  const showRiderDetails =
    riderDetailsShown || activePayment !== null || !hasRiderDetails;

  const station = KAMPALA_STATIONS.find((s) => s.name === bike?.station);
  const specs = BIKE_SPECS[bike?.type ?? "city"] ?? BIKE_SPECS.city;
  // The bike's own photo wins; the family photo is only the fallback.
  const bikeImage =
    bike?.image ?? BIKE_IMAGES[bike?.type ?? "city"] ?? BIKE_IMAGES.city;

  /** The four hubs shown in the station strip, always including this depot. */
  const stationStrip = useMemo(() => {
    const open = KAMPALA_STATIONS.slice(0, 4);
    if (bike && !open.some((s) => s.name === bike.station)) {
      const own = KAMPALA_STATIONS.find((s) => s.name === bike.station);
      if (own) return [...open.slice(0, 3), own];
    }
    return open;
  }, [bike]);

  const handleBook = () => {
    if (!bike) return;
    if (!paymentMethod) {
      toast({
        title: "Choose a payment method",
        description: "Select how you want to pay before booking this bike.",
      });
      return;
    }
    if (!hasRiderDetails) {
      toast({
        title: "Rider details needed",
        description: "Add your name and mobile money number to continue.",
      });
      return;
    }
    if (!state || !save) {
      toast({
        title: "Booking unavailable",
        description: "The fleet is still loading. Try again in a moment.",
      });
      return;
    }
    if (bike.status !== "available") {
      toast({
        title: "Bike not available",
        description: `${bike.name} is currently ${bike.status}. Pick another bike.`,
      });
      return;
    }

    const result = bookCustomerBike(state, {
      bike: {
        id: bike.id,
        code: bike.code,
        name: bike.name,
        type: bike.type,
        station: bike.station,
        rate: bike.rate,
      },
      hours,
      customerName: riderName,
      phone,
      paymentMethod,
      pickupTime,
    });

    save(result.state);
    toast({
      title: "Rental confirmed",
      description: `${bike.name} reserved at ${bike.station}. Total ${money(
        total,
        currency,
      )}.`,
    });
    onBooked?.(result.order.orderId);
  };

  if (!bike) {
    return (
      <div className="min-h-screen bg-[#f8fafb] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-8 text-center max-w-md">
          <h1 className="text-xl font-extrabold text-brand-800">
            No bike selected
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Head back to the catalogue and pick a bike to reserve.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-5 px-5 py-2.5 rounded-xl bg-brand-800 text-white text-xs font-bold"
          >
            Back to Browse Bikes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafb] text-slate-800 font-sans antialiased flex flex-col justify-between">
      {/* BEGIN: MainHeader */}
      <header
        className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-xs"
        data-purpose="primary-navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Left: Brand Logo */}
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-3 shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 rounded-lg p-1"
              data-purpose="brand-logo"
            >
              <div className="w-11 h-11 rounded-2xl bg-brand-800 flex items-center justify-center text-amberAccent-400 shadow-md group-hover:scale-105 transition-transform duration-200">
                <svg
                  className="w-6 h-6 stroke-[2.2]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="5.5" cy="17.5" r="3.5" />
                  <circle cx="18.5" cy="17.5" r="3.5" />
                  <path
                    d="M15 6h-3.5L8.5 12.5H5.5M12 17.5V11l3-5 3.5 1.5M12 11l4.5 6.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="leading-tight text-left">
                <span className="text-xl font-bold tracking-tight text-brand-800 block">
                  EasyRide
                </span>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                  Bicycle Rental
                </span>
              </div>
            </button>

            {/* Center: Search Input Bar */}
            <div
              className="hidden md:flex flex-1 max-w-xl mx-4"
              data-purpose="search-bar"
            >
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M21 21l-4.35-4.35m1.85-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <input
                  className="w-full pl-11 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-700 focus:bg-white focus:ring-2 focus:ring-brand-700/20 transition-all duration-150"
                  placeholder="Search for bikes, models, stations, or locations..."
                  type="text"
                />
                <button className="absolute inset-y-1.5 right-1.5 px-4 bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5">
                  Search
                </button>
              </div>
            </div>

            {/* Right: Utility Links & User Avatar */}
            <div
              className="flex items-center gap-3 sm:gap-4 shrink-0"
              data-purpose="user-navigation"
            >
              <button
                type="button"
                onClick={() =>
                  toast({
                    title: "Notifications",
                    description: "Your bike is ready at the dock.",
                  })
                }
                className="p-2.5 text-slate-500 hover:text-brand-800 hover:bg-slate-100 rounded-full transition-colors relative"
                title="Notifications"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
                <span className="absolute top-2 right-2 w-2 h-2 bg-amberAccent-500 rounded-full ring-2 ring-white" />
              </button>

              <button
                type="button"
                onClick={() =>
                  toast({
                    title: "Saved bicycles",
                    description: "Bookmark favourite models from the catalogue.",
                  })
                }
                className="p-2.5 text-slate-500 hover:text-brand-800 hover:bg-slate-100 rounded-full transition-colors hidden sm:flex"
                title="Saved Bicycles"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </button>

              <div className="h-6 w-px bg-slate-200 hidden sm:block" />

              <div className="flex items-center gap-3 pl-1 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-brand-800 text-white font-bold flex items-center justify-center text-sm shadow ring-2 ring-brand-100">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
                <div className="text-left hidden lg:block leading-tight">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Hello,
                  </span>
                  <span className="text-sm font-bold text-brand-800 flex items-center gap-1">
                    {(currentUser?.name || "Atugonza").toUpperCase()}
                    <svg
                      className="w-3.5 h-3.5 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M19 9l-7 7-7-7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* END: MainHeader */}

      {/* BEGIN: BreadcrumbNavigation */}
      <section className="bg-white border-b border-slate-200" data-purpose="breadcrumbs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 hover:text-brand-600 transition-colors group"
            >
              <svg
                className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                />
              </svg>
              <span>Back to Browse Bikes</span>
            </button>

            <nav className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <button
                type="button"
                onClick={onBack}
                className="hover:text-slate-800"
              >
                Home
              </button>
              <span className="text-slate-300">/</span>
              <button
                type="button"
                onClick={onBack}
                className="hover:text-slate-800"
              >
                Fleet Inventory
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-brand-800 font-semibold">
                {bike.name} ({bike.code})
              </span>
            </nav>
          </div>
        </div>
      </section>
      {/* END: BreadcrumbNavigation */}

      {/* BEGIN: MainReservationContent */}
      <main className="flex-1 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ================= LEFT COLUMN: BIKE SHOWCASE & DETAILS ================= */}
            <div className="lg:col-span-7 space-y-6">
              {/* Hero Media Card */}
              <div
                className="bg-white rounded-3xl border border-slate-200 shadow-card p-4 sm:p-6 relative overflow-hidden"
                data-purpose="bike-media-card"
              >
                <div className="flex items-center justify-between mb-4 z-10 relative">
                  {bike.status === "available" ? (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs tracking-wide shadow-xs">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                      </span>
                      <span>Available for Immediate Ride</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-xs tracking-wide shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>
                        {bike.status === "rented"
                          ? "Currently Rented"
                          : "Under Maintenance"}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      toast({
                        title: "Saved to wishlist",
                        description: `${bike.name} was added to your favourites.`,
                      })
                    }
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-white hover:border-slate-300 shadow-xs transition duration-150"
                    title="Add to Wishlist"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </button>
                </div>

                <div className="relative w-full aspect-[4/3] rounded-2xl bg-gradient-to-b from-[#f1f5f7] to-[#e7ecef] overflow-hidden flex items-center justify-center group">
                  <div className="absolute top-3 left-3 bg-brand-800/80 backdrop-blur text-white text-[11px] font-mono font-medium px-2.5 py-1 rounded-md z-10">
                    FRAME ID: {bike.code.replace("#", "")}
                  </div>
                  <img
                    alt={`${bike.name} - studio side profile`}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 ease-out"
                    src={bikeImage}
                  />
                  <span className="absolute bottom-3 right-4 text-xs font-mono font-medium text-slate-400/80 pointer-events-none">
                    {bike.brand.toUpperCase()} • {specs.tagline.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Bike Specifications, Model Meta & Location Card */}
              <div
                className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-subtle space-y-6"
                data-purpose="bike-details-section"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-800 border border-brand-200">
                      {bike.type}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      {bike.code}
                    </span>
                    {bike.certified && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pro
                        Fleet
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-800 tracking-tight">
                    {bike.name}
                  </h1>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    {bike.brand} Professional Frame • 29-inch Tubeless Maxxis
                    Tires
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center text-amberAccent-500 gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <svg
                          key={index}
                          className="w-4 h-4 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-bold text-slate-800">
                      {bike.rating}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        toast({
                          title: "Verified rider reviews",
                          description: `${bike.reviews} riders reviewed the ${bike.name}.`,
                        })
                      }
                      className="text-xs font-semibold text-brand-700 underline decoration-brand-500/50 hover:text-brand-800"
                    >
                      {bike.reviews} verified rider reviews
                    </button>
                  </div>
                </div>

                {/* Key Feature Specs Row */}
                <div className="grid grid-cols-3 gap-3 py-3 border-y border-slate-100">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-medium text-slate-400 block uppercase">
                      Drivetrain
                    </span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                      {specs.drivetrain}
                    </span>
                    <span className="text-[10px] text-slate-500">Deore system</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-medium text-slate-400 block uppercase">
                      Suspension
                    </span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                      {specs.suspension}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Tuned for city routes
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-medium text-slate-400 block uppercase">
                      Bike Weight
                    </span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                      {specs.weight}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Ultralight alloy/carbon
                    </span>
                  </div>
                </div>

                {/* Depot Location Card */}
                <div
                  className="p-4 sm:p-5 rounded-2xl bg-[#f7fafb] border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  data-purpose="pickup-depot-card"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-800 shrink-0 shadow-xs">
                      <svg
                        className="w-5 h-5 text-brand-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                        <path
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {bike.station}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Depot Hub #{String(
                            (KAMPALA_STATIONS.findIndex(
                              (s) => s.name === bike.station,
                            ) + 1) || 1,
                          ).padStart(2, "0")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {station?.desc ?? "Rider-app pickup point"} • Dock Stand 04
                      </p>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-slate-600 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            />
                          </svg>
                          {DEPOT_PHONE}
                        </span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            />
                          </svg>
                          Open Daily (07:00 - 21:00)
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      toast({
                        title: `${bike.station}`,
                        description: "Map view opens in the rider app.",
                      })
                    }
                    className="shrink-0 text-xs font-bold text-brand-800 bg-white hover:bg-slate-100 border border-slate-200 py-2 px-3 rounded-xl transition-colors"
                  >
                    View on Map
                  </button>
                </div>

                {/* Safety & Maintenance Note */}
                <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-amber-900 block text-sm">
                      Recorded condition is your first check
                    </span>
                    <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                      Hydraulic brakes and tire pressure inspected 2 hours ago.
                      Remember to inspect the chain and frame at{" "}
                      {bike.station} before unlocking.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= RIGHT COLUMN: BOOKING & CHECKOUT SIDEBAR ================= */}
            <div className="lg:col-span-5">
              <div
                className="sticky top-28 bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-7 space-y-6"
                data-purpose="booking-summary-card"
              >
                {/* Price Display Header */}
                <div className="flex items-baseline justify-between pb-5 border-b border-slate-100">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                      Current Rate
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-3xl sm:text-4xl font-extrabold text-brand-800 tracking-tight">
                        {money(bike.rate, currency)}
                      </span>
                      <span className="text-slate-500 font-medium text-sm">
                        /hour
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                        />
                      </svg>
                      Flat Campus Rate
                    </span>
                    <span className="block text-[11px] text-slate-400 mt-1">
                      Includes helmet &amp; lock
                    </span>
                  </div>
                </div>

                {/* Booking Input Form */}
                <form
                  className="space-y-5"
                  data-purpose="reservation-controls"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleBook();
                  }}
                >
                  {/* Rental Duration Stepper */}
                  <div>
                    <label className="block text-[11px] font-extrabold tracking-wider uppercase text-slate-700 mb-2">
                      Rental Duration (Hours)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Decrease duration"
                        onClick={() => setHours((h) => Math.max(1, h - 1))}
                        disabled={hours <= 1}
                        className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-colors border border-slate-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <div className="flex-1 h-12 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-center font-bold text-slate-800 text-base shadow-inner">
                        {hours} {hours === 1 ? "hour" : "hours"}
                      </div>
                      <button
                        type="button"
                        aria-label="Increase duration"
                        onClick={() =>
                          setHours((h) => Math.min(MAX_HOURS, h + 1))
                        }
                        disabled={hours >= MAX_HOURS}
                        className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-colors border border-slate-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-1.5 px-1 text-[11px] text-slate-400 font-medium">
                      <span>Minimum: 1 hr</span>
                      <span className={isDayPass ? "text-emerald-600 font-bold" : ""}>
                        Day Pass: 8+ hrs (20% off)
                      </span>
                    </div>
                  </div>

                  {/* Pickup Time Field */}
                  <div>
                    <label className="block text-[11px] font-extrabold tracking-wider uppercase text-slate-700 mb-2">
                      Pickup Time
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-12 px-4 pr-11 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-700 focus:border-brand-700 transition"
                        type="datetime-local"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg
                          className="w-5 h-5 text-slate-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        htmlFor="payment-method"
                        className="block text-[11px] font-extrabold tracking-wider uppercase text-slate-700"
                      >
                        Payment Method
                      </label>
                      <span className="text-[10px] font-bold text-brand-700 uppercase">
                        [{activePayment ? activePayment.label : "Select a method"}]
                      </span>
                    </div>

                    <Select
                      value={paymentMethod ?? ""}
                      onValueChange={(value) => {
                        setPaymentMethod(value as CustomerPaymentMethod);
                        setRiderDetailsShown(true);
                      }}
                    >
                      <SelectTrigger
                        id="payment-method"
                        aria-label="Payment method"
                        className={cn(
                          "h-12 w-full rounded-xl border-slate-200 bg-slate-50/70 px-4 text-sm font-semibold shadow-none",
                          "focus:ring-2 focus:ring-brand-700 focus:border-brand-700",
                          "data-[placeholder]:font-medium data-[placeholder]:text-slate-400",
                          !activePayment && "border-dashed",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              activePayment
                                ? "bg-brand-800 text-amberAccent-400 shadow-xs"
                                : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {activePayment?.icon ?? <WalletIcon />}
                          </span>
                          <span
                            className={activePayment ? "text-slate-800" : "text-slate-400"}
                          >
                            {activePayment
                              ? activePayment.label
                              : "Select a payment method"}
                          </span>
                        </div>
                      </SelectTrigger>

                      <SelectContent className="rounded-2xl border-slate-200 p-1.5">
                        {PAYMENT_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.id}
                            value={option.id}
                            className="rounded-xl py-2.5 pl-3 pr-9 focus:bg-brand-50 focus:text-brand-800"
                          >
                            <span className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                {option.icon}
                              </span>
                              <span className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800">
                                  {option.label}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {option.note}
                                </span>
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {!activePayment && (
                      <p className="mt-1.5 px-1 text-[11px] font-medium text-amber-700">
                        Choose how you want to pay — mobile money, card or cash
                        on unlock.
                      </p>
                    )}
                    {activePayment && !hasRiderDetails && (
                      <p className="mt-1.5 px-1 text-[11px] font-medium text-amber-700">
                        Add your name and mobile money number below to continue.
                      </p>
                    )}
                  </div>

                  {/* Rider Details — revealed once a payment method is picked */}
                  {showRiderDetails && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div>
                        <label
                          htmlFor="rider-name"
                          className="block text-[11px] font-extrabold tracking-wider uppercase text-slate-700 mb-2"
                        >
                          Rider Name
                        </label>
                        <input
                          id="rider-name"
                          className="w-full h-11 px-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-700 focus:border-brand-700 transition"
                          type="text"
                          placeholder="e.g. Atugonza Namutebi"
                          value={riderName}
                          onChange={(e) => setRiderName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="rider-phone"
                          className="block text-[11px] font-extrabold tracking-wider uppercase text-slate-700 mb-2"
                        >
                          {activePayment?.id === "cash"
                            ? "Contact Number"
                            : "Mobile Money Number"}
                        </label>
                        <input
                          id="rider-phone"
                          className="w-full h-11 px-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-700 focus:border-brand-700 transition"
                          type="tel"
                          placeholder="+256 7xx xxx xxx"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Price Breakdown Details */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Selected Duration:</span>
                      <span className="font-bold text-slate-700">
                        {hours} {hours === 1 ? "hour" : "hours"}
                      </span>
                    </div>
                    {isDayPass && (
                      <div className="flex justify-between text-slate-500">
                        <span>Day Pass Discount:</span>
                        <span className="font-bold text-emerald-700">
                          −{money(discount, currency)} (20%)
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500">
                      <span>Deposit &amp; Insurance:</span>
                      <span className="text-emerald-700 font-bold">
                        Waived (Student/Rider Tier)
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Pickup Station:</span>
                      <span className="font-bold text-slate-700">
                        {bike.station} (Bay 04)
                      </span>
                    </div>
                  </div>

                  {/* Total Amount Highlight */}
                  <div className="pt-4 border-t border-slate-200 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block">
                        Total Amount
                      </span>
                      <span className="text-xs text-slate-500">
                        {activePayment
                          ? `Payable via ${activePayment.label} on unlock`
                          : "Choose a payment method to continue"}
                      </span>
                    </div>
                    <span className="text-3xl font-black text-brand-800 tracking-tight">
                      {money(total, currency)}
                    </span>
                  </div>

                  {/* Primary Action CTA Button */}
                  <button
                    type="submit"
                    disabled={!canBook}
                    className="w-full py-4 px-6 rounded-2xl bg-brand-800 hover:bg-brand-900 active:scale-[0.99] text-white font-bold text-base shadow-lg shadow-brand-800/25 flex items-center justify-center gap-3 transition-all duration-150 group disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <svg
                      className="w-5 h-5 text-amberAccent-400 group-hover:rotate-6 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.2"
                      />
                    </svg>
                    <span>
                      {bike.status !== "available"
                        ? bike.status === "rented"
                          ? "Currently Rented"
                          : "Under Maintenance"
                        : !activePayment
                          ? "Select a payment method"
                          : !hasRiderDetails
                            ? "Add rider details"
                            : `Book Now - ${money(total, currency)}`}
                    </span>
                  </button>
                </form>

                {/* Trust Badges & Guarantee List */}
                <div
                  className="pt-2 border-t border-slate-100 space-y-2.5"
                  data-purpose="trust-badges"
                >
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                    <svg
                      className="w-4 h-4 text-emerald-600 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    <span>
                      Secure automated payment processing via MTN/Airtel
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                    <svg
                      className="w-4 h-4 text-brand-600 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    <span>Free reservation cancellation within 1 hour</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                    <svg
                      className="w-4 h-4 text-amberAccent-500 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    <span>24/7 dedicated dispatch &amp; roadside assistance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BEGIN: ActiveStationsStrip */}
          <section
            className="mt-12 pt-8 border-t border-slate-200"
            data-purpose="pickup-stations-indicator"
          >
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700 tracking-wide">
                  Pickup &amp; Dropoff Stations (4 Open):
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                {stationStrip.map((depot) => {
                  const selected = depot.name === bike.station;
                  return (
                    <div
                      key={depot.name}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium ${
                        selected
                          ? "bg-brand-50 border border-brand-200 font-bold text-brand-800"
                          : "bg-slate-50 border border-slate-200 text-slate-700"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          selected ? "bg-emerald-500" : "bg-brand-800"
                        }`}
                      />
                      <span>{depot.name}</span>
                      {selected ? (
                        <span className="px-1.5 py-0.2 rounded-full bg-brand-800 text-white font-bold text-[10px]">
                          Selected (Bay 04)
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {depot.count} bikes
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
          {/* END: ActiveStationsStrip */}
        </div>
      </main>
      {/* END: MainReservationContent */}

      {/* BEGIN: MainFooter */}
      <footer
        className="mt-16 bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400"
        data-purpose="site-footer"
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-bold text-brand-800">EasyRide</span>
            <span>•</span>
            <span>Guest &amp; Rider Reservation Dashboard</span>
            <span>•</span>
            <span>Kampala &amp; Arua Hubs</span>
          </div>
          <div>
            <span>
              System Status:{" "}
              <span className="text-emerald-600 font-semibold">
                All Stations Operational
              </span>
            </span>
          </div>
        </div>
      </footer>
      {/* END: MainFooter */}
    </div>
  );
}

export default ReservationView;
