import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity, AlertTriangle, ArrowDownLeft, ArrowRight, ArrowUpRight, Bike, Building2,
  CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Clock3, Compass,
  CreditCard, Flame, Gauge, Hand, Info, Lock, MapPin, Menu, Mountain, Plus,
  RefreshCw, Search, Settings2, ShieldAlert, ShieldCheck, Shuffle, Sparkles,
  User, Users, Wrench, X, Zap,
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
  onOpenRoleModal,
}: {
  activePath: string;
  onOpenRoleModal: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isRider = activePath === "/rider" || activePath === "/rentals";
  const isStaff = activePath === "/staff" || activePath === "/operator";
  const isGuest = !isRider && !isStaff;

  const links = [
    { href: "/", label: "Guest / Home", active: isGuest },
    { href: "/rider", label: "Rider Dashboard", active: isRider },
    { href: "/staff", label: "Staff Dashboard", active: isStaff },
  ];

  return (
    <header className="bg-white/85 backdrop-blur-md border-b border-teal-900/10 sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <Logo />
        <nav className="hidden items-center gap-1.5 md:flex" aria-label="Main navigation">
          {links.map((item) => (
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
              {item.href === "/rider" && <User size={13} />}
              {item.href === "/staff" && <Wrench size={13} />}
              {item.href === "/" && <Compass size={13} />}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Current Active Mode indicator */}
        <div className="hidden items-center gap-3 sm:flex">
          <button
            onClick={onOpenRoleModal}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200/90 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-teal-900 transition cursor-pointer shadow-2xs"
            title="Click to view user roles & capabilities"
            data-testid="button-switch-role"
          >
            <span className={`w-2 h-2 rounded-full ${isStaff ? "bg-amber-500" : isRider ? "bg-emerald-500" : "bg-teal-600"} animate-pulse`}></span>
            <span>
              {isStaff ? "Staff Mode (Station Worker)" : isRider ? "Rider Mode (Customer)" : "Guest Explorer"}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Info ▾</span>
          </button>
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
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
          {links.map((item) => (
            <Link
              key={item.href}
              onClick={() => setOpen(false)}
              href={item.href}
              className={`rounded-xl px-3.5 py-2.5 text-xs font-bold no-underline flex items-center gap-2 ${
                item.active ? "bg-teal-800 text-white" : "text-teal-950 hover:bg-slate-50"
              }`}
            >
              {item.href === "/rider" && <User size={14} />}
              {item.href === "/staff" && <Wrench size={14} />}
              {item.href === "/" && <Compass size={14} />}
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="border-t border-slate-100 mt-2 pt-2">
            <button
              onClick={() => {
                setOpen(false);
                onOpenRoleModal();
              }}
              className="w-full text-left rounded-xl px-3.5 py-2 text-xs font-bold text-teal-800 hover:bg-teal-50 cursor-pointer flex items-center justify-between"
            >
              <span>System Roles & Capabilities</span>
              <span>ℹ️</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}

function RoleSelectorModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [, navigate] = useLocation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 enter">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-8 max-w-2xl w-full text-center relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-800 mx-auto mb-3 shadow-inner">
          <Bike size={24} />
        </div>
        <h2 className="display text-2xl font-bold text-teal-900 mb-1">EasyRide User Roles</h2>
        <p className="text-xs text-slate-500 mb-6">The system supports two specialized roles alongside the public guest dashboard</p>

        <div className="grid gap-5 sm:grid-cols-2 text-left">
          {/* Customer / Rider Card */}
          <div className="p-5 rounded-2xl border-2 border-teal-700/60 bg-teal-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-950 bg-teal-100/80 px-2.5 py-1 rounded-full">
                  <User size={13} /> User (The Rider)
                </span>
                <span className="text-[10px] font-bold text-teal-700 uppercase">Rents & rides</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 mt-3 font-medium">
                <li className="flex items-start gap-1.5"><span className="text-teal-700 font-bold">•</span> Looks up if a bike is available</li>
                <li className="flex items-start gap-1.5"><span className="text-teal-700 font-bold">•</span> Asks for a bike to be held</li>
                <li className="flex items-start gap-1.5"><span className="text-teal-700 font-bold">•</span> Sees the price before renting</li>
                <li className="flex items-start gap-1.5"><span className="text-teal-700 font-bold">•</span> Picks up the bike and rides it</li>
                <li className="flex items-start gap-1.5"><span className="text-teal-700 font-bold">•</span> Reports it if something is wrong with the bike</li>
                <li className="flex items-start gap-1.5"><span className="text-teal-700 font-bold">•</span> Returns the bike and sees what they owe</li>
              </ul>
            </div>
            <button
              onClick={() => {
                onClose();
                navigate("/rider");
              }}
              className="mt-5 w-full bg-teal-800 hover:bg-teal-900 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              Open Rider Dashboard <ArrowRight size={14} />
            </button>
          </div>

          {/* Staff / Station Worker Card */}
          <div className="p-5 rounded-2xl border-2 border-amber-600/40 bg-amber-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-100/90 px-2.5 py-1 rounded-full">
                  <Wrench size={13} /> Staff (Station Worker)
                </span>
                <span className="text-[10px] font-bold text-amber-800 uppercase">Checks & tracks</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 mt-3 font-medium">
                <li className="flex items-start gap-1.5"><span className="text-amber-700 font-bold">•</span> Checks that bikes are in good shape</li>
                <li className="flex items-start gap-1.5"><span className="text-amber-700 font-bold">•</span> Confirms the bike is ready for the rider</li>
                <li className="flex items-start gap-1.5"><span className="text-amber-700 font-bold">•</span> Gives the bike to the rider and records it</li>
                <li className="flex items-start gap-1.5"><span className="text-amber-700 font-bold">•</span> Takes the bike back and closes the rental</li>
                <li className="flex items-start gap-1.5"><span className="text-amber-700 font-bold">•</span> Records any problem with a bike</li>
                <li className="flex items-start gap-1.5"><span className="text-amber-700 font-bold">•</span> Keeps broken bikes out of use until fixed</li>
              </ul>
            </div>
            <button
              onClick={() => {
                onClose();
                navigate("/staff");
              }}
              className="mt-5 w-full bg-teal-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              Open Staff Dashboard <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
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
function GuestDashboard({ state }: { state: EasyRideState }) {
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
        <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Book your adventure in just one tap</p>
        <h1 className="display mt-4 text-[clamp(2.8rem,6.5vw,4.8rem)] font-extrabold leading-[.92] tracking-tight">
          Find your perfect<br/><span className="text-amber-300">ride today</span>
        </h1>
        <p className="mt-5 max-w-md text-sm leading-6 text-white/80">
          Explore our collection of high-quality bikes for every terrain. Whether you're commuting across Makerere, Kikoni, or Wandegeya, we've got you covered.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button onClick={() => navigate("/rider")} className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-3.5 text-sm font-bold text-teal-950 shadow-lg shadow-amber-400/20 hover:bg-amber-300 active:scale-[0.98] transition cursor-pointer" data-testid="button-start-ride">
            <User size={16} /> Enter as Rider <ArrowRight size={16}/>
          </button>
          <button onClick={() => navigate("/staff")} className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3.5 text-sm font-semibold text-white transition cursor-pointer">
            <Wrench size={15} /> Station Worker Portal
          </button>
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

    {/* Dual Portal Cards: User (Rider) vs Staff (Station Worker) */}
    <div className="mt-8 grid gap-5 md:grid-cols-2">
      <div className="panel p-6 border-l-4 border-l-teal-700 flex flex-col justify-between hover:shadow-md transition">
        <div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-teal-950 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60">
              <User size={14} className="text-teal-700" /> User (The Rider)
            </span>
            <span className="text-[11px] font-bold text-teal-800">Rents & rides</span>
          </div>
          <h3 className="display mt-3 text-xl font-bold text-teal-950">Looking to rent a bicycle?</h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-5">
            Look up live availability, reserve a bicycle to be held at your pickup point, see clear hourly pricing upfront, ride, and settle on return.
          </p>
          <ul className="mt-3 text-xs text-slate-500 space-y-1">
            <li className="flex items-center gap-1.5">✓ Hold requests with staff inspection</li>
            <li className="flex items-center gap-1.5">✓ Upfront hourly pricing estimate</li>
            <li className="flex items-center gap-1.5">✓ In-app fault reporting</li>
          </ul>
        </div>
        <button
          onClick={() => navigate("/rider")}
          className="mt-5 btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer"
        >
          Open Rider Dashboard <ArrowRight size={14} />
        </button>
      </div>

      <div className="panel p-6 border-l-4 border-l-amber-600 flex flex-col justify-between hover:shadow-md transition">
        <div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-950 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60">
              <Wrench size={14} className="text-amber-700" /> Staff (Station Worker)
            </span>
            <span className="text-[11px] font-bold text-amber-800">Checks & tracks</span>
          </div>
          <h3 className="display mt-3 text-xl font-bold text-teal-950">Managing a station?</h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-5">
            Perform physical roadworthiness checks, confirm held bikes ready for riders, dispatch rides, take returns, and isolate broken bikes until fixed.
          </p>
          <ul className="mt-3 text-xs text-slate-500 space-y-1">
            <li className="flex items-center gap-1.5">✓ Physical safety checklist verification</li>
            <li className="flex items-center gap-1.5">✓ Confirm & dispatch hold requests</li>
            <li className="flex items-center gap-1.5">✓ Quarantine broken bikes from circulation</li>
          </ul>
        </div>
        <button
          onClick={() => navigate("/staff")}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-900 hover:bg-black text-white px-4 py-2.5 text-xs font-bold transition cursor-pointer"
        >
          Open Staff Dashboard <ArrowRight size={14} />
        </button>
      </div>
    </div>

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
function RiderDashboard({ state, save }: { state: EasyRideState; save: (state: EasyRideState) => void }) {
  const params = new URLSearchParams(window.location.search);
  const initialBikeId = params.get("bike") || "";
  const initialBike = state.bicycles.find(b => b.id === initialBikeId);
  const initialStationId = params.get("station") || initialBike?.stationId || "";

  const [stationId, setStationId] = useState(initialStationId);
  const [customerName, setCustomerName] = useState("");
  const [bicycleId, setBicycleId] = useState(initialBikeId);
  const [holdNote, setHoldNote] = useState("");
  const [calcHours, setCalcHours] = useState(2);

  // Return dialog state
  const [returnId, setReturnId] = useState("");
  const [returnCondition, setReturnCondition] = useState<EasyRideBicycle["condition"] | "">("");
  const [returnNotes, setReturnNotes] = useState("");

  // Issue reporting state
  const [issueBikeId, setIssueBikeId] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueSubmitted, setIssueSubmitted] = useState(false);

  const addActivity = (activity: EasyRideActivity) => [activity, ...state.activity].slice(0, 100);

  // Available bikes (only available, non-faulty, not in maintenance)
  const availableBikes = state.bicycles.filter(b => b.status === "available" && b.condition !== "faulty" && (!stationId || b.stationId === stationId));
  const selectedStation = state.stations.find(s => s.id === stationId);

  // Active rentals & Holds
  const allActiveRentals = state.rentals.filter(r => r.status === "active");
  const heldReservations = allActiveRentals.filter(r => r.returnNotes === "HOLD_PENDING" || r.returnNotes === "HOLD_CONFIRMED");
  const onTripRentals = allActiveRentals.filter(r => r.returnNotes !== "HOLD_PENDING" && r.returnNotes !== "HOLD_CONFIRMED");
  const completedTrips = state.rentals.filter(r => r.status === "completed");

  // 1. Asks for a bike to be held
  const requestHold = () => {
    const bike = state.bicycles.find(b => b.id === bicycleId);
    const station = state.stations.find(s => s.id === stationId);
    if (!bike || !station || !customerName.trim()) return;
    const meta = getBikeMeta(bike);

    const rental: EasyRideRental = {
      id: uid(),
      customerName: customerName.trim(),
      bicycleId: bike.id,
      bicycleCode: bike.code,
      pickupStationId: station.id,
      startedAt: when(),
      returnedAt: null,
      durationMinutes: null,
      amount: 0,
      paymentStatus: "pending",
      status: "active",
      returnCondition: null,
      returnNotes: "HOLD_PENDING",
    };

    save({
      ...state,
      bicycles: state.bicycles.map(b => b.id === bike.id ? { ...b, status: "rented" } : b),
      rentals: [rental, ...state.rentals],
      activity: addActivity({
        id: uid(),
        message: `${bike.code} (${meta.modelName}) held for ${customerName.trim()} at ${station.name} · awaiting staff confirmation`,
        createdAt: when(),
        kind: "rental" as const,
      }),
    });
    setCustomerName("");
    setBicycleId("");
    setHoldNote("");
  };

  // 2. Immediate direct ride pickup
  const startDirectRide = () => {
    const bike = state.bicycles.find(b => b.id === bicycleId);
    const station = state.stations.find(s => s.id === stationId);
    if (!bike || !station || !customerName.trim()) return;
    const meta = getBikeMeta(bike);

    const rental: EasyRideRental = {
      id: uid(),
      customerName: customerName.trim(),
      bicycleId: bike.id,
      bicycleCode: bike.code,
      pickupStationId: station.id,
      startedAt: when(),
      returnedAt: null,
      durationMinutes: null,
      amount: 0,
      paymentStatus: "pending",
      status: "active",
      returnCondition: null,
      returnNotes: null,
    };

    save({
      ...state,
      bicycles: state.bicycles.map(b => b.id === bike.id ? { ...b, status: "rented" } : b),
      rentals: [rental, ...state.rentals],
      activity: addActivity({
        id: uid(),
        message: `${bike.code} (${meta.modelName}) checked out by ${customerName.trim()} at ${station.name}`,
        createdAt: when(),
        kind: "rental" as const,
      }),
    });
    setCustomerName("");
    setBicycleId("");
  };

  // Cancel a hold request
  const cancelHold = (rental: EasyRideRental) => {
    save({
      ...state,
      rentals: state.rentals.filter(r => r.id !== rental.id),
      bicycles: state.bicycles.map(b => b.id === rental.bicycleId ? { ...b, status: "available" } : b),
      activity: addActivity({
        id: uid(),
        message: `Hold on ${rental.bicycleCode} cancelled by rider`,
        createdAt: when(),
        kind: "rental" as const,
      }),
    });
  };

  // 3. Return the bike and see what you owe
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
      issue: note || "Rider reported issue on return check",
      reportedAt: now.toISOString(),
      status: "open",
      repairCost: 0,
    } : null;

    const activity: EasyRideActivity[] = [
      { id: uid(), message: `${rental.bicycleCode} returned to ${stationName} · ${money(amount, state.config.currency)} due`, createdAt: now.toISOString(), kind: "return" as const },
      ...(maintenanceRecord ? [{ id: uid(), message: `${rental.bicycleCode} quarantined for maintenance after return check`, createdAt: now.toISOString(), kind: "maintenance" as const }] : []),
      ...state.activity,
    ].slice(0, 100);

    save({
      ...state,
      rentals: state.rentals.map(r => r.id === rental.id ? { ...r, status: "completed", returnedAt: now.toISOString(), durationMinutes: duration, amount, paymentStatus: "pending", returnCondition, returnNotes: note || null } : r),
      bicycles: state.bicycles.map(b => b.id === rental.bicycleId ? { ...b, status: needsMaintenance ? "maintenance" : "available", condition: needsMaintenance ? "faulty" : returnCondition, stationId: rental.pickupStationId, lastChecked: now.toISOString() } : b),
      maintenance: maintenanceRecord ? [maintenanceRecord, ...state.maintenance] : state.maintenance,
      activity,
    });
    setReturnId("");
    setReturnCondition("");
    setReturnNotes("");
  };

  // 4. Report issues with bike
  const submitIssue = () => {
    const bike = state.bicycles.find(b => b.id === issueBikeId);
    if (!bike || !issueDescription.trim()) return;
    const station = state.stations.find(s => s.id === bike.stationId);

    const record: EasyRideMaintenance = {
      id: uid(),
      bicycleId: bike.id,
      bicycleCode: bike.code,
      stationName: station?.name || "Rider report",
      issue: issueDescription.trim(),
      reportedAt: when(),
      status: "open",
      repairCost: 0,
    };

    save({
      ...state,
      bicycles: state.bicycles.map(b => b.id === bike.id ? { ...b, condition: "faulty", status: "maintenance" } : b),
      maintenance: [record, ...state.maintenance],
      activity: addActivity({
        id: uid(),
        message: `Rider reported issue on ${bike.code}: ${issueDescription.trim()} (quarantined from fleet)`,
        createdAt: when(),
        kind: "maintenance" as const,
      }),
    });

    setIssueBikeId("");
    setIssueDescription("");
    setIssueSubmitted(true);
    setTimeout(() => setIssueSubmitted(false), 4000);
  };

  return (
    <main className="mx-auto max-w-[1320px] px-5 pb-16 pt-8 md:px-8 md:pt-12">
      <PageTitle
        eyebrow="Rider Portal / Self-Service Desk"
        title="Rent, ride & return."
        detail="Look up bike availability across stations, ask for a bike to be held, see the price upfront before renting, pick up your ride, return and see what you owe, or report any issues with a bike."
      />

      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        {/* Left Column: Hold / Book & Price Estimator */}
        <div className="space-y-6">
          {/* See Price Before Renting (Upfront Estimator) */}
          <section className="panel p-5 md:p-6 bg-gradient-to-br from-amber-50/70 to-white border-amber-200/60">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-800 font-bold flex items-center gap-1">
                  <CreditCard size={13} /> Upfront Pricing
                </p>
                <h3 className="display mt-1 text-xl font-bold text-teal-950">See price before renting</h3>
              </div>
              <span className="font-extrabold text-teal-900 bg-amber-100/80 px-3 py-1 rounded-xl text-xs border border-amber-200">
                {money(state.config.hourlyRate, state.config.currency)}/hr
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Select your planned trip length to estimate your cost. You are only charged for actual started hours upon return.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 6].map(h => (
                <button
                  key={h}
                  onClick={() => setCalcHours(h)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    calcHours === h
                      ? "bg-teal-800 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {h} {h === 1 ? "Hour" : "Hours"}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-white p-3.5 border border-amber-200/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Estimated cost for {calcHours} hr(s):</span>
                <p className="text-xl font-extrabold text-teal-900">
                  {money(calcHours * state.config.hourlyRate, state.config.currency)}
                </p>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
                No advance deposit
              </span>
            </div>
          </section>

          {/* Ask for a Bike to be Held / Start Ride */}
          <section className="panel p-5 md:p-6" data-testid="section-hold-rental">
            <div className="flex items-center justify-between">
              <div>
                <p className="mono text-[10px] uppercase tracking-[.18em] text-[#72867b] font-bold">Rider Booking</p>
                <h2 className="display mt-1 text-2xl font-bold text-teal-900">Reserve or Pick Up</h2>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-800"><Hand size={18}/></span>
            </div>

            <label className="mt-4 block text-xs font-semibold text-[#51675c]">
              Rider Name
              <input
                className="field mt-1.5"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Enter your name (e.g. Keith Kato)"
                data-testid="input-rider-name"
              />
            </label>

            <label className="mt-4 block text-xs font-semibold text-[#51675c]">
              1. Look up Pickup Station
              <select
                className="field mt-1.5"
                value={stationId}
                onChange={e => {
                  setStationId(e.target.value);
                  if (bicycleId) {
                    const b = state.bicycles.find(x => x.id === bicycleId);
                    if (b && b.stationId !== e.target.value) setBicycleId("");
                  }
                }}
                data-testid="select-pickup-station"
              >
                <option value="">Choose a pickup station</option>
                {state.stations.filter(s => s.active).map(s => (
                  <option key={s.id} value={s.id}>{s.name} · {s.area} ({s.landmark})</option>
                ))}
              </select>
            </label>

            <label className="mt-4 block text-xs font-semibold text-[#51675c]">
              2. Available Bicycle at Station
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

            {selectedStation && !availableBikes.length && (
              <p className="mt-3 text-xs text-rose-600 font-medium">
                No available bicycles recorded at this pickup point right now. Try selecting another station.
              </p>
            )}

            {/* Action buttons: Ask for Hold or Pick Up Immediately */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                disabled={!customerName.trim() || !stationId || !bicycleId}
                onClick={requestHold}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-teal-950 font-bold px-4 py-3 text-xs shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Hold the bike so station staff can prepare it for you"
                data-testid="button-request-hold"
              >
                <Hand size={14} /> Ask Bike to be Held
              </button>

              <button
                disabled={!customerName.trim() || !stationId || !bicycleId}
                onClick={startDirectRide}
                className="btn-primary flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 transition cursor-pointer"
                title="Pick up and ride right now"
                data-testid="button-begin-rental"
              >
                <Bike size={14} /> Pick Up & Ride Now
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5 text-center">
              Asking for a hold alerts station workers to check and reserve your bicycle.
            </p>
          </section>

          {/* Report an Issue with a Bike */}
          <section className="panel p-5 md:p-6 border-rose-100 bg-rose-50/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-rose-700 font-bold flex items-center gap-1">
                  <ShieldAlert size={13} /> Rider Safety
                </p>
                <h3 className="display mt-1 text-lg font-bold text-teal-950">Report an issue with a bike</h3>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-100 text-rose-700"><Wrench size={15}/></span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Notice loose brakes, a flat tire, or slipping chain? Report it here so station staff keeps it out of service.
            </p>

            <label className="mt-3 block text-xs font-semibold text-[#51675c]">
              Bicycle
              <select
                className="field mt-1 text-xs"
                value={issueBikeId}
                onChange={e => setIssueBikeId(e.target.value)}
              >
                <option value="">Select bicycle to report</option>
                {state.bicycles.map(b => {
                  const meta = getBikeMeta(b);
                  return (
                    <option key={b.id} value={b.id}>
                      {b.code} · {meta.modelName} ({b.type})
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="mt-3 block text-xs font-semibold text-[#51675c]">
              What is wrong with the bike?
              <textarea
                className="field mt-1 min-h-[70px] text-xs resize-y"
                value={issueDescription}
                onChange={e => setIssueDescription(e.target.value)}
                placeholder="e.g. Front brakes slipping, chain came off on hill..."
              />
            </label>

            <button
              disabled={!issueBikeId || !issueDescription.trim()}
              onClick={submitIssue}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold py-2.5 text-xs disabled:opacity-40 transition cursor-pointer"
            >
              <AlertTriangle size={14} /> Submit Fault Report
            </button>
            {issueSubmitted && (
              <p className="mt-2 text-xs text-emerald-700 font-bold text-center">
                ✓ Issue submitted. The bicycle has been quarantined from circulation.
              </p>
            )}
          </section>
        </div>

        {/* Right Column: Active Trips, Holds & Returns */}
        <div className="space-y-6">
          {/* Held Bikes (Awaiting Pickup) */}
          <section className="panel p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="mono text-[10px] uppercase tracking-[.18em] text-amber-700 font-bold">Held Bicycles</p>
                <h3 className="display mt-1 text-xl font-bold text-teal-900">
                  Bikes Asked to Be Held <span className="text-slate-400 font-normal">({heldReservations.length})</span>
                </h3>
              </div>
              <Tag tone="amber">Reservations</Tag>
            </div>

            {heldReservations.length ? (
              <div className="mt-4 space-y-3">
                {heldReservations.map(r => {
                  const station = state.stations.find(s => s.id === r.pickupStationId);
                  const isConfirmed = r.returnNotes === "HOLD_CONFIRMED";
                  return (
                    <div key={r.id} className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <b className="text-base font-extrabold text-teal-950">{r.bicycleCode}</b>
                            {isConfirmed ? (
                              <Tag tone="green">✅ Ready for Pickup</Tag>
                            ) : (
                              <Tag tone="amber">⏳ Staff Checking</Tag>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            Rider: <b>{r.customerName}</b> · Station: {station?.name || "Station"} ({station?.landmark})
                          </p>
                        </div>
                        <p className="text-[10px] mono text-slate-500">
                          HELD AT<br/>{niceDate(r.startedAt)}
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-600 font-medium">
                          {isConfirmed
                            ? "Station worker has confirmed this bike is ready for you!"
                            : "Station worker is inspecting this bike before handover."}
                        </span>
                        <button
                          onClick={() => cancelHold(r)}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 text-xs font-semibold cursor-pointer"
                        >
                          Cancel Hold
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl mt-4">
                No active hold requests. Ask for a bike to be held on the left.
              </div>
            )}
          </section>

          {/* Active Rides: Pick up, ride, return & see what you owe */}
          <section className="panel p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="mono text-[10px] uppercase tracking-[.18em] text-emerald-700 font-bold">On the Road</p>
                <h3 className="display mt-1 text-xl font-bold text-teal-900">
                  Active Trips <span className="text-slate-400 font-normal">({onTripRentals.length})</span>
                </h3>
              </div>
              <Tag tone="green">Riding</Tag>
            </div>

            {onTripRentals.length ? (
              <div className="mt-4 space-y-4">
                {onTripRentals.map(r => {
                  const station = state.stations.find(s => s.id === r.pickupStationId);
                  const started = new Date(r.startedAt);
                  const now = new Date();
                  const elapsedMins = Math.max(1, Math.ceil((now.getTime() - started.getTime()) / 60000));
                  const estimatedDue = Math.ceil(elapsedMins / 60) * state.config.hourlyRate;

                  return (
                    <article key={r.id} className="rounded-2xl border border-teal-200/80 bg-teal-50/30 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Tag tone="green">On Trip</Tag>
                            <h4 className="text-2xl font-extrabold text-teal-950">{r.bicycleCode}</h4>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">
                            Rider: <b>{r.customerName}</b> · Picked up at {station?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] mono text-slate-400">STARTED</p>
                          <p className="text-xs font-bold text-slate-700">{niceDate(r.startedAt)}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-teal-200/60 pt-3">
                        <div>
                          <span className="text-xs text-slate-500 font-medium">Trip time: <b>{elapsedMins} mins</b></span>
                          <span className="ml-2 font-bold text-teal-900 text-sm">Amount so far: {money(estimatedDue, state.config.currency)}</span>
                        </div>
                        <button
                          onClick={() => {
                            setReturnId(r.id);
                            setReturnCondition("");
                            setReturnNotes("");
                          }}
                          className="btn-quiet inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold cursor-pointer"
                        >
                          Return Bike & See What You Owe <ArrowDownLeft size={14}/>
                        </button>
                      </div>

                      {/* Return & Settlement Section */}
                      {returnId === r.id && (
                        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 enter">
                          <h4 className="text-sm font-bold text-teal-950">Return settlement for {r.bicycleCode}</h4>
                          <p className="text-xs text-slate-600 mt-1">
                            Recorded duration: <b>{elapsedMins} minutes</b>. Total amount due: <b className="text-teal-900 font-extrabold text-sm">{money(estimatedDue, state.config.currency)}</b>
                          </p>

                          <label className="mt-3 block text-xs font-semibold text-slate-700">
                            Condition on return
                            <select
                              className="field mt-1 text-xs"
                              value={returnCondition}
                              onChange={e => setReturnCondition(e.target.value as EasyRideBicycle["condition"] | "")}
                            >
                              <option value="">Select bike condition</option>
                              {["excellent", "good", "fair", "faulty"].map(c => (
                                <option key={c} value={c}>{textCase(c)}</option>
                              ))}
                            </select>
                          </label>

                          <label className="mt-3 block text-xs font-semibold text-slate-700">
                            Condition notes or faults noticed
                            <textarea
                              className="field mt-1 text-xs min-h-[60px] resize-y"
                              value={returnNotes}
                              onChange={e => setReturnNotes(e.target.value)}
                              placeholder="Describe any issues or damage found..."
                            />
                          </label>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              disabled={!returnCondition}
                              onClick={() => confirmReturn(r)}
                              className="btn-primary rounded-xl px-4 py-2 text-xs font-bold disabled:opacity-40 cursor-pointer"
                            >
                              Confirm Return ({money(estimatedDue, state.config.currency)})
                            </button>
                            <button
                              onClick={() => setReturnId("")}
                              className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 cursor-pointer"
                            >
                              Keep Riding
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl mt-4">
                No active rides in progress. Pick up a bicycle or check held reservations.
              </div>
            )}
          </section>

          {/* Recent Completed Trips */}
          <section className="panel p-5 md:p-6">
            <h3 className="text-sm font-bold text-teal-900">Recent Completed Trips & Receipts</h3>
            {completedTrips.slice(0, 4).length ? (
              <div className="mt-3 divide-y divide-slate-100">
                {completedTrips.slice(0, 4).map(r => (
                  <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <b className="text-teal-900">{r.bicycleCode}</b>
                      <span className="text-slate-500 ml-2">{r.customerName} · {r.durationMinutes ?? "—"} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-teal-900">{money(r.amount, state.config.currency)}</span>
                      <Tag tone={r.paymentStatus === "paid" ? "green" : "amber"}>{r.paymentStatus}</Tag>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">Completed rental history appears here.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// 3. STAFF / STATION WORKER DASHBOARD (/staff)
// ---------------------------------------------------------------------------
type StaffTab = "checklist" | "holds" | "returns" | "maintenance" | "records" | "settings";

function StaffDashboard({ state, save, saving }: { state: EasyRideState; save: (state: EasyRideState) => void; saving: boolean }) {
  const [tab, setTab] = useState<StaffTab>("checklist");
  const [stationFilter, setStationFilter] = useState<string>("");

  // Station worker state
  const [returnId, setReturnId] = useState("");
  const [returnCondition, setReturnCondition] = useState<EasyRideBicycle["condition"] | "">("");
  const [returnNotes, setReturnNotes] = useState("");
  const [paymentPaid, setPaymentPaid] = useState(true);

  // Fault report state
  const [issueBike, setIssueBike] = useState("");
  const [issueText, setIssueText] = useState("");
  const [newStationName, setNewStationName] = useState("");
  const [newStationArea, setNewStationArea] = useState("");
  const [newStationLandmark, setNewStationLandmark] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  // Settings
  const [hourlyRateInput, setHourlyRateInput] = useState(String(state.config.hourlyRate));
  const [currencyInput, setCurrencyInput] = useState(state.config.currency);

  const addActivity = (activity: EasyRideActivity) => [activity, ...state.activity].slice(0, 100);

  // Filtered bikes by station
  const stationBikes = state.bicycles.filter(b => !stationFilter || b.stationId === stationFilter);
  const activeRentals = state.rentals.filter(r => r.status === "active");
  const holdRequests = activeRentals.filter(r => r.returnNotes === "HOLD_PENDING" || r.returnNotes === "HOLD_CONFIRMED");
  const onTripRentals = activeRentals.filter(r => r.returnNotes !== "HOLD_PENDING" && r.returnNotes !== "HOLD_CONFIRMED");
  const brokenBikes = state.bicycles.filter(b => b.condition === "faulty" || b.status === "maintenance");
  const completedRentals = state.rentals.filter(r => r.status === "completed");
  const incomePaid = completedRentals.filter(r => r.paymentStatus === "paid").reduce((sum, r) => sum + r.amount, 0);

  // 1. Checks that bikes are in good shape (Record Physical Inspection)
  const recordInspection = (bike: EasyRideBicycle) => {
    const nowIso = when();
    save({
      ...state,
      bicycles: state.bicycles.map(b => b.id === bike.id ? { ...b, lastChecked: nowIso } : b),
      activity: addActivity({
        id: uid(),
        message: `Station worker physically inspected ${bike.code} (${textCase(bike.condition)} condition verified)`,
        createdAt: nowIso,
        kind: "maintenance" as const,
      }),
    });
  };

  const updateBikeCondition = (bikeId: string, condition: EasyRideBicycle["condition"]) => {
    const isFaulty = condition === "faulty";
    save({
      ...state,
      bicycles: state.bicycles.map(b => b.id === bikeId ? {
        ...b,
        condition,
        status: isFaulty ? "maintenance" : (b.status === "maintenance" ? "available" : b.status),
        lastChecked: when(),
      } : b),
      activity: addActivity({
        id: uid(),
        message: `Bike ${bikeId} condition updated to ${condition} by station worker`,
        createdAt: when(),
        kind: "maintenance" as const,
      }),
    });
  };

  // 2. Confirms the bike is ready for the rider
  const confirmHoldReady = (rental: EasyRideRental) => {
    save({
      ...state,
      rentals: state.rentals.map(r => r.id === rental.id ? { ...r, returnNotes: "HOLD_CONFIRMED" } : r),
      bicycles: state.bicycles.map(b => b.id === rental.bicycleId ? { ...b, lastChecked: when() } : b),
      activity: addActivity({
        id: uid(),
        message: `Station worker confirmed ${rental.bicycleCode} is inspected & ready for rider ${rental.customerName}`,
        createdAt: when(),
        kind: "rental" as const,
      }),
    });
  };

  // 3. Gives the bike to the rider and records it
  const dispatchBikeToRider = (rental: EasyRideRental) => {
    save({
      ...state,
      rentals: state.rentals.map(r => r.id === rental.id ? { ...r, returnNotes: null, startedAt: when() } : r),
      activity: addActivity({
        id: uid(),
        message: `Station worker issued & handed over ${rental.bicycleCode} to ${rental.customerName} on trip`,
        createdAt: when(),
        kind: "rental" as const,
      }),
    });
  };

  // 4. Takes the bike back and closes the rental
  const closeRental = (rental: EasyRideRental) => {
    if (!returnCondition) return;
    const now = new Date();
    const started = new Date(rental.startedAt);
    const duration = Math.max(1, Math.ceil((now.getTime() - started.getTime()) / 60000));
    const amount = Math.ceil(duration / 60) * state.config.hourlyRate;
    const stationName = state.stations.find(s => s.id === rental.pickupStationId)?.name || "Station";
    const note = returnNotes.trim();
    const isFaulty = returnCondition === "faulty" || note.length > 0;

    const maintenanceRecord: EasyRideMaintenance | null = isFaulty ? {
      id: uid(),
      bicycleId: rental.bicycleId,
      bicycleCode: rental.bicycleCode,
      stationName,
      issue: note || "Fault discovered during return inspection",
      reportedAt: now.toISOString(),
      status: "open",
      repairCost: 0,
    } : null;

    save({
      ...state,
      rentals: state.rentals.map(r => r.id === rental.id ? {
        ...r,
        status: "completed",
        returnedAt: now.toISOString(),
        durationMinutes: duration,
        amount,
        paymentStatus: paymentPaid ? "paid" : "pending",
        returnCondition,
        returnNotes: note || null,
      } : r),
      bicycles: state.bicycles.map(b => b.id === rental.bicycleId ? {
        ...b,
        status: isFaulty ? "maintenance" : "available",
        condition: isFaulty ? "faulty" : returnCondition,
        lastChecked: now.toISOString(),
      } : b),
      maintenance: maintenanceRecord ? [maintenanceRecord, ...state.maintenance] : state.maintenance,
      activity: [
        { id: uid(), message: `Rental closed: ${rental.bicycleCode} checked in by staff · ${money(amount, state.config.currency)} collected (${paymentPaid ? "Paid" : "Pending"})`, createdAt: now.toISOString(), kind: "return" as const },
        ...(maintenanceRecord ? [{ id: uid(), message: `⚠️ ${rental.bicycleCode} quarantined to workshop: ${note || "Fault"}`, createdAt: now.toISOString(), kind: "maintenance" as const }] : []),
        ...state.activity,
      ].slice(0, 100),
    });

    setReturnId("");
    setReturnCondition("");
    setReturnNotes("");
  };

  // 5. Records any problem with a bike
  const logFault = () => {
    const bike = state.bicycles.find(b => b.id === issueBike);
    if (!bike || !issueText.trim()) return;
    const station = state.stations.find(s => s.id === bike.stationId);

    const record: EasyRideMaintenance = {
      id: uid(),
      bicycleId: bike.id,
      bicycleCode: bike.code,
      stationName: station?.name || "Station",
      issue: issueText.trim(),
      reportedAt: when(),
      status: "open",
      repairCost: 0,
    };

    save({
      ...state,
      bicycles: state.bicycles.map(b => b.id === bike.id ? { ...b, condition: "faulty", status: "maintenance" } : b),
      maintenance: [record, ...state.maintenance],
      activity: addActivity({
        id: uid(),
        message: `Station worker quarantined ${bike.code} for maintenance: ${issueText.trim()}`,
        createdAt: when(),
        kind: "maintenance" as const,
      }),
    });
    setIssueBike("");
    setIssueText("");
  };

  // 6. Keeps broken bikes out of use until fixed (resolve repair)
  const resolveRepair = (item: EasyRideMaintenance) => {
    save({
      ...state,
      maintenance: state.maintenance.map(m => m.id === item.id ? { ...m, status: "resolved" } : m),
      bicycles: state.bicycles.map(b => b.id === item.bicycleId ? { ...b, status: "available", condition: "good", lastChecked: when() } : b),
      activity: addActivity({
        id: uid(),
        message: `Repair completed: ${item.bicycleCode} inspected, tested and returned to available fleet`,
        createdAt: when(),
        kind: "maintenance" as const,
      }),
    });
  };

  const tabs = [
    { id: "checklist" as const, label: `Check Bikes (${stationBikes.length})`, icon: ShieldCheck },
    { id: "holds" as const, label: `Hold Requests (${holdRequests.length})`, icon: Hand, badge: holdRequests.length },
    { id: "returns" as const, label: `Takes Back & Close (${onTripRentals.length})`, icon: ArrowDownLeft },
    { id: "maintenance" as const, label: `Workshop (${brokenBikes.length})`, icon: Wrench, alert: brokenBikes.length },
    { id: "records" as const, label: "Rental Log & Payments", icon: CreditCard },
    { id: "settings" as const, label: "Station Config", icon: Settings2 },
  ];

  return (
    <main className="mx-auto max-w-[1320px] px-5 pb-16 pt-8 md:px-8 md:pt-12">
      <PageTitle
        eyebrow="Staff Portal / Station Worker Desk"
        title="Inspect, dispatch & maintain."
        detail="Check bikes are in good shape, confirm bikes are ready for riders, give bikes and record rentals, take bikes back and close rentals, record any problems, and keep broken bikes out of use until fixed."
        side={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">Station:</span>
            <select
              value={stationFilter}
              onChange={e => setStationFilter(e.target.value)}
              className="bg-white border border-slate-200 text-teal-900 text-xs font-bold rounded-xl px-3 py-2 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-700/40"
            >
              <option value="">All Stations ({state.stations.length})</option>
              {state.stations.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.area})</option>
              ))}
            </select>
          </div>
        }
      />

      {/* Staff Tab Bar */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto rounded-2xl bg-[#e9e9df] p-1.5 no-scrollbar">
        {tabs.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              tab === item.id
                ? "bg-[#214f46] text-[#f7f5ed] shadow-sm"
                : "text-[#6c7a70] hover:bg-[#f3f1e8]"
            }`}
          >
            <item.icon size={15}/>
            <span>{item.label}</span>
            {item.badge ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-teal-950 font-extrabold">
                {item.badge}
              </span>
            ) : null}
            {item.alert ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-extrabold">
                {item.alert}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* 1. CHECK BIKES ARE IN GOOD SHAPE */}
      {tab === "checklist" && (
        <section className="space-y-4 enter">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="display text-xl font-bold text-teal-900">Station Bike Checklist</h3>
              <p className="text-xs text-slate-500">Physically verify roadworthiness (brakes, tires, chain) before handing bikes to riders.</p>
            </div>
            <span className="text-xs text-slate-600 font-bold bg-white px-3 py-1 rounded-xl border border-slate-200">
              {stationBikes.filter(b => b.status === "available").length} road-ready · {stationBikes.filter(b => b.condition === "faulty").length} broken
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stationBikes.map(b => {
              const meta = getBikeMeta(b);
              const station = state.stations.find(s => s.id === b.stationId);
              const isBroken = b.condition === "faulty" || b.status === "maintenance";

              return (
                <div
                  key={b.id}
                  className={`rounded-2xl p-4 border transition ${
                    isBroken
                      ? "bg-rose-50/50 border-rose-300"
                      : "bg-white border-slate-200 shadow-2xs hover:border-teal-700/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <b className="text-base font-extrabold text-teal-950">{b.code}</b>
                        <span className="text-xs text-slate-500 font-medium">({b.type})</span>
                      </div>
                      <p className="text-xs text-slate-700 font-semibold">{meta.modelName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{station?.name || "Off station"}</p>
                    </div>
                    <Tag tone={isBroken ? "red" : b.status === "available" ? "green" : "amber"}>
                      {isBroken ? "Broken" : textCase(b.status)}
                    </Tag>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">CONDITION</span>
                      <select
                        value={b.condition}
                        onChange={e => updateBikeCondition(b.id, e.target.value as EasyRideBicycle["condition"])}
                        className="text-xs font-bold text-teal-950 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 mt-0.5"
                      >
                        {["excellent", "good", "fair", "faulty"].map(c => (
                          <option key={c} value={c}>{textCase(c)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">CHECKED</span>
                      <span className="text-[11px] font-semibold text-slate-600">{niceDate(b.lastChecked)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => recordInspection(b)}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/80 transition cursor-pointer"
                  >
                    <CheckCircle2 size={13} className="text-teal-700" /> Confirm Good Shape (Check Now)
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. CONFIRMS THE BIKE IS READY & GIVES BIKE TO RIDER */}
      {tab === "holds" && (
        <section className="space-y-4 enter">
          <div>
            <h3 className="display text-xl font-bold text-teal-900">Rider Hold Requests & Dispatch</h3>
            <p className="text-xs text-slate-500">Confirm requested bicycles are tuned and ready, then record hand-off to the rider.</p>
          </div>

          {holdRequests.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {holdRequests.map(r => {
                const bike = state.bicycles.find(b => b.id === r.bicycleId);
                const meta = bike ? getBikeMeta(bike) : null;
                const station = state.stations.find(s => s.id === r.pickupStationId);
                const isConfirmed = r.returnNotes === "HOLD_CONFIRMED";

                return (
                  <div key={r.id} className="panel p-5 border-l-4 border-l-amber-500 bg-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <b className="text-lg font-extrabold text-teal-950">{r.bicycleCode}</b>
                          {isConfirmed ? (
                            <Tag tone="green">✅ Ready for Rider</Tag>
                          ) : (
                            <Tag tone="amber">⏳ Pending Check</Tag>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">Rider: <b className="text-teal-900">{r.customerName}</b></p>
                        <p className="text-xs text-slate-500">{meta?.modelName} · {station?.name}</p>
                      </div>
                      <span className="mono text-[10px] text-slate-400">HOLD REQUEST</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                      {!isConfirmed && (
                        <button
                          onClick={() => confirmHoldReady(r)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-teal-950 transition cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 size={14} /> Confirm Bike Ready for Rider
                        </button>
                      )}

                      <button
                        onClick={() => dispatchBikeToRider(r)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-teal-800 hover:bg-teal-900 text-white transition cursor-pointer shadow-xs"
                      >
                        <Bike size={14} /> Give Bike & Record Start
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="panel p-10 text-center">
              <CheckCircle2 className="mx-auto text-emerald-600 mb-2" size={32} />
              <h4 className="font-bold text-teal-900">No pending hold requests</h4>
              <p className="text-xs text-slate-500 mt-1">When riders ask for a bike to be held, their requests appear here for inspection & confirmation.</p>
            </div>
          )}
        </section>
      )}

      {/* 3. TAKES THE BIKE BACK AND CLOSES THE RENTAL */}
      {tab === "returns" && (
        <section className="space-y-4 enter">
          <div>
            <h3 className="display text-xl font-bold text-teal-900">Active Rentals & Returns Check-In</h3>
            <p className="text-xs text-slate-500">When riders bring bikes back, verify condition, calculate amount owed, and close rental record.</p>
          </div>

          {onTripRentals.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {onTripRentals.map(r => {
                const station = state.stations.find(s => s.id === r.pickupStationId);
                const started = new Date(r.startedAt);
                const now = new Date();
                const elapsedMins = Math.max(1, Math.ceil((now.getTime() - started.getTime()) / 60000));
                const amountDue = Math.ceil(elapsedMins / 60) * state.config.hourlyRate;

                return (
                  <div key={r.id} className="panel p-5 bg-white border border-slate-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Tag tone="green">Out on road</Tag>
                          <b className="text-lg font-extrabold text-teal-950">{r.bicycleCode}</b>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">Rider: <b className="text-teal-900">{r.customerName}</b></p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Picked up at: {station?.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] mono text-slate-400">TRIP TIME</span>
                        <p className="text-xs font-extrabold text-teal-900">{elapsedMins} mins</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">Amount Due</span>
                        <p className="text-base font-extrabold text-teal-950">{money(amountDue, state.config.currency)}</p>
                      </div>
                      <button
                        onClick={() => {
                          setReturnId(r.id);
                          setReturnCondition("good");
                          setReturnNotes("");
                        }}
                        className="btn-primary rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
                      >
                        Take Bike Back & Close
                      </button>
                    </div>

                    {/* Staff Check-in Box */}
                    {returnId === r.id && (
                      <div className="mt-4 p-4 rounded-xl bg-teal-50 border border-teal-200 enter">
                        <h5 className="font-bold text-teal-950 text-xs">Verify Condition & Close</h5>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <label className="font-semibold text-slate-700">
                            Condition
                            <select
                              value={returnCondition}
                              onChange={e => setReturnCondition(e.target.value as EasyRideBicycle["condition"])}
                              className="field mt-1 text-xs"
                            >
                              {["excellent", "good", "fair", "faulty"].map(c => (
                                <option key={c} value={c}>{textCase(c)}</option>
                              ))}
                            </select>
                          </label>

                          <label className="font-semibold text-slate-700">
                            Payment Status
                            <select
                              value={paymentPaid ? "paid" : "pending"}
                              onChange={e => setPaymentPaid(e.target.value === "paid")}
                              className="field mt-1 text-xs"
                            >
                              <option value="paid">Paid ({money(amountDue, state.config.currency)})</option>
                              <option value="pending">Pending Collection</option>
                            </select>
                          </label>
                        </div>

                        <label className="mt-2 block text-xs font-semibold text-slate-700">
                          Staff inspection notes
                          <input
                            type="text"
                            value={returnNotes}
                            onChange={e => setReturnNotes(e.target.value)}
                            placeholder="e.g. Checked tires and brakes, clean"
                            className="field mt-1 text-xs"
                          />
                        </label>

                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => closeRental(r)}
                            className="btn-primary flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Close Rental & Record
                          </button>
                          <button
                            onClick={() => setReturnId("")}
                            className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="panel p-10 text-center">
              <Compass className="mx-auto text-teal-600 mb-2" size={32} />
              <h4 className="font-bold text-teal-900">No active rentals on trip</h4>
              <p className="text-xs text-slate-500 mt-1">When bikes are checked out, they will appear here for return inspection.</p>
            </div>
          )}
        </section>
      )}

      {/* 4. WORKSHOP & KEEPS BROKEN BIKES OUT OF USE */}
      {tab === "maintenance" && (
        <section className="space-y-5 enter">
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-600 text-white font-bold">
                <ShieldAlert size={20}/>
              </span>
              <div>
                <h4 className="text-sm font-bold text-rose-950">Quarantine Protocol: Keep Broken Bikes Out of Use</h4>
                <p className="text-xs text-rose-800">
                  Faulty bicycles are locked from customer view and cannot be rented or held until fixed and re-inspected.
                </p>
              </div>
            </div>
            <span className="font-extrabold text-sm text-rose-800 bg-white px-3 py-1 rounded-xl border border-rose-200">
              {brokenBikes.length} in quarantine
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_.9fr]">
            {/* List of Broken / Maintenance Bikes */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-teal-900">Workshop Log ({state.maintenance.filter(m => m.status !== "resolved").length} Open)</h4>
              {state.maintenance.length ? (
                state.maintenance.map(m => {
                  const isResolved = m.status === "resolved";
                  return (
                    <div key={m.id} className={`panel p-4 border ${isResolved ? "opacity-60 bg-slate-50" : "bg-white border-rose-200"}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <b className="text-sm font-extrabold text-teal-950">{m.bicycleCode}</b>
                            <Tag tone={isResolved ? "green" : m.status === "in_progress" ? "amber" : "red"}>
                              {textCase(m.status)}
                            </Tag>
                          </div>
                          <p className="text-xs text-slate-700 mt-1.5 font-medium">{m.issue}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{m.stationName} · reported {niceDate(m.reportedAt)}</p>
                        </div>

                        {!isResolved && (
                          <button
                            onClick={() => resolveRepair(m)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                          >
                            Mark Fixed & Check
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center panel">No maintenance records logged.</p>
              )}
            </div>

            {/* Record New Problem */}
            <div className="panel p-5 bg-white border border-slate-200 h-fit">
              <h4 className="text-sm font-bold text-teal-900 flex items-center gap-2">
                <Wrench size={16} className="text-teal-700"/> Record Problem with a Bike
              </h4>
              <p className="text-xs text-slate-500 mt-1">Instantly marks the bike faulty and locks it from rider booking.</p>

              <label className="mt-4 block text-xs font-semibold text-slate-700">
                Bicycle to quarantine
                <select
                  value={issueBike}
                  onChange={e => setIssueBike(e.target.value)}
                  className="field mt-1 text-xs"
                >
                  <option value="">Select bicycle</option>
                  {state.bicycles.map(b => {
                    const meta = getBikeMeta(b);
                    return (
                      <option key={b.id} value={b.id}>
                        {b.code} · {meta.modelName} ({b.type})
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="mt-3 block text-xs font-semibold text-slate-700">
                Problem details
                <textarea
                  value={issueText}
                  onChange={e => setIssueText(e.target.value)}
                  placeholder="Describe damage or faults observed..."
                  className="field mt-1 text-xs min-h-[80px] resize-y"
                />
              </label>

              <button
                disabled={!issueBike || !issueText.trim()}
                onClick={logFault}
                className="btn-primary mt-4 w-full py-2.5 rounded-xl text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                Quarantine Bike for Repair
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 5. RENTAL LOG & PAYMENTS */}
      {tab === "records" && (
        <section className="panel p-6 enter">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="display text-xl font-bold text-teal-900">Rental Records & Payments</h3>
              <p className="text-xs text-slate-500">Track all rider checkouts, returns, and payment collection status.</p>
            </div>
            <input
              type="text"
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              placeholder="Filter rider or bike..."
              className="field max-w-xs text-xs"
            />
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Rider / Bike</th>
                  <th className="pb-3">Pickup Station</th>
                  <th className="pb-3">Started</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.rentals
                  .filter(r => `${r.customerName} ${r.bicycleCode}`.toLowerCase().includes(filterSearch.toLowerCase()))
                  .map(r => (
                    <tr key={r.id}>
                      <td className="py-3">
                        <b className="text-teal-950">{r.customerName}</b>
                        <p className="text-[11px] text-slate-400">{r.bicycleCode}</p>
                      </td>
                      <td className="py-3">{state.stations.find(s => s.id === r.pickupStationId)?.name || "—"}</td>
                      <td className="py-3 text-[11px]">{niceDate(r.startedAt)}</td>
                      <td className="py-3">{r.durationMinutes != null ? `${r.durationMinutes} min` : "On trip"}</td>
                      <td className="py-3 font-extrabold text-teal-950">{money(r.amount, state.config.currency)}</td>
                      <td className="py-3">
                        <Tag tone={r.status === "completed" ? "neutral" : "green"}>{r.status}</Tag>
                      </td>
                      <td className="py-3">
                        <Tag tone={r.paymentStatus === "paid" ? "green" : "amber"}>{r.paymentStatus}</Tag>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Total Collected: <b className="text-teal-900 text-sm font-extrabold">{money(incomePaid, state.config.currency)}</b></span>
            <span className="text-slate-400">Records stored locally in browser state</span>
          </div>
        </section>
      )}

      {/* 6. STATION CONFIGURATION */}
      {tab === "settings" && (
        <section className="grid gap-6 md:grid-cols-2 enter">
          <div className="panel p-6">
            <h4 className="text-sm font-bold text-teal-900">Service & Rate Settings</h4>
            <p className="text-xs text-slate-500 mt-1">Configure pricing shown to riders upfront.</p>

            <label className="mt-4 block text-xs font-semibold text-slate-700">
              Hourly Rate ({state.config.currency})
              <input
                type="number"
                value={hourlyRateInput}
                onChange={e => setHourlyRateInput(e.target.value)}
                className="field mt-1 text-xs"
              />
            </label>

            <label className="mt-3 block text-xs font-semibold text-slate-700">
              Currency
              <input
                type="text"
                value={currencyInput}
                onChange={e => setCurrencyInput(e.target.value)}
                className="field mt-1 text-xs"
              />
            </label>

            <button
              onClick={() => {
                const rateNum = Number(hourlyRateInput);
                if (rateNum > 0) {
                  save({
                    ...state,
                    config: {
                      ...state.config,
                      hourlyRate: rateNum,
                      currency: currencyInput.trim() || state.config.currency,
                    },
                  });
                }
              }}
              className="btn-primary mt-4 py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer"
            >
              Save Pricing Settings
            </button>
          </div>

          <div className="panel p-6">
            <h4 className="text-sm font-bold text-teal-900">Active Pickup Points ({state.stations.length})</h4>
            <div className="mt-3 space-y-2">
              {state.stations.map(st => (
                <div key={st.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <b>{st.name}</b>
                    <p className="text-[11px] text-slate-400">{st.area} · {st.landmark}</p>
                  </div>
                  <Tag tone={st.active ? "green" : "neutral"}>{st.active ? "Open" : "Paused"}</Tag>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// MAIN PAGE ROUTER
// ---------------------------------------------------------------------------
export default function EasyRidePage() {
  const { state, loading, error, retry, save, saving } = useEasyRide();
  const [path] = useLocation();
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const isStaffPath = path.startsWith("/staff") || path.startsWith("/operator");
  const isRiderPath = path.startsWith("/rider") || path.startsWith("/rentals");

  const page = useMemo(() => {
    if (!state || loading || error) return null;
    if (isStaffPath) return <StaffDashboard state={state} save={save} saving={saving} />;
    if (isRiderPath) return <RiderDashboard state={state} save={save} />;
    return <GuestDashboard state={state} />;
  }, [state, loading, error, isStaffPath, isRiderPath, save, saving]);

  return (
    <div className="page-shell grain min-h-[100dvh] flex flex-col justify-between">
      <div>
        <Topbar activePath={path} onOpenRoleModal={() => setRoleModalOpen(true)} />
        {loading ? <SkeletonPage /> : error || !state ? <MissingState error={error} retry={retry} /> : page}
      </div>
      <footer className="border-t border-[#214f46]/10 px-5 py-6 text-center text-[10px] text-[#849087]">
        <span className="font-semibold text-[#536f60]">{state?.config.serviceName || "EasyRide"}</span> · {isStaffPath ? "Staff Portal (Station Worker)" : isRiderPath ? "Rider Portal (Customer)" : "Guest Public Dashboard"} · Makerere routes · Kampala, Uganda
      </footer>

      <RoleSelectorModal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
      />
    </div>
  );
}
