import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity, ArrowDownLeft, ArrowRight, ArrowUpRight, Bike, Building2,
  CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Clock3, Compass,
  CreditCard, Flame, Gauge, MapPin, Menu, Mountain, Plus, Search,
  Settings2, ShieldCheck, Shuffle, Wrench, X, Zap,
} from "lucide-react";
import type {
  EasyRideActivity, EasyRideBicycle, EasyRideMaintenance, EasyRideRental, EasyRideState,
  EasyRideStation,
} from "@workspace/api-client-react";
import { useEasyRide } from "@/hooks/use-easyride";
import { getBikeMeta } from "@/lib/mock-data";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const when = () => new Date().toISOString();
const niceDate = (value?: string | null) => value ? new Date(value).toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" }) : "—";
const money = (amount: number, currency: string) => `${currency} ${Number(amount || 0).toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;
const textCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

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

function Topbar({ active }: { active: string }) {
  const [open, setOpen] = useState(false);
  const links = [{ href: "/", label: "Home" }, { href: "/rentals", label: "Booking" }, { href: "/operator", label: "Profile" }];
  return <header className="bg-white/80 backdrop-blur-md border-b border-teal-900/10 sticky top-0 z-50">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
      <Logo/>
      <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
        {links.map((item) => <Link key={item.href} href={item.href} data-testid={`link-nav-${item.href === "/" ? "home" : item.href.slice(1)}`} className={`nav-link rounded-xl px-4 py-2 text-sm font-semibold no-underline ${active === item.href ? "bg-teal-50 text-teal-900" : "text-slate-600 hover:text-teal-900 hover:bg-slate-50"}`}>{item.label}</Link>)}
      </nav>
      <div className="hidden items-center gap-3 sm:flex">
        <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="Avatar" className="w-full h-full object-cover" />
        </div>
      </div>
      <button onClick={() => setOpen(!open)} aria-label="Toggle navigation" data-testid="button-menu" className="grid h-10 w-10 place-items-center rounded-xl bg-white border border-slate-100 shadow-sm text-slate-700 md:hidden"><Menu size={19}/></button>
    </div>
    {open && <nav className="grid gap-1 border-t border-slate-100 px-4 py-3 md:hidden bg-white">{links.map((item) => <Link key={item.href} onClick={() => setOpen(false)} href={item.href} className="rounded-xl px-3 py-2 text-sm font-semibold text-teal-900 no-underline hover:bg-slate-50">{item.label}</Link>)}</nav>}
  </header>;
}

function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "green" | "amber" | "red" | "neutral" }) {
  const styles = { green: "bg-[#e5f0e3] text-[#35674c]", amber: "bg-[#f7ecd4] text-[#95651d]", red: "bg-[#f7e4df] text-[#a34b3b]", neutral: "bg-[#ecece5] text-[#67766d]" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.09em] ${styles[tone]}`}>{children}</span>;
}

function PageTitle({ eyebrow, title, detail, side }: { eyebrow: string; title: string; detail: string; side?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mono mb-2 text-[10px] uppercase tracking-[.2em] text-[#6b8276]">{eyebrow}</p><h1 className="display text-[clamp(2.35rem,5vw,4rem)] font-semibold leading-[.98] text-[#183c38]">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#68776e]">{detail}</p></div>{side}</div>;
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
  return <main className="mx-auto grid min-h-[65vh] max-w-xl place-items-center px-6 text-center"><div className="panel p-8"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f4e8d8] text-[#986d35]"><CircleAlert/></span><h1 className="display mt-4 text-3xl">We can’t reach the ride board.</h1><p className="mt-2 text-sm leading-6 text-[#68776e]">{error ? "The saved service records didn’t load. Check your connection and try again." : "There are no service records available yet."}</p><button onClick={retry} className="btn-primary mt-5 rounded-full px-5 py-2.5 text-sm font-semibold" data-testid="button-retry">Try again</button></div></main>;
}

const bikeCategories = [
  { id: "All", label: "All", icon: Bike },
  { id: "Electric", label: "Electric", icon: Zap },
  { id: "Mountain", label: "Mountain", icon: Mountain },
  { id: "City", label: "City", icon: Building2 },
  { id: "Racing", label: "Racing", icon: Flame },
  { id: "Hybrid", label: "Hybrid", icon: Shuffle },
] as const;

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
          <div
            className="absolute top-3 left-3 flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm transition-transform group-hover:scale-105 bg-teal-900/85 text-amber-300"
          >
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
          className="w-full mt-2 bg-teal-800 hover:bg-teal-900 active:scale-[0.98] text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
          data-testid={`button-rent-${bike.id}`}
        >
          Book Now <ArrowRight size={14} />
        </button>
      </div>
    </article>
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

function Discovery({ state }: { state: EasyRideState }) {
  const [, navigate] = useLocation();
  const bikes = state.bicycles;
  const activeStations = state.stations.filter(s => s.active);
  const activeStationIds = useMemo(() => new Set(activeStations.map(s => s.id)), [activeStations]);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 8;
  const bikesSectionRef = useRef<HTMLDivElement>(null);

  // Reset to page 1 whenever category or search query changes
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

  // Apply pagination when on "All" bicycles or when results exceed ITEMS_PER_PAGE
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
    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-teal-800 to-teal-900 px-6 py-9 text-white md:px-12 md:py-14">
      <div className="relative z-[1] max-w-[660px]">
        <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Book your adventure in just one tap</p>
        <h1 className="display mt-4 text-[clamp(3rem,7vw,5rem)] font-extrabold leading-[.9] tracking-tight">
          Find your perfect<br/><span className="text-amber-300">ride today</span>
        </h1>
        <p className="mt-5 max-w-md text-sm leading-6 text-white/80">
          Explore our collection of high-quality bikes for every terrain. Whether you're commuting or exploring, we've got you covered.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button onClick={() => navigate("/rentals")} className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-3 text-sm font-bold text-teal-900 shadow-lg shadow-amber-400/20 hover:bg-amber-300 active:scale-[0.98] transition cursor-pointer" data-testid="button-start-ride">
            Get Started <ArrowRight size={16}/>
          </button>
          <span className="rounded-2xl border border-white/20 px-4 py-2.5 text-xs text-white/80">
            {availableBikes.length} bicycles available now
          </span>
        </div>
      </div>
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

    {/* Popular Bikes Section with Responsive Filter Buttons */}
    <div ref={bikesSectionRef} className="mt-8 flex flex-col gap-4 scroll-mt-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="display mt-1 text-2xl font-bold text-teal-900">Popular Bikes</h2>
          <p className="text-sm text-slate-500 mt-1">
            {selectedCategory === "All" && shouldPaginate && totalPages > 1
              ? `Browsing all fleet bicycles · Page ${currentPage} of ${totalPages}`
              : "Filter by category to find your ride"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
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
                onRent={() => navigate(`/rentals?station=${bike.stationId}&bike=${bike.id}`)}
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

    {/* Station network quick status */}
    <div className="mt-8 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-3">
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
              href={`/rentals?station=${st.id}`}
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
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#6d786f]">Availability reflects the latest recorded status, not physical verification. Check the bicycle yourself before leaving. Report a fault to the operator.</p>
        <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#476e58]"><ShieldCheck size={16}/> Student & campus friendly</div>
        <BikeSketch className="bike-doodle text-[#537b61]"/>
      </div>
    </section>
  </main>;
}

function Rentals({ state, save }: { state: EasyRideState; save: (state: EasyRideState) => void }) {
  const params = new URLSearchParams(window.location.search);
  const initialBikeId = params.get("bike") || "";
  const initialBike = state.bicycles.find(b => b.id === initialBikeId);
  const initialStationId = params.get("station") || initialBike?.stationId || "";

  const [stationId, setStationId] = useState(initialStationId);
  const [customerName, setCustomerName] = useState("");
  const [bicycleId, setBicycleId] = useState(initialBikeId);
  const [returnId, setReturnId] = useState("");
  const [returnCondition, setReturnCondition] = useState<EasyRideBicycle["condition"] | "">("");
  const [returnNotes, setReturnNotes] = useState("");

  const active = state.rentals.filter(r => r.status === "active");
  const availableBikes = state.bicycles.filter(b => b.status === "available" && b.condition !== "faulty" && (!stationId || b.stationId === stationId));
  const selectedStation = state.stations.find(s => s.id === stationId);
  const addActivity = (activity: EasyRideActivity) => [activity, ...state.activity].slice(0, 100);

  const start = () => {
    const bike = state.bicycles.find(b => b.id === bicycleId);
    const station = state.stations.find(s => s.id === stationId);
    if (!bike || !station || !customerName.trim()) return;
    const meta = getBikeMeta(bike);
    const rental: EasyRideRental = { id: uid(), customerName: customerName.trim(), bicycleId: bike.id, bicycleCode: bike.code, pickupStationId: station.id, startedAt: when(), returnedAt: null, durationMinutes: null, amount: 0, paymentStatus: "pending", status: "active", returnCondition: null, returnNotes: null };
    save({
      ...state,
      bicycles: state.bicycles.map(b => b.id === bike.id ? { ...b, status: "rented" } : b),
      rentals: [rental, ...state.rentals],
      activity: addActivity({ id: uid(), message: `${bike.code} (${meta.modelName}) rented by ${customerName.trim()} at ${station.name}`, createdAt: when(), kind: "rental" as const })
    });
    setCustomerName(""); setBicycleId("");
  };

  const confirmReturn = (rental: EasyRideRental) => {
    if (!returnCondition) return;
    const now = new Date();
    const started = new Date(rental.startedAt);
    const duration = Math.max(1, Math.ceil((now.getTime() - started.getTime()) / 60000));
    const amount = Math.ceil(duration / 60) * state.config.hourlyRate;
    const stationName = state.stations.find(s => s.id === rental.pickupStationId)?.name || "station";
    const note = returnNotes.trim();
    const needsMaintenance = returnCondition === "faulty" || note.length > 0;
    const maintenanceRecord: EasyRideMaintenance | null = needsMaintenance ? {
      id: uid(),
      bicycleId: rental.bicycleId,
      bicycleCode: rental.bicycleCode,
      stationName,
      issue: note || "Fault found during return check",
      reportedAt: now.toISOString(),
      status: "open",
      repairCost: 0,
    } : null;
    const activity: EasyRideActivity[] = [
      { id: uid(), message: `${rental.bicycleCode} returned to ${stationName} · ${money(amount, state.config.currency)} due`, createdAt: now.toISOString(), kind: "return" as const },
      ...(maintenanceRecord ? [{ id: uid(), message: `${rental.bicycleCode} held for maintenance after return check`, createdAt: now.toISOString(), kind: "maintenance" as const }] : []),
      ...state.activity,
    ].slice(0, 100);
    save({
      ...state,
      rentals: state.rentals.map(r => r.id === rental.id ? { ...r, status: "completed", returnedAt: now.toISOString(), durationMinutes: duration, amount, paymentStatus: "pending", returnCondition, returnNotes: note || null } : r),
      bicycles: state.bicycles.map(b => b.id === rental.bicycleId ? { ...b, status: needsMaintenance ? "maintenance" : "available", condition: needsMaintenance ? "faulty" : returnCondition, stationId: rental.pickupStationId, lastChecked: now.toISOString() } : b),
      maintenance: maintenanceRecord ? [maintenanceRecord, ...state.maintenance] : state.maintenance,
      activity,
    });
    setReturnId(""); setReturnCondition(""); setReturnNotes("");
  };

  return <main className="mx-auto max-w-[1320px] px-5 pb-16 pt-8 md:px-8 md:pt-12">
    <PageTitle eyebrow="Rider desk / 02" title="Make the trip yours." detail="Start a rental with a recorded pickup point and bicycle. On return, we record the duration and amount due. Payment status is handled by the service team."/>
    <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
      <section className="panel h-fit p-5 md:p-7">
        <div className="flex items-center justify-between">
          <div><p className="mono text-[10px] uppercase tracking-[.18em] text-[#72867b]">Quick start</p><h2 className="display mt-1 text-2xl font-semibold">Record a ride</h2></div>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5eee0] text-[#397866]"><ArrowUpRight size={19}/></span>
        </div>
        <label className="mt-5 block text-xs font-semibold text-[#51675c]">Rider name<input className="field mt-1.5" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Name for the rental record" data-testid="input-rider-name"/></label>
        <label className="mt-4 block text-xs font-semibold text-[#51675c]">
          Pickup point
          <select
            className="field mt-1.5"
            value={stationId}
            onChange={e => {
              setStationId(e.target.value);
              if (bicycleId) {
                const b = state.bicycles.find(x => x.id === bicycleId);
                if (b && b.stationId !== e.target.value) {
                  setBicycleId("");
                }
              }
            }}
            data-testid="select-pickup-station"
          >
            <option value="">Choose a station</option>
            {state.stations.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name} · {s.area}</option>)}
          </select>
        </label>
        <label className="mt-4 block text-xs font-semibold text-[#51675c]">
          Recorded available bicycle
          <select
            className="field mt-1.5"
            value={bicycleId}
            onChange={e => setBicycleId(e.target.value)}
            data-testid="select-bicycle"
          >
            <option value="">Choose a bicycle</option>
            {availableBikes.map(b => {
              const meta = getBikeMeta(b);
              return (
                <option key={b.id} value={b.id}>
                  {b.code} · {meta.modelName} ({b.type}) · {textCase(b.condition)} condition
                </option>
              );
            })}
          </select>
        </label>
        <div className="mt-4 rounded-xl bg-[#f0eedf] p-3 text-xs leading-5 text-[#68776e]">
          <span className="font-bold text-[#335b4c]">{money(state.config.hourlyRate, state.config.currency)} / hour</span> · billed by each started hour. This board is the latest recorded status, not live tracking; confirm the bicycle is physically present and safe.
        </div>
        {selectedStation && !availableBikes.length && <p className="mt-3 text-xs text-[#a34b3b]">No recorded available bicycles at this pickup point. Try another station.</p>}
        <button disabled={!customerName.trim() || !stationId || !bicycleId} onClick={start} className="btn-primary mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer" data-testid="button-begin-rental">Start rental <ArrowRight size={16}/></button>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div><p className="mono text-[10px] uppercase tracking-[.18em] text-[#72867b]">Your rides</p><h2 className="display mt-1 text-2xl font-semibold">Active rentals <span className="text-[#8a9b8f]">({active.length})</span></h2></div>
          <span className="text-xs text-[#748078]">Return confirmation required</span>
        </div>
        {active.length ? active.map(r => {
          const station = state.stations.find(s => s.id === r.pickupStationId);
          return <article key={r.id} className="panel p-5" data-testid={`card-active-rental-${r.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Tag tone="green">On trip</Tag>
                <h3 className="display mt-3 text-2xl font-semibold">{r.bicycleCode}</h3>
                <p className="mt-1 text-xs text-[#748078]">Rider {r.customerName} · picked up at {station?.name || "station"}</p>
              </div>
              <p className="mono text-[10px] leading-5 text-[#748078]">STARTED<br/>{niceDate(r.startedAt)}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#214f46]/10 pt-4">
              <p className="text-xs text-[#6f7a72]">Amount due is calculated when the return is recorded.</p>
              <button onClick={() => { setReturnId(r.id); setReturnCondition(""); setReturnNotes(""); }} className="btn-quiet inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold cursor-pointer" data-testid={`button-return-${r.id}`}>Record return <ArrowDownLeft size={15}/></button>
            </div>
            {returnId === r.id && <div className="mt-4 rounded-xl border border-[#d2c998] bg-[#f7f2de] p-4">
              <p className="text-sm font-bold">Check bicycle condition before closing</p>
              <p className="mt-1 text-xs text-[#6a776e]">A faulty or damaged bicycle is held out of service and added to the maintenance log.</p>
              <label className="mt-3 block text-xs font-semibold text-[#51675c]">Condition on return<select className="field mt-1.5" value={returnCondition} onChange={e => setReturnCondition(e.target.value as EasyRideBicycle["condition"] | "")} data-testid={`select-return-condition-${r.id}`}><option value="">Choose condition</option>{["excellent","good","fair","faulty"].map(condition => <option key={condition} value={condition}>{textCase(condition)}</option>)}</select></label>
              <label className="mt-3 block text-xs font-semibold text-[#51675c]">Fault or damage notes<textarea className="field mt-1.5 min-h-20 resize-y" value={returnNotes} onChange={e => setReturnNotes(e.target.value)} placeholder="Describe any damage or issue found" data-testid={`input-return-notes-${r.id}`}/></label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button disabled={!returnCondition} onClick={() => confirmReturn(r)} className="btn-primary rounded-lg px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer" data-testid={`button-confirm-return-${r.id}`}>Confirm return</button>
                <button onClick={() => { setReturnId(""); setReturnCondition(""); setReturnNotes(""); }} className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-[#5e6d64] cursor-pointer" data-testid="button-cancel-return">Keep rental active</button>
              </div>
            </div>}
          </article>;
        }) : <div className="panel px-6 py-10 text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e7eee1] text-[#427665]"><Bike/></span><h3 className="display mt-3 text-2xl">No active rentals.</h3><p className="mt-1 text-sm text-[#748078]">Pick a recorded available bicycle to begin.</p></div>}
        <div className="panel p-5"><h3 className="text-sm font-bold">Recent completed trips</h3>{state.rentals.filter(r => r.status === "completed").slice(0, 4).length ? <div className="mt-3 divide-y divide-[#214f46]/10">{state.rentals.filter(r => r.status === "completed").slice(0, 4).map(r => <div key={r.id} className="flex items-center justify-between py-3 text-xs"><span><b>{r.bicycleCode}</b><span className="ml-2 text-[#7d877e]">{r.customerName} · {r.durationMinutes ?? "—"} min</span></span><span className="font-semibold">{money(r.amount, state.config.currency)} <Tag tone={r.paymentStatus === "paid" ? "green" : "amber"}>{r.paymentStatus}</Tag></span></div>)}</div> : <p className="mt-2 text-xs text-[#7d877e]">Completed rentals appear here after a return.</p>}</div>
      </section>
    </div>
  </main>;
}

type OperatorTab = "overview" | "fleet" | "records" | "care" | "settings";
function Stat({ label, value, note, icon: Icon }: { label: string; value: string | number; note: string; icon: typeof Bike }) {
  return <div className="panel p-5"><div className="flex items-start justify-between"><span className="mono text-[9px] uppercase tracking-[.16em] text-[#75867c]">{label}</span><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8eee3] text-[#467763]"><Icon size={16}/></span></div><p className="display mt-3 text-3xl font-semibold">{value}</p><p className="mt-1 text-[10px] text-[#7b857d]">{note}</p></div>;
}

function Operator({ state, save, saving }: { state: EasyRideState; save: (state: EasyRideState) => void; saving: boolean }) {
  const [tab, setTab] = useState<OperatorTab>("overview");
  const [stationName, setStationName] = useState("");
  const [stationArea, setStationArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [configName, setConfigName] = useState(state.config.serviceName);
  const [configArea, setConfigArea] = useState(state.config.serviceArea);
  const [rate, setRate] = useState(String(state.config.hourlyRate));
  const [dailyCost, setDailyCost] = useState(String(state.config.operatingCostPerDay));
  const [currency, setCurrency] = useState(state.config.currency);
  const [issueBike, setIssueBike] = useState("");
  const [issueText, setIssueText] = useState("");
  const [filter, setFilter] = useState("");
  const [fleetPage, setFleetPage] = useState(1);
  const FLEET_PER_PAGE = 8;
  const fleetTotalPages = Math.ceil(state.bicycles.length / FLEET_PER_PAGE);
  const displayedFleet = useMemo(() => {
    const start = (fleetPage - 1) * FLEET_PER_PAGE;
    return state.bicycles.slice(start, start + FLEET_PER_PAGE);
  }, [state.bicycles, fleetPage]);

  const active = state.rentals.filter(r => r.status === "active");
  const completed = state.rentals.filter(r => r.status === "completed");
  const income = completed.filter(r => r.paymentStatus === "paid").reduce((sum, r) => sum + r.amount, 0);
  const pending = completed.filter(r => r.paymentStatus === "pending").reduce((sum, r) => sum + r.amount, 0);
  const bikesAvailable = state.bicycles.filter(b => b.status === "available").length;
  const broken = state.bicycles.filter(b => b.condition === "faulty" || b.status === "maintenance").length;

  const tabs: { id: OperatorTab; label: string; icon: typeof Bike }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "fleet", label: "Fleet & stations", icon: Bike },
    { id: "records", label: "Rental records", icon: CreditCard },
    { id: "care", label: "Faults & care", icon: Wrench },
    { id: "settings", label: "Service settings", icon: Settings2 },
  ];

  const updateBike = (bikeId: string, updates: Partial<EasyRideBicycle>) => save({ ...state, bicycles: state.bicycles.map(b => b.id === bikeId ? { ...b, ...updates } : b) });
  const setPayment = (rental: EasyRideRental) => save({
    ...state,
    rentals: state.rentals.map(r => r.id === rental.id ? { ...r, paymentStatus: r.paymentStatus === "paid" ? "pending" : "paid" } : r),
    activity: [{ id: uid(), message: `Payment for ${rental.bicycleCode} marked ${rental.paymentStatus === "paid" ? "pending" : "paid"} · ${money(rental.amount, state.config.currency)}`, createdAt: when(), kind: "payment" as const }, ...state.activity].slice(0, 100),
  });

  const reportFault = () => {
    const bike = state.bicycles.find(b => b.id === issueBike);
    if (!bike || !issueText.trim()) return;
    const station = state.stations.find(s => s.id === bike.stationId);
    const record: EasyRideMaintenance = { id: uid(), bicycleId: bike.id, bicycleCode: bike.code, stationName: station?.name || "Off station", issue: issueText.trim(), reportedAt: when(), status: "open", repairCost: 0 };
    save({
      ...state,
      bicycles: state.bicycles.map(b => b.id === bike.id ? { ...b, condition: "faulty", status: "maintenance" } : b),
      maintenance: [record, ...state.maintenance],
      activity: [{ id: uid(), message: `${bike.code} fault reported: ${issueText.trim()}`, createdAt: when(), kind: "maintenance" as const }, ...state.activity].slice(0, 100),
    });
    setIssueText(""); setIssueBike("");
  };

  const addStation = () => {
    if (!stationName.trim() || !stationArea.trim()) return;
    const station: EasyRideStation = { id: uid(), name: stationName.trim(), area: stationArea.trim(), landmark: landmark.trim() || "Landmark not recorded", active: true };
    save({
      ...state,
      stations: [...state.stations, station],
      activity: [{ id: uid(), message: `Pickup point added: ${station.name}`, createdAt: when(), kind: "station" as const }, ...state.activity].slice(0, 100),
    });
    setStationName(""); setStationArea(""); setLandmark("");
  };

  const saveConfig = () => {
    const hourlyRate = Number(rate);
    const operatingCostPerDay = Number(dailyCost);
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0 || !Number.isFinite(operatingCostPerDay) || operatingCostPerDay < 0) return;
    save({ ...state, config: { serviceName: configName.trim() || state.config.serviceName, serviceArea: configArea.trim() || state.config.serviceArea, hourlyRate, operatingCostPerDay, currency: currency.trim() || state.config.currency } });
  };

  const filteredRentals = state.rentals.filter(r => `${r.customerName} ${r.bicycleCode}`.toLowerCase().includes(filter.toLowerCase()));

  return <main className="mx-auto max-w-[1320px] px-5 pb-16 pt-8 md:px-8 md:pt-12">
    <PageTitle eyebrow="Service desk / Operations" title="Keep every wheel turning." detail="Accurate pickup, rental, return, payment and fault records help the service stay useful and sustainable." side={<div className={`mono rounded-full px-3 py-2 text-[10px] ${saving ? "bg-[#f7ecd4] text-[#95651d]" : "bg-[#e6eee2] text-[#4b7258]"}`} data-testid="status-save">{saving ? "SAVING RECORDS…" : "FRONTEND LOCAL MODE"}</div>}/>
    <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-[#e9e9df] p-1.5">{tabs.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition cursor-pointer ${tab === item.id ? "bg-[#214f46] text-[#f7f5ed] shadow-sm" : "text-[#6c7a70] hover:bg-[#f3f1e8]"}`} data-testid={`button-operator-tab-${item.id}`}><item.icon size={15}/>{item.label}</button>)}</div>

    {tab === "overview" && <div className="enter space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Bicycle fleet" value={state.bicycles.length} note={`${bikesAvailable} recorded available`} icon={Bike}/>
        <Stat label="On active rentals" value={active.length} note="Riders currently checked out" icon={ArrowUpRight}/>
        <Stat label="Recorded income" value={money(income, state.config.currency)} note={`${completed.filter(r => r.paymentStatus === "paid").length} paid completed trips`} icon={CreditCard}/>
        <Stat label="Attention needed" value={broken} note={`${state.maintenance.filter(m => m.status !== "resolved").length} open maintenance records`} icon={Wrench}/>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <section className="panel p-5 md:p-7">
          <div className="flex items-start justify-between"><div><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Service pulse</p><h2 className="display mt-1 text-2xl font-semibold">Usage & recorded income</h2></div><Gauge className="text-[#48806a]"/></div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#e7eee2] p-4"><p className="text-xs text-[#68786e]">Completed rentals</p><p className="display mt-2 text-3xl font-semibold">{completed.length}</p><p className="mt-1 text-[10px] text-[#78857c]">{completed.reduce((sum, r) => sum + (r.durationMinutes || 0), 0).toLocaleString()} recorded minutes</p></div>
            <div className="rounded-xl bg-[#f5ead5] p-4"><p className="text-xs text-[#78694e]">Pending collection</p><p className="display mt-2 text-3xl font-semibold">{money(pending, state.config.currency)}</p><p className="mt-1 text-[10px] text-[#877c69]">{completed.filter(r => r.paymentStatus === "pending").length} completed unpaid</p></div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-[#214f46]/10 pt-4 text-xs"><span className="text-[#78847b]">Active pickup points</span><b>{state.stations.filter(s => s.active).length} / {state.stations.length}</b><span className="text-[#78847b]">Rate</span><b>{money(state.config.hourlyRate, state.config.currency)} / hr</b></div>
        </section>
        <section className="panel p-5 md:p-7">
          <div className="flex items-center justify-between"><div><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Latest entries</p><h2 className="display mt-1 text-2xl font-semibold">Activity book</h2></div><Activity size={19} className="text-[#48806a]"/></div>
          <div className="mt-4 space-y-3">{state.activity.slice(0, 6).length ? state.activity.slice(0, 6).map(item => <div key={item.id} className="flex gap-3 border-b border-[#214f46]/8 pb-3 last:border-0"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#73a181]"></span><div className="min-w-0 flex-1"><p className="text-xs leading-5 text-[#4d6357]">{item.message}</p><p className="mono mt-1 text-[9px] uppercase tracking-wider text-[#97a097]">{textCase(item.kind)} · {niceDate(item.createdAt)}</p></div></div>) : <p className="rounded-xl bg-[#f1f0e7] p-5 text-center text-xs text-[#7a857c]">New service activity appears here when a record is saved.</p>}</div>
        </section>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <h3 className="text-sm font-bold">Latest bicycle status</h3>
          <div className="mt-3 space-y-2">{state.bicycles.slice(0, 6).map(b => {
            const meta = getBikeMeta(b);
            return (
              <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f2f0e7] px-3 py-2.5">
                <div>
                  <span className="font-bold text-sm">{b.code}</span>
                  <span className="ml-2 text-xs text-[#7b857d]">{meta.modelName} ({b.type})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag tone={b.condition === "faulty" ? "red" : b.status === "available" ? "green" : b.status === "maintenance" ? "amber" : "neutral"}>{textCase(b.status)}</Tag>
                  <span className="hidden text-[10px] text-[#8a938a] sm:inline">{textCase(b.condition)} · {niceDate(b.lastChecked)}</span>
                </div>
              </div>
            );
          })}</div>
        </section>
        <section className="relative overflow-hidden rounded-[18px] bg-[#dce8d8] p-5">
          <p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Fleet variety</p>
          <h3 className="display mt-1 text-2xl font-semibold">5 Bicycle categories available.</h3>
          <p className="mt-2 max-w-md text-xs leading-5 text-[#63786b]">Electric, Mountain, City, Racing, and Hybrid bikes are ready for student and commuter rentals across Kampala stations.</p>
          <BikeSketch className="bike-doodle text-[#397866]"/>
        </section>
      </div>
    </div>}

    {tab === "fleet" && <div className="enter grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <section className="panel p-5 md:p-7">
        <div className="flex items-end justify-between"><div><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Fleet register</p><h2 className="display mt-1 text-2xl font-semibold">Bicycles</h2></div><span className="text-xs text-[#718078]">{state.bicycles.length} records</span></div>
        <div className="mt-4 space-y-3">{displayedFleet.length ? displayedFleet.map(b => {
          const meta = getBikeMeta(b);
          return (
            <div key={b.id} className="rounded-xl border border-[#214f46]/10 p-4" data-testid={`row-bike-${b.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <b className="text-sm">{b.code} · {meta.modelName}</b>
                  <span className="ml-2 text-xs text-[#758178] font-medium">({b.type})</span>
                </div>
                <Tag tone={b.status === "available" ? "green" : b.status === "maintenance" ? "amber" : "neutral"}>{textCase(b.status)}</Tag>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <label className="text-[10px] font-semibold text-[#738078]">Condition<select className="field mt-1 !py-2 text-xs" value={b.condition} onChange={e => updateBike(b.id, { condition: e.target.value as EasyRideBicycle["condition"], status: e.target.value === "faulty" ? "maintenance" : b.status === "maintenance" ? "available" : b.status })} data-testid={`select-condition-${b.id}`}>{["excellent","good","fair","faulty"].map(x => <option key={x} value={x}>{textCase(x)}</option>)}</select></label>
                <label className="text-[10px] font-semibold text-[#738078]">Recorded status<select className="field mt-1 !py-2 text-xs" value={b.status} onChange={e => updateBike(b.id, { status: e.target.value as EasyRideBicycle["status"] })} data-testid={`select-status-${b.id}`}>{["available","rented","maintenance"].map(x => <option key={x} value={x}>{textCase(x)}</option>)}</select></label>
                <label className="text-[10px] font-semibold text-[#738078]">Station<select className="field mt-1 !py-2 text-xs" value={b.stationId || ""} onChange={e => updateBike(b.id, { stationId: e.target.value || null })} data-testid={`select-bike-station-${b.id}`}><option value="">Off station</option>{state.stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              </div>
              <p className="mt-2 text-[10px] text-[#89938a]">Last check: {niceDate(b.lastChecked)}</p>
            </div>
          );
        }) : <p className="py-10 text-center text-sm text-[#7b857c]">No bicycles recorded yet.</p>}</div>
        {fleetTotalPages > 1 && (
          <PaginationControls
            currentPage={fleetPage}
            totalPages={fleetTotalPages}
            totalItems={state.bicycles.length}
            pageSize={FLEET_PER_PAGE}
            onPageChange={setFleetPage}
          />
        )}
      </section>

      <section className="space-y-5">
        <div className="panel p-5 md:p-7">
          <div><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Pickup network</p><h2 className="display mt-1 text-2xl font-semibold">Stations</h2></div>
          <div className="mt-4 space-y-3">{state.stations.map(s => <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f0efe6] p-3"><div><b className="text-sm">{s.name}</b><p className="mt-1 text-[10px] text-[#7a857b]">{s.area} · {s.landmark}</p></div><button onClick={() => save({ ...state, stations: state.stations.map(st => st.id === s.id ? { ...st, active: !st.active } : st) })} className={`rounded-full px-3 py-2 text-[10px] font-bold cursor-pointer ${s.active ? "bg-[#e5f0e3] text-[#35674c]" : "bg-[#e8e8e1] text-[#6a766e]"}`} data-testid={`button-toggle-station-${s.id}`}>{s.active ? "Open · pause" : "Paused · open"}</button></div>)}</div>
        </div>
        <div className="panel p-5 md:p-7">
          <p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Expand the network</p><h3 className="display mt-1 text-2xl font-semibold">Add a pickup point</h3>
          <div className="mt-4 grid gap-3"><input className="field" placeholder="Station name" value={stationName} onChange={e => setStationName(e.target.value)} data-testid="input-station-name"/><input className="field" placeholder="Area (e.g. Kikoni)" value={stationArea} onChange={e => setStationArea(e.target.value)} data-testid="input-station-area"/><input className="field" placeholder="Landmark" value={landmark} onChange={e => setLandmark(e.target.value)} data-testid="input-station-landmark"/></div>
          <button disabled={!stationName.trim() || !stationArea.trim()} onClick={addStation} className="btn-primary mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-40 cursor-pointer" data-testid="button-add-station"><Plus size={15}/> Add station</button>
        </div>
      </section>
    </div>}

    {tab === "records" && <section className="panel enter p-5 md:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Record keeping</p><h2 className="display mt-1 text-2xl font-semibold">Rentals, returns & payments</h2><p className="mt-1 text-xs text-[#718078]">Payment status and amount only; no payment details are stored.</p></div>
        <input className="field max-w-xs" placeholder="Find rider or bicycle…" value={filter} onChange={e => setFilter(e.target.value)} data-testid="input-rental-search"/>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead><tr className="border-b border-[#214f46]/15 text-[10px] uppercase tracking-wider text-[#819087]"><th className="pb-3">Rider / bicycle</th><th className="pb-3">Pickup</th><th className="pb-3">Started / returned</th><th className="pb-3">Duration</th><th className="pb-3">Amount</th><th className="pb-3">Rental status</th><th className="pb-3">Payment</th></tr></thead>
          <tbody>{filteredRentals.map(r => <tr key={r.id} className="border-b border-[#214f46]/8" data-testid={`row-rental-${r.id}`}><td className="py-3"><b>{r.customerName}</b><p className="mt-1 text-[10px] text-[#78847b]">{r.bicycleCode}</p></td><td className="py-3">{state.stations.find(s => s.id === r.pickupStationId)?.name || "—"}</td><td className="py-3 text-[10px] leading-5">{niceDate(r.startedAt)}<br/>{r.returnedAt ? niceDate(r.returnedAt) : "Not returned"}</td><td className="py-3">{r.durationMinutes == null ? "—" : `${r.durationMinutes} min`}</td><td className="py-3 font-semibold">{money(r.amount, state.config.currency)}</td><td className="py-3"><Tag tone={r.status === "active" ? "green" : "neutral"}>{r.status}</Tag></td><td className="py-3">{r.status === "completed" ? <button onClick={() => setPayment(r)} className="rounded-full cursor-pointer" data-testid={`button-payment-${r.id}`}><Tag tone={r.paymentStatus === "paid" ? "green" : "amber"}>{r.paymentStatus} · change</Tag></button> : <Tag tone="neutral">Not due</Tag>}</td></tr>)}</tbody>
        </table>
        {!filteredRentals.length && <p className="py-10 text-center text-sm text-[#7b857c]">No rental records match that search.</p>}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <div className="rounded-xl bg-[#e7eee2] px-4 py-3"><span className="text-[10px] text-[#708075]">Collected</span><p className="mt-1 font-bold">{money(income, state.config.currency)}</p></div>
        <div className="rounded-xl bg-[#f5ead5] px-4 py-3"><span className="text-[10px] text-[#82765f]">Pending</span><p className="mt-1 font-bold">{money(pending, state.config.currency)}</p></div>
      </div>
    </section>}

    {tab === "care" && <div className="enter grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <section className="panel h-fit p-5 md:p-7">
        <p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Protect the fleet</p><h2 className="display mt-1 text-2xl font-semibold">Report a fault</h2>
        <p className="mt-2 text-xs leading-5 text-[#758078]">Reporting a fault marks the bicycle faulty and moves it into maintenance status.</p>
        <label className="mt-4 block text-xs font-semibold text-[#51675c]">
          Bicycle
          <select className="field mt-1.5" value={issueBike} onChange={e => setIssueBike(e.target.value)} data-testid="select-fault-bike">
            <option value="">Choose bicycle</option>
            {state.bicycles.map(b => {
              const meta = getBikeMeta(b);
              return <option key={b.id} value={b.id}>{b.code} · {meta.modelName} ({b.type})</option>;
            })}
          </select>
        </label>
        <label className="mt-4 block text-xs font-semibold text-[#51675c]">Issue details<textarea className="field mt-1.5 min-h-[92px] resize-y" value={issueText} onChange={e => setIssueText(e.target.value)} placeholder="Describe what the operator observed" data-testid="input-fault-issue"/></label>
        <button disabled={!issueBike || !issueText.trim()} onClick={reportFault} className="btn-primary mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold disabled:opacity-40 cursor-pointer" data-testid="button-report-fault"><Wrench size={15}/> Record fault</button>
      </section>

      <section className="panel p-5 md:p-7">
        <div className="flex items-end justify-between"><div><p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Workshop log</p><h2 className="display mt-1 text-2xl font-semibold">Maintenance records</h2></div><Tag tone="amber">{state.maintenance.filter(m => m.status !== "resolved").length} open</Tag></div>
        <div className="mt-4 space-y-3">{state.maintenance.length ? state.maintenance.map(m => <div key={m.id} className="rounded-xl border border-[#214f46]/10 p-4" data-testid={`row-maintenance-${m.id}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><b className="text-sm">{m.bicycleCode}</b><Tag tone={m.status === "resolved" ? "green" : m.status === "in_progress" ? "amber" : "red"}>{textCase(m.status)}</Tag></div><p className="mt-2 text-xs text-[#586e61]">{m.issue}</p><p className="mt-1 text-[10px] text-[#89938a]">{m.stationName} · reported {niceDate(m.reportedAt)}</p></div><select className="field max-w-[160px] !py-2 text-xs" value={m.status} onChange={e => { const status = e.target.value as EasyRideMaintenance["status"]; const resolved = status === "resolved"; save({ ...state, maintenance: state.maintenance.map(item => item.id === m.id ? { ...item, status } : item), bicycles: resolved ? state.bicycles.map(b => b.id === m.bicycleId ? { ...b, status: "available", condition: "good", lastChecked: when() } : b) : state.bicycles, activity: [{ id: uid(), message: `${m.bicycleCode} maintenance marked ${textCase(status)}`, createdAt: when(), kind: "maintenance" as const }, ...state.activity].slice(0, 100) }); }} data-testid={`select-maintenance-status-${m.id}`}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved · checked</option></select></div></div>) : <div className="rounded-xl bg-[#f1f0e7] px-6 py-12 text-center"><CheckCircle2 className="mx-auto text-[#6c9a74]"/><p className="mt-3 text-sm font-semibold">No maintenance issues recorded.</p><p className="mt-1 text-xs text-[#849087]">Faults logged by the team will appear here.</p></div>}</div>
        <p className="mt-4 text-[10px] leading-5 text-[#849087]">Mark resolved only after the bicycle is physically checked.</p>
      </section>
    </div>}

    {tab === "settings" && <div className="enter grid gap-5 lg:grid-cols-2">
      <section className="panel p-5 md:p-7">
        <p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Service profile</p><h2 className="display mt-1 text-2xl font-semibold">Location & pricing</h2>
        <p className="mt-2 text-xs leading-5 text-[#758078]">These details appear to riders as the service’s current settings.</p>
        <label className="mt-4 block text-xs font-semibold text-[#51675c]">Service name<input className="field mt-1.5" value={configName} onChange={e => setConfigName(e.target.value)} data-testid="input-config-name"/></label>
        <label className="mt-4 block text-xs font-semibold text-[#51675c]">Service area<input className="field mt-1.5" value={configArea} onChange={e => setConfigArea(e.target.value)} data-testid="input-config-area"/></label>
        <div className="mt-4 grid grid-cols-[1fr_130px] gap-3">
          <label className="text-xs font-semibold text-[#51675c]">Hourly rate<input type="number" min="0" step="100" className="field mt-1.5" value={rate} onChange={e => setRate(e.target.value)} data-testid="input-config-rate"/></label>
          <label className="text-xs font-semibold text-[#51675c]">Currency<input className="field mt-1.5" value={currency} onChange={e => setCurrency(e.target.value)} data-testid="input-config-currency"/></label>
        </div>
        <button onClick={saveConfig} disabled={!rate || Number(rate) < 0} className="btn-primary mt-5 rounded-xl px-5 py-3 text-xs font-bold disabled:opacity-40 cursor-pointer" data-testid="button-save-config">Save service settings</button>
      </section>

      <section className="relative overflow-hidden rounded-[18px] bg-[#e8e6d7] p-6 md:p-8">
        <p className="mono text-[10px] uppercase tracking-[.17em] text-[#73867a]">Operating principle</p>
        <h2 className="display mt-2 max-w-sm text-3xl font-semibold leading-tight">Clear records make a more dependable ride.</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#68776e]">Station availability and bicycle condition are only as current as the latest recorded check. This product operates as a responsive frontend with persistent local data.</p>
        <div className="mt-5 rounded-xl bg-[#f7f5ed]/75 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#3c6654]"><ShieldCheck size={16}/> Privacy by design</div>
          <p className="mt-2 text-xs leading-5 text-[#6f71]">Rental records store rider name, bicycle, time and amount. Payment details are not collected here.</p>
        </div>
        <BikeSketch className="bike-doodle text-[#567d66]"/>
      </section>
    </div>}
  </main>;
}

export default function EasyRidePage() {
  const { state, loading, error, retry, save, saving } = useEasyRide();
  const [path] = useLocation();
  const activePath = path.startsWith("/operator") ? "/operator" : path.startsWith("/rentals") ? "/rentals" : "/";
  const page = useMemo(() => {
    if (!state || loading || error) return null;
    if (activePath === "/rentals") return <Rentals state={state} save={save}/>;
    if (activePath === "/operator") return <Operator state={state} save={save} saving={saving}/>;
    return <Discovery state={state}/>;
  }, [state, loading, error, activePath, save, saving]);

  return <div className="page-shell grain min-h-[100dvh] flex flex-col justify-between">
    <div>
      <Topbar active={activePath}/>
      {loading ? <SkeletonPage/> : error || !state ? <MissingState error={error} retry={retry}/> : page}
    </div>
    <footer className="border-t border-[#214f46]/10 px-5 py-6 text-center text-[10px] text-[#849087]">
      <span className="font-semibold text-[#536f60]">{state?.config.serviceName || "EasyRide"}</span> · Electric, Mountain, City, Racing & Hybrid fleet · Makerere routes · Kampala, Uganda
    </footer>
  </div>;
}
