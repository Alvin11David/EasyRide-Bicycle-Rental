import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  ArrowLeft, ArrowRight, Bike, Building2,
  Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clock3, Compass,
  Flame, Lock, LogOut, MapPin, Menu, Mountain,
  Search, ShieldAlert, ShieldCheck, Shuffle,
  User, UserPlus, Wrench, X, Zap,
} from "lucide-react";
import type {
  EasyRideBicycle, EasyRideState, EasyRideStation,
} from "@workspace/api-client-react";
import { useEasyRide } from "@/hooks/use-easyride";
import { useAuth, type EasyRideUser, type UserRole, DEFAULT_USERS } from "@/hooks/use-auth";
import { AuthPanel } from "@/components/auth-page";
import { CustomerView } from "@/components/customer-view";
import ReservationView from "@/components/reservation-view";
import StaffDashboard from "@/components/staff-dashboard";
import { getBikeMeta } from "@/lib/mock-data";
import { money } from "@/lib/format";


function BikeSketch({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 230 125" fill="none" aria-hidden="true">
    <path d="M34 92a25 25 0 1 0 50 0 25 25 0 0 0-50 0Zm111 0a25 25 0 1 0 50 0 25 25 0 0 0-50 0Z" stroke="currentColor" strokeWidth="3"/>
    <path d="m59 92 31-46 26 46H59l17-26h39m0 0 25 26m-25-26 16-24h17m-71 4h18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M88 43h14m47-5h14" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
    <path d="M14 22c17-8 28-4 36 1m131 77c13 2 23-1 34-8" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 5" strokeLinecap="round"/>
  </svg>;
}

function Logo() {
  return <Link href="/" className="flex items-center gap-3 no-underline" data-testid="link-home">
    <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-800 text-amber-400 shadow-md"><Bike size={22} strokeWidth={2.2}/></span>
    <div><span className="block text-xl font-bold text-teal-900 tracking-tight leading-none">EasyRide</span><span className="block text-xs text-teal-700/70 font-medium">Bicycle Rental</span></div>
  </Link>;
}

function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "green" | "amber" | "red" | "neutral" | "teal" }) {
  const styles = {
    green: "bg-[#e5f0e3] text-[#35674c] border border-emerald-200/50",
    amber: "bg-[#f7ecd4] text-[#95651d] border border-amber-200/50",
    red: "bg-[#f7e4df] text-[#a34b3b] border border-rose-200/50",
    neutral: "bg-[#ecece5] text-[#67766d] border border-slate-200/50",
    teal: "bg-teal-50 text-teal-900 border border-teal-200/50",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[.08em] ${styles[tone]}`}>{children}</span>;
}

function PageTitle({ eyebrow, title, detail, side }: { eyebrow: string; title: string; detail: string; side?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mono mb-2 text-[10px] uppercase tracking-[.2em] text-[#6b8276] font-bold">{eyebrow}</p><h1 className="display text-[clamp(2.1rem,4.5vw,3.5rem)] font-extrabold leading-[.98] text-[#183c38]">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#68776e]">{detail}</p></div>{side}</div>;
}

function BikeCardArt() {
  return <div className="relative flex h-[150px] w-full items-center justify-center overflow-hidden rounded-[20px] bg-white md:w-[280px]">
    <img src="/bikes/bike-2.jpg" alt="Bicycle" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
    <div className="absolute inset-0 bg-gradient-to-t from-teal-900/40 to-transparent"></div>
    <span className="absolute bottom-3 left-4 text-[10px] uppercase tracking-[.18em] text-white font-bold">two wheels, your way</span>
    <span className="absolute right-4 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold text-teal-900">PEDAL POWER</span>
  </div>;
}

function SkeletonPage() {
  return <main className="mx-auto max-w-[1320px] px-5 py-10 md:px-8"><div className="h-3 w-28 animate-pulse rounded bg-[#dce4d8]"/><div className="mt-4 h-12 w-2/3 animate-pulse rounded bg-[#e4e8dd]"/><div className="mt-8 grid gap-5 md:grid-cols-3">{[0,1,2].map(x => <div key={x} className="panel h-52 animate-pulse bg-[#eeeee5]"/>)}</div></main>;
}

function MissingState({ error, retry }: { error?: unknown; retry: () => void }) {
  return <main className="mx-auto grid min-h-[65vh] max-w-xl place-items-center px-6 text-center"><div className="panel p-8"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f4e8d8] text-[#986d35]"><CircleAlert/></span><h1 className="display mt-4 text-3xl font-bold">We can’t reach the ride board.</h1><p className="mt-2 text-sm leading-6 text-[#68776e]">{error ? "The saved service records didn’t load. Check your connection and try again." : "There are no service records available yet."}</p><button onClick={retry} className="btn-primary mt-5 rounded-full px-5 py-2.5 text-sm font-semibold cursor-pointer" data-testid="button-retry">Try again</button></div></main>;
}

const bikeCategories = [
  { id: "All", label: "All", icon: Bike },
  { id: "Electric", label: "Electric", icon: Zap },
  { id: "Mountain", label: "Mountain", icon: Mountain },
  { id: "City", label: "City", icon: Building2 },
  { id: "Racing", label: "Racing", icon: Flame },
  { id: "Hybrid", label: "Hybrid", icon: Shuffle },
] as const;

function Topbar({
  activePath,
  currentUser,
  onOpenAuth,
  onSignOut,
  onQuickDemoLogin,
}: {
  activePath: string;
  currentUser: EasyRideUser | null;
  onOpenAuth: (mode: "signin" | "signup", role?: UserRole) => void;
  onSignOut: () => void;
  onQuickDemoLogin: (role: UserRole) => void;
}) {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isRider = activePath === "/rider" || activePath === "/rentals";
  const isStaff = activePath === "/staff" || activePath === "/operator";
  const isGuest = !isRider && !isStaff;

  const links = useMemo(() => {
    if (!currentUser) {
      // Unauthenticated guests only see the auth actions in the top bar.
      return [];
    }
    if (currentUser.role === "rider") {
      // Customer: My Rider Dashboard
      return [
        { href: "/rider", label: "My Rider Dashboard", active: isRider, icon: User },
      ];
    }
    // Station Worker: Home and Staff Station Desk
    return [
      { href: "/", label: "Fleet Overview", active: isGuest, icon: Compass },
      { href: "/staff", label: "Staff Station Desk", active: isStaff, icon: Wrench },
    ];
  }, [currentUser, isGuest, isRider, isStaff]);

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-teal-900/10 sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <Logo />
        {links.length > 0 && (
        <nav className="hidden items-center gap-1.5 md:flex" aria-label="Main navigation">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`link-nav-${item.href === "/" ? "home" : item.href.slice(1)}`}
                className={`nav-link rounded-xl px-4 py-2 text-xs font-bold transition no-underline flex items-center gap-1.5 ${
                  item.active
                    ? "bg-teal-800 text-white shadow-sm shadow-teal-900/20"
                    : "text-slate-600 hover:text-teal-900 hover:bg-slate-50"
                }`}
              >
                <Icon size={13} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        )}

        {/* User Account & Role Area */}
        <div className="hidden items-center gap-3 sm:flex">
          {currentUser ? (
            <div className="relative">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border border-slate-200/90 bg-white hover:border-teal-300 transition cursor-pointer shadow-2xs"
                  data-testid="button-user-profile"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-teal-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-bold text-slate-800 leading-tight">
                      {currentUser.name}
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-400">
                      {currentUser.role === "staff" ? "Station Worker" : "Rider"}
                    </span>
                  </div>
                  <Tag tone={currentUser.role === "staff" ? "amber" : "green"}>
                    {currentUser.role === "staff" ? "Staff" : "Rider"}
                  </Tag>
                  <ChevronDown size={13} className="text-slate-400" />
                </button>

                <button
                  onClick={onSignOut}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                  data-testid="button-signout"
                >
                  <LogOut size={16} />
                </button>
              </div>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-slate-100 z-50 enter">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                  </div>
                  <Link
                    href={currentUser.role === "staff" ? "/staff" : "/rider"}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-teal-900 rounded-xl hover:bg-teal-50 transition"
                  >
                    {currentUser.role === "staff" ? <Wrench size={14} /> : <User size={14} />}
                    <span>Open My Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onQuickDemoLogin(currentUser.role === "staff" ? "rider" : "staff");
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                  >
                    <Shuffle size={14} />
                    <span>Switch to {currentUser.role === "staff" ? "Rider (Alex)" : "Staff (Sarah)"}</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onSignOut();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth("signin")}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-teal-900 hover:bg-slate-50 rounded-xl transition cursor-pointer border border-slate-200/80"
                data-testid="button-signin"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth("signup")}
                className="btn-primary px-3.5 py-1.5 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
                data-testid="button-signup"
              >
                <UserPlus size={13} />
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
          data-testid="button-menu"
          className="grid h-10 w-10 place-items-center rounded-xl bg-white border border-slate-100 shadow-sm text-slate-700 md:hidden cursor-pointer"
        >
          <Menu size={19} />
        </button>
      </div>

      {open && (
        <nav className="grid gap-1 border-t border-slate-100 px-4 py-3 md:hidden bg-white shadow-lg">
          {currentUser && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center text-xs font-bold">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</p>
                  <Tag tone={currentUser.role === "staff" ? "amber" : "green"}>
                    {currentUser.role === "staff" ? "Station Worker" : "Rider"}
                  </Tag>
                </div>
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}

          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                onClick={() => setOpen(false)}
                href={item.href}
                className={`rounded-xl px-3.5 py-2.5 text-xs font-bold no-underline flex items-center gap-2 ${
                  item.active ? "bg-teal-800 text-white" : "text-teal-950 hover:bg-slate-50"
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {!currentUser && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 mt-1">
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenAuth("signin");
                }}
                className="py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 bg-white"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenAuth("signup");
                }}
                className="btn-primary py-2.5 px-3 text-xs font-bold rounded-xl"
              >
                Create Account
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const pages: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    if (!pages.includes(totalPages)) pages.push(totalPages);
  }

  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100/90" data-testid="pagination-controls">
      <div className="text-xs text-slate-500 font-medium">
        Showing <span className="font-bold text-teal-900">{startItem}–{endItem}</span> of{" "}
        <span className="font-bold text-teal-900">{totalItems}</span> bicycles · Page{" "}
        <span className="font-bold text-teal-900">{currentPage}</span> of{" "}
        <span className="font-bold text-teal-900">{totalPages}</span>
      </div>

      <nav className="flex items-center gap-1.5" aria-label="Bicycle list pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:text-teal-900 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer shadow-2xs"
          data-testid="button-pagination-prev"
        >
          <ChevronLeft size={15} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 text-xs font-medium select-none">
                  …
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(p as number)}
                aria-current={isCurrent ? "page" : undefined}
                className={`min-w-9 h-9 px-3 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex items-center justify-center ${
                  isCurrent
                    ? "bg-teal-800 text-white shadow-sm shadow-teal-900/20 ring-1 ring-teal-900"
                    : "bg-white text-slate-600 hover:text-teal-900 hover:bg-slate-50 border border-slate-200/80 shadow-2xs"
                }`}
                data-testid={`button-pagination-page-${p}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:text-teal-900 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer shadow-2xs"
          data-testid="button-pagination-next"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={15} />
        </button>
      </nav>
    </div>
  );
}

function BikeCard({
  bike,
  station,
  rate,
  currency,
  onRent,
}: {
  bike: EasyRideBicycle;
  station?: EasyRideStation;
  rate: number;
  currency: string;
  onRent: () => void;
}) {
  const meta = getBikeMeta(bike);
  const typeConfig: Record<string, { icon: typeof Zap }> = {
    Electric: { icon: Zap },
    Mountain: { icon: Mountain },
    City: { icon: Building2 },
    Racing: { icon: Flame },
    Hybrid: { icon: Shuffle },
  };

  const currentType = typeConfig[bike.type] || { icon: Bike };
  const TypeIcon = currentType.icon;

  return (
    <article
      className="bg-white rounded-3xl overflow-hidden shadow-card border border-slate-100/90 cursor-pointer hover:shadow-xl hover:border-teal-800/30 transition-all duration-300 group flex flex-col justify-between"
      onClick={onRent}
      data-testid={`card-bike-${bike.id}`}
    >
      <div>
        <div className="relative h-44 bg-slate-100 overflow-hidden">
          <img
            src={meta.image}
            alt={meta.modelName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = "/bikes/bike-1.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          <div className="absolute top-3 left-3 flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm transition-transform group-hover:scale-105 bg-teal-900/85 text-amber-300">
            <TypeIcon size={12} strokeWidth={2.5} />
            <span>{bike.type}</span>
          </div>
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-teal-900 shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Available</span>
          </div>
          <div className="absolute bottom-2.5 left-3 text-[11px] font-bold text-white tracking-wide bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md">
            {bike.code}
          </div>
        </div>

        <div className="p-4 pb-2">
          <div className="flex justify-between items-start mb-1 gap-2">
            <h4 className="font-extrabold text-teal-900 text-sm leading-snug group-hover:text-teal-700 transition-colors line-clamp-1">
              {meta.modelName}
            </h4>
            <div className="text-teal-800 font-extrabold text-sm whitespace-nowrap">
              {money(rate, currency)}
              <span className="text-[10px] text-slate-400 font-normal">/hr</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1 truncate">
            <MapPin size={12} className="text-teal-700 shrink-0" />
            <span className="truncate">{station ? `${station.name} · ${station.landmark}` : "Off station"}</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {meta.specs.range && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[10px] font-semibold border border-amber-200/60">
                Range: {meta.specs.range}
              </span>
            )}
            {meta.specs.speed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-semibold border border-teal-200/60">
                {meta.specs.speed}
              </span>
            )}
            {meta.specs.gears && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                {meta.specs.gears}
              </span>
            )}
            {meta.specs.weight && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                {meta.specs.weight}
              </span>
            )}
          </div>

          {meta.specs.highlight && (
            <p className="text-[11px] text-slate-400 mt-2 line-clamp-1 italic">
              "{meta.specs.highlight}"
            </p>
          )}
        </div>
      </div>

      <div className="p-4 pt-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRent();
          }}
          className="w-full mt-2 bg-teal-800 hover:bg-teal-900 active:scale-[0.98] text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          data-testid={`button-rent-${bike.id}`}
        >
          Hold / Book as Rider <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// 1. GUEST DASHBOARD (The Public Home Page /)
// ---------------------------------------------------------------------------
// 1. GUEST DASHBOARD (The Public Home Page /)
// ---------------------------------------------------------------------------
function GuestDashboard({
  state,
  currentUser,
  onOpenAuth,
  onQuickDemoLogin,
  onSignOut,
}: {
  state: EasyRideState;
  currentUser: EasyRideUser | null;
  onOpenAuth: (mode: "signin" | "signup", role?: UserRole) => void;
  onQuickDemoLogin: (role: UserRole) => void;
  onSignOut?: () => void;
}) {
  const [, navigate] = useLocation();
  const bikes = state.bicycles;
  const activeStations = state.stations.filter(s => s.active);
  const activeStationIds = useMemo(() => new Set(activeStations.map(s => s.id)), [activeStations]);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 8;
  const bikesSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const availableBikes = useMemo(() => {
    return bikes.filter(b => b.status === "available" && b.condition !== "faulty" && b.stationId && activeStationIds.has(b.stationId));
  }, [bikes, activeStationIds]);

  const filteredBikes = useMemo(() => {
    return availableBikes.filter(bike => {
      const meta = getBikeMeta(bike);
      const matchesCategory = selectedCategory === "All" || bike.type.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const station = state.stations.find(s => s.id === bike.stationId);
      return (
        bike.code.toLowerCase().includes(q) ||
        bike.type.toLowerCase().includes(q) ||
        meta.modelName.toLowerCase().includes(q) ||
        (station && (station.name.toLowerCase().includes(q) || station.area.toLowerCase().includes(q) || station.landmark.toLowerCase().includes(q)))
      );
    });
  }, [availableBikes, selectedCategory, searchQuery, state.stations]);

  const shouldPaginate = selectedCategory === "All" || filteredBikes.length > ITEMS_PER_PAGE;
  const totalPages = shouldPaginate ? Math.max(1, Math.ceil(filteredBikes.length / ITEMS_PER_PAGE)) : 1;

  const displayedBikes = useMemo(() => {
    if (!shouldPaginate) return filteredBikes;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBikes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBikes, shouldPaginate, currentPage, ITEMS_PER_PAGE]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    bikesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <main className="mx-auto max-w-[1320px] px-5 pb-16 pt-8 md:px-8 md:pt-12">
    {/* Hero Banner with the Real Rotating Bicycle */}
    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-teal-800 to-teal-900 px-6 py-9 text-white md:px-12 md:py-14 shadow-xl">
      <div className="relative z-[1] max-w-[660px]">
        {currentUser ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-xs text-white mb-3 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Signed in as <b>{currentUser.name}</b> ({currentUser.role === "staff" ? "Station Worker" : "Rider"})</span>
            <button
              onClick={() => navigate(currentUser.role === "staff" ? "/staff" : "/rider")}
              className="ml-2 text-amber-300 hover:text-amber-200 underline font-bold cursor-pointer"
            >
              Go to {currentUser.role === "staff" ? "Staff Station Desk" : "Customer Dashboard"} →
            </button>
            {onSignOut && (
              <>
                <span className="text-white/40">|</span>
                <button
                  onClick={onSignOut}
                  className="text-white/80 hover:text-white underline cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        ) : (
          <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Book your adventure in just one tap</p>
        )}
        <h1 className="display mt-4 text-[clamp(2.8rem,6.5vw,4.8rem)] font-extrabold leading-[.92] tracking-tight">
          Find your perfect<br/><span className="text-amber-300">ride today</span>
        </h1>
        <p className="mt-5 max-w-md text-sm leading-6 text-white/80">
          Explore our collection of high-quality bikes for every terrain. Whether you're commuting across Makerere, Kikoni, or Wandegeya, we've got you covered.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          {currentUser?.role === "rider" ? (
            <button onClick={() => navigate("/rider")} className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-3.5 text-sm font-bold text-teal-950 shadow-lg shadow-amber-400/20 hover:bg-amber-300 active:scale-[0.98] transition cursor-pointer" data-testid="button-start-ride">
              <User size={16} /> My Rider Dashboard <ArrowRight size={16}/>
            </button>
          ) : currentUser?.role === "staff" ? (
            <button onClick={() => navigate("/staff")} className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-3.5 text-sm font-bold text-teal-950 shadow-lg shadow-amber-400/20 hover:bg-amber-300 active:scale-[0.98] transition cursor-pointer">
              <Wrench size={16} /> My Staff Station Desk <ArrowRight size={16}/>
            </button>
          ) : (
            <>
              <button onClick={() => onOpenAuth("signin", "rider")} className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-3.5 text-sm font-bold text-teal-950 shadow-lg shadow-amber-400/20 hover:bg-amber-300 active:scale-[0.98] transition cursor-pointer" data-testid="button-start-ride">
                <User size={16} /> Sign In as Rider <ArrowRight size={16}/>
              </button>
              <button onClick={() => onOpenAuth("signup")} className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3.5 text-sm font-semibold text-white transition cursor-pointer">
                <UserPlus size={15} /> Create Account
              </button>
            </>
          )}
          <span className="rounded-2xl border border-white/20 px-4 py-2.5 text-xs text-white/80 font-medium">
            {availableBikes.length} bicycles available now
          </span>
        </div>
      </div>

      {/* Real Continuously Rotating Bicycle */}
      <div className="absolute -right-10 sm:right-2 md:right-8 lg:right-14 top-1/2 -translate-y-1/2 pointer-events-none select-none flex items-center justify-center opacity-30 md:opacity-100">
        <div className="absolute w-72 h-72 md:w-96 md:h-96 rounded-full bg-amber-400/10 blur-3xl pointer-events-none"></div>
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[440px] lg:h-[440px] flex items-center justify-center animate-rotate-bike">
          <img
            src="/hero-bike.png"
            alt="Real rotating bicycle"
            className="w-full h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.45)]"
          />
        </div>
      </div>
    </section>

    {/* Popular Bikes Section with Responsive Filter Buttons & Search */}
    <div ref={bikesSectionRef} className="mt-10 flex flex-col gap-4 scroll-mt-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="display mt-1 text-2xl font-bold text-teal-900">Explore Available Bikes</h2>
          <p className="text-sm text-slate-500 mt-1">
            {selectedCategory === "All" && shouldPaginate && totalPages > 1
              ? `Browsing all fleet bicycles · Page ${currentPage} of ${totalPages}`
              : "Filter by category to check availability and specs"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search model, code, station..."
              className="w-full pl-8 pr-7 py-2 bg-white rounded-xl text-xs border border-slate-200/90 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/30 shadow-xs placeholder:text-slate-400"
              data-testid="input-search-bikes"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs text-slate-600 shadow-sm border border-slate-100">
            <Clock3 size={14} className="text-teal-700" />
            <span>Updated live</span>
          </div>
        </div>
      </div>

      {/* Responsive Category Buttons: All, Electric, Mountain, City, Racing, Hybrid */}
      <div className="w-full overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-1 px-1">
        <div className="flex items-center gap-2 min-w-max pb-1" role="tablist" aria-label="Bicycle categories">
          {bikeCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = cat.id === "All"
              ? availableBikes.length
              : availableBikes.filter((b) => b.type.toLowerCase() === cat.id.toLowerCase()).length;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(cat.id)}
                data-testid={`button-filter-${cat.id.toLowerCase()}`}
                className={`group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer select-none active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700/60 shadow-xs ${
                  isSelected
                    ? "bg-teal-800 text-white shadow-md shadow-teal-900/20 ring-1 ring-teal-900 font-bold"
                    : "bg-white text-slate-600 hover:text-teal-900 hover:bg-slate-50 border border-slate-200/90 hover:border-teal-800/30 font-semibold"
                }`}
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-lg transition-colors ${
                    isSelected
                      ? "bg-teal-700/90 text-amber-300"
                      : "bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-800"
                  }`}
                >
                  <Icon size={14} strokeWidth={2.4} />
                </span>
                <span className="text-[13px]">{cat.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                    isSelected
                      ? "bg-amber-400 text-teal-950 font-extrabold"
                      : "bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-900"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>

    {/* Filtered Bikes Grid */}
    {filteredBikes.length ? (
      <>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 enter">
          {displayedBikes.map((bike) => {
            const station = state.stations.find((s) => s.id === bike.stationId);
            return (
              <BikeCard
                key={bike.id}
                bike={bike}
                station={station}
                rate={state.config.hourlyRate}
                currency={state.config.currency}
                onRent={() => navigate(`/rider?station=${bike.stationId}&bike=${bike.id}`)}
              />
            );
          })}
        </div>
        {shouldPaginate && totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredBikes.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        )}
      </>
    ) : (
      <div className="bg-white rounded-3xl p-10 text-center shadow-card border border-slate-100/90 mt-5">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-800 mb-3">
          <Compass size={24} />
        </div>
        <h3 className="display text-xl font-bold text-teal-900">
          No {selectedCategory === "All" ? "" : selectedCategory} bikes match your criteria
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          {searchQuery
            ? `No bicycles found matching "${searchQuery}". Try a different keyword or clear your search.`
            : `All ${selectedCategory} bicycles are currently booked or undergoing safety maintenance.`}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Clear search
            </button>
          )}
          {selectedCategory !== "All" && (
            <button
              onClick={() => setSelectedCategory("All")}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Show all categories ({availableBikes.length})
            </button>
          )}
        </div>
      </div>
    )}

    {/* Pickup network quick status */}
    <div className="mt-10 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-xs font-bold text-teal-900">Pickup Stations ({activeStations.length} open):</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {activeStations.map((st) => {
          const atStation = availableBikes.filter((b) => b.stationId === st.id).length;
          return (
            <Link
              key={st.id}
              href={`/rider?station=${st.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-teal-200 text-xs text-slate-600 hover:text-teal-900 font-medium transition no-underline"
            >
              <MapPin size={11} className="text-teal-700" />
              <span className="font-semibold text-slate-800">{st.name}</span>
              <span className="text-[10px] bg-teal-100/70 text-teal-800 px-1.5 py-0.2 rounded-full font-bold">
                {atStation} bikes
              </span>
            </Link>
          );
        })}
      </div>
    </div>

    <section className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <div className="bg-white rounded-3xl shadow-card border border-slate-100 flex flex-col justify-between gap-5 overflow-hidden p-6 md:flex-row md:items-center md:p-8">
        <div>
          <p className="text-[10px] uppercase tracking-[.18em] text-teal-700 font-bold">Clear price, no surprises</p>
          <h2 className="display mt-2 text-3xl font-bold text-teal-900">A simple hourly rate.</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">The current configured rate is charged by the hour. Your final amount is worked out when the bicycle is returned.</p>
          <div className="mt-5 inline-flex items-baseline gap-2 rounded-2xl bg-amber-50 px-5 py-3 border border-amber-200">
            <span className="text-2xl font-extrabold text-teal-900">{money(state.config.hourlyRate, state.config.currency)}</span>
            <span className="text-[10px] uppercase tracking-wider text-teal-700 font-bold">per hour</span>
          </div>
        </div>
        <BikeCardArt/>
      </div>
      <div className="relative overflow-hidden rounded-[18px] bg-[#e8e6d7] p-6 md:p-8">
        <p className="mono text-[10px] uppercase tracking-[.18em] text-[#768376]">Before you roll</p>
        <h2 className="display mt-2 max-w-sm text-[28px] font-semibold leading-tight">Recorded condition is your first check.</h2>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#6d786f]">Availability reflects the latest recorded status, not physical verification. Check the bicycle yourself before leaving. Report a fault to the station worker.</p>
        <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#476e58]"><ShieldCheck size={16}/> Student & campus friendly</div>
        <BikeSketch className="bike-doodle text-[#537b61]"/>
      </div>
    </section>
  </main>;
}



// ---------------------------------------------------------------------------
// 2. USER / RIDER DASHBOARD (/rider)
// ---------------------------------------------------------------------------
function RiderDashboard({
  state,
  save,
  currentUser,
  onSignOut,
}: {
  state?: EasyRideState;
  save?: (state: EasyRideState) => void;
  currentUser: EasyRideUser | null;
  onOpenAuth?: (mode: "signin" | "signup", role?: UserRole) => void;
  onQuickDemoLogin?: (role: UserRole) => void;
  onSignOut?: () => void;
}) {
  const [, navigate] = useLocation();
  return (
    <CustomerView
      state={state}
      save={save}
      currentUser={currentUser}
      onSignOut={onSignOut}
      onBackToGuest={() => navigate("/")}
    />
  );
}
// ---------------------------------------------------------------------------
// MAIN PAGE ROUTER
// ---------------------------------------------------------------------------

/** Only allow same-app, non-auth destinations for the post-login redirect. */
function sanitizeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  if (/^\/(signin|signup|login|register)(\/|\?|$)/.test(next)) return null;
  return next;
}

export default function EasyRidePage() {
  const { state, loading, error, retry, save, saving } = useEasyRide();
  const auth = useAuth();
  const [currentUserOverride, setCurrentUserOverride] = useState<EasyRideUser | null>(null);
  const activeUser = currentUserOverride || auth.currentUser;
  const [path, navigate] = useLocation();
  const search = useSearch();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  const isAuthRoute =
    path === "/login" ||
    path === "/signin" ||
    path === "/signup" ||
    path === "/register";

  // Sign in and Create Account are their own pages, not tabs in a popup.
  const authMode: "signin" | "signup" =
    path === "/signup" || path === "/register" ? "signup" : "signin";
  const authRole: UserRole = searchParams.get("role") === "staff" ? "staff" : "rider";
  const authNext = sanitizeNextPath(searchParams.get("next"));

  const isStaffPath = path.startsWith("/staff") || path.startsWith("/operator");
  const isReservePath = path.startsWith("/reserve");
  const isRiderPath =
    path.startsWith("/rider") ||
    path.startsWith("/rentals") ||
    isReservePath;

  /**
   * Send the visitor to the dedicated Sign In / Create Account page, keeping
   * the role they meant to use and the page they were trying to reach.
   */
  const openAuth = (mode: "signin" | "signup" = "signin", role: UserRole = "rider") => {
    const params = new URLSearchParams();
    if (role === "staff") params.set("role", "staff");
    const next = isAuthRoute
      ? authNext
      : path !== "/"
        ? `${path}${search}`
        : null;
    if (next) params.set("next", next);
    const query = params.toString();
    navigate(`/${mode === "signup" ? "signup" : "signin"}${query ? `?${query}` : ""}`);
  };

  const handleAuthSuccess = (user: EasyRideUser) => {
    setCurrentUserOverride(user);
    const staffNext = !!authNext && /^\/(staff|operator)\b/.test(authNext);
    const targetPath =
      user.role === "staff"
        ? staffNext
          ? authNext!
          : "/staff"
        : authNext && !staffNext
          ? authNext
          : "/rider";
    navigate(targetPath);
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    const user = auth.quickDemoLogin(role);
    if (user) {
      setCurrentUserOverride(user);
      const targetPath = role === "staff" ? "/staff" : "/rider";
      navigate(targetPath);
    }
  };

  const handleSignOut = () => {
    setCurrentUserOverride(null);
    auth.signout();
    navigate("/");
  };

  const page = useMemo(() => {
    if (!state || loading || error) return null;

    // Staff route protection
    if (isStaffPath) {
      if (!activeUser) {
        return (
          <main className="mx-auto max-w-lg px-4 py-12 flex flex-col items-center">
            <div className="mb-6 p-6 rounded-3xl bg-amber-50 border border-amber-200 text-center w-full shadow-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
                <Lock size={13} /> Station Worker Sign In Required
              </span>
              <h2 className="text-xl font-extrabold text-amber-950">Staff Operations Desk</h2>
              <p className="text-xs text-slate-600 mt-2 leading-5">
                Sign in with your station staff account to inspect roadworthiness, handoff bikes, close returns, and manage quarantine.
              </p>
            </div>
            <div className="flex w-full flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                onClick={() => openAuth("signin", "staff")}
                className="w-full sm:w-auto btn-primary py-2.5 px-5 text-xs font-bold rounded-xl cursor-pointer"
                data-purpose="gate-signin"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth("signup", "staff")}
                className="w-full sm:w-auto bg-white border border-amber-300 text-amber-900 py-2.5 px-5 text-xs font-bold rounded-xl hover:bg-amber-50 cursor-pointer"
                data-purpose="gate-signup"
              >
                Create Staff Account
              </button>
            </div>
          </main>
        );
      }

      if (activeUser.role !== "staff") {
        return (
          <main className="mx-auto max-w-lg px-4 py-12 flex flex-col items-center">
            <div className="mb-6 p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center w-full shadow-sm">
              <ShieldAlert size={38} className="text-rose-600 mx-auto mb-2" />
              <h2 className="text-xl font-extrabold text-rose-950">Access Restricted to Staff</h2>
              <p className="text-xs text-rose-800 mt-2 mb-5 leading-5">
                You are currently signed in as a Customer / Rider (<b>{activeUser.name}</b>). Station worker tools and safety certifications are restricted to Staff accounts.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  onClick={() => handleQuickDemoLogin("staff")}
                  className="w-full sm:w-auto btn-primary py-2.5 px-4 text-xs font-bold rounded-xl cursor-pointer"
                >
                  ⚡ Switch to Staff (Sarah Nabirye)
                </button>
                <button
                  onClick={() => navigate("/rider")}
                  className="w-full sm:w-auto bg-white border border-rose-300 text-rose-900 py-2.5 px-4 text-xs font-bold rounded-xl hover:bg-rose-50 cursor-pointer"
                >
                  Go to My Rider Dashboard
                </button>
              </div>
            </div>
          </main>
        );
      }

      return (
        <StaffDashboard
          state={state}
          save={save}
          saving={saving}
          currentUser={activeUser}
          users={auth.users}
          onSignOut={handleSignOut}
        />
      );
    }

    // Rider route protection
    if (isRiderPath) {
      if (!activeUser) {
        return (
          <main className="mx-auto max-w-lg px-4 py-12 flex flex-col items-center">
            <div className="mb-6 p-6 rounded-3xl bg-teal-50 border border-teal-200 text-center w-full shadow-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-900 text-xs font-bold mb-2">
                <User size={13} /> Customer Sign In Required
              </span>
              <h2 className="text-xl font-extrabold text-teal-950">Rider Dashboard Access</h2>
              <p className="text-xs text-slate-600 mt-2 leading-5">
                Sign in or create a Rider account to reserve bikes, track active rides, and see what you owe upon return.
              </p>
            </div>
            <div className="flex w-full flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                onClick={() => openAuth("signin", "rider")}
                className="w-full sm:w-auto btn-primary py-2.5 px-5 text-xs font-bold rounded-xl cursor-pointer"
                data-purpose="gate-signin"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth("signup", "rider")}
                className="w-full sm:w-auto bg-white border border-teal-300 text-teal-900 py-2.5 px-5 text-xs font-bold rounded-xl hover:bg-teal-50 cursor-pointer"
                data-purpose="gate-signup"
              >
                Create Rider Account
              </button>
            </div>
          </main>
        );
      }

      if (isReservePath) {
        return (
          <ReservationView
            state={state}
            save={save}
            currentUser={activeUser}
            onBack={() => navigate("/rider")}
            onBooked={() => navigate("/rider")}
          />
        );
      }

      return (
        <RiderDashboard
          state={state}
          save={save}
          currentUser={activeUser}
          onOpenAuth={openAuth}
          onQuickDemoLogin={handleQuickDemoLogin}
          onSignOut={handleSignOut}
        />
      );
    }

    // Public Guest Dashboard
    return (
      <GuestDashboard
        state={state}
        currentUser={activeUser}
        onOpenAuth={openAuth}
        onQuickDemoLogin={handleQuickDemoLogin}
        onSignOut={handleSignOut}
      />
    );
  }, [state, loading, error, isStaffPath, isRiderPath, isReservePath, path, search, save, saving, activeUser]);

  // Full-page auth routes: /signin (and /login) and /signup (and /register).
  if (isAuthRoute) {
    return (
      <div className="page-shell grain min-h-[100dvh] flex flex-col justify-between">
        <div>
          <Topbar
            activePath={path}
            currentUser={activeUser}
            onOpenAuth={openAuth}
            onSignOut={handleSignOut}
            onQuickDemoLogin={handleQuickDemoLogin}
          />
          <main className="mx-auto max-w-5xl px-4 py-12 flex flex-col items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-950 mb-6 self-start no-underline"
            >
              <ArrowLeft size={14} /> Back to Guest Dashboard
            </Link>
            <AuthPanel
              mode={authMode}
              initialRole={authRole}
              stations={state?.stations || []}
              auth={auth}
              onSuccess={handleAuthSuccess}
              onSwitchMode={(mode) => openAuth(mode, authRole)}
            />
          </main>
        </div>
        <footer className="border-t border-[#214f46]/10 px-5 py-6 text-center text-[10px] text-[#849087]">
          EasyRide Bicycle Rental · Frontend LocalStorage Authentication · Kampala, Uganda
        </footer>
      </div>
    );
  }

  if (isRiderPath && activeUser) {
    return (
      <div className="min-h-screen bg-[#f6f9f8] text-slate-800 font-sans antialiased selection:bg-brand-mint selection:text-white">
        {page}
      </div>
    );
  }

  // The staff console is a self-contained console shell (fixed sidebar + top
  // header), so it must not be wrapped in the public site's topbar/footer.
  // Only real staff get the console shell — riders hitting /staff keep the
  // public shell so the "Access Restricted" screen can still navigate away.
  if (isStaffPath && activeUser?.role === "staff") {
    return (
      <div className="min-h-[100dvh] bg-staff-surface font-display antialiased text-slate-800">
        {loading ? (
          <SkeletonPage />
        ) : error || !state ? (
          <MissingState error={error} retry={retry} />
        ) : (
          page
        )}
      </div>
    );
  }

  return (
    <div className="page-shell grain min-h-[100dvh] flex flex-col justify-between">
      <div>
        <Topbar
          activePath={path}
          currentUser={activeUser}
          onOpenAuth={openAuth}
          onSignOut={handleSignOut}
          onQuickDemoLogin={handleQuickDemoLogin}
        />
        {loading ? <SkeletonPage /> : error || !state ? <MissingState error={error} retry={retry} /> : page}
      </div>
      <footer className="border-t border-[#214f46]/10 px-5 py-6 text-center text-[10px] text-[#849087]">
        <span className="font-semibold text-[#536f60]">{state?.config.serviceName || "EasyRide"}</span> · {isStaffPath ? "Staff Portal (Station Worker)" : isRiderPath ? "Rider Portal (Customer)" : "Guest Public Dashboard"} · Makerere routes · Kampala, Uganda
      </footer>
    </div>
  );
}
