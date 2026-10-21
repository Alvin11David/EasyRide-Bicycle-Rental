import { useMemo, useState, type ReactNode } from "react";
import type {
  EasyRideActivity,
  EasyRideBicycle,
  EasyRideMaintenance,
  EasyRideRental,
  EasyRideState,
  EasyRideStation,
} from "@workspace/api-client-react";
import type { EasyRideUser } from "@/hooks/use-auth";
import { getBikeMeta } from "@/lib/mock-data";
import { clockTime, initials, money, niceDate, textCase, uid, when } from "@/lib/format";

// ---------------------------------------------------------------------------
// Icons — inlined so the console matches the approved staff mockup exactly.
// ---------------------------------------------------------------------------

type GlyphName =
  | "home"
  | "bike"
  | "card"
  | "users"
  | "cog"
  | "arrows"
  | "doc"
  | "sliders"
  | "chart"
  | "search"
  | "bell"
  | "chevron"
  | "clock"
  | "arrowRight"
  | "menu"
  | "x";

function Glyph({ name, className = "" }: { name: GlyphName; className?: string }) {
  const base = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    className,
    "aria-hidden": true,
  } as const;

  switch (name) {
    case "home":
      return (
        <svg {...base} strokeWidth={2}>
          <path
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "bike":
      return (
        <svg {...base}>
          <circle cx="5.5" cy="17.5" r="3.5" />
          <circle cx="18.5" cy="17.5" r="3.5" />
          <path
            d="M15 6h-3.5L8.5 14h6.5l2.5-4.5H19"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M12 10.5 8 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "card":
      return (
        <svg {...base}>
          <path
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "users":
      return (
        <svg {...base}>
          <path
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "cog":
      return (
        <svg {...base}>
          <path
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "arrows":
      return (
        <svg {...base}>
          <path
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "doc":
      return (
        <svg {...base}>
          <path
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "sliders":
      return (
        <svg {...base}>
          <path
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "chart":
      return (
        <svg {...base}>
          <path
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "search":
      return (
        <svg {...base} strokeWidth={2}>
          <path
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "bell":
      return (
        <svg {...base}>
          <path
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "chevron":
      return (
        <svg {...base} strokeWidth={2}>
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "clock":
      return (
        <svg {...base} strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "arrowRight":
      return (
        <svg {...base} strokeWidth={2}>
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "menu":
      return (
        <svg {...base} strokeWidth={2}>
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "x":
      return (
        <svg {...base} strokeWidth={2}>
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Navigation model
// ---------------------------------------------------------------------------

type StaffSection =
  | "dashboard"
  | "borrowed"
  | "transactions"
  | "customers"
  | "maintenance"
  | "movement"
  | "receipts"
  | "settings"
  | "reports";

const NAV_ITEMS: {
  id: StaffSection;
  icon: GlyphName;
  title: string;
  subtitle: string;
}[] = [
  { id: "dashboard", icon: "home", title: "Dashboard", subtitle: "Overview & statistics" },
  { id: "borrowed", icon: "bike", title: "Borrowed Bikes", subtitle: "Fleet in use & returns" },
  { id: "transactions", icon: "card", title: "Manual Transactions", subtitle: "Manage fleet" },
  { id: "customers", icon: "users", title: "Customer Management", subtitle: "Manage customers" },
  { id: "maintenance", icon: "cog", title: "Maintenance", subtitle: "Workshop & repairs" },
  { id: "movement", icon: "arrows", title: "Bike Movement", subtitle: "Movement log" },
  { id: "receipts", icon: "doc", title: "Receipts", subtitle: "Records & payments" },
  { id: "settings", icon: "sliders", title: "Settings", subtitle: "Account & preferences" },
  { id: "reports", icon: "chart", title: "Reports", subtitle: "View and manage reports" },
];

const SECTION_TITLES: Record<StaffSection, { eyebrow: string; title: string; detail: string }> = {
  dashboard: {
    eyebrow: "Control Center",
    title: "Staff Dashboard",
    detail: "Monitor rentals, receipts, and system activity across all stations in real time.",
  },
  borrowed: {
    eyebrow: "Fleet In Use",
    title: "Borrowed Bikes",
    detail: "Track every bike currently out with a rider and close the rental when it comes back.",
  },
  transactions: {
    eyebrow: "Station Desk",
    title: "Manual Transactions",
    detail: "Inspect bikes on the rack, confirm holds and hand bikes over to riders.",
  },
  customers: {
    eyebrow: "Riders",
    title: "Customer Management",
    detail: "Every rider who has used the service, with their trips and what they owe.",
  },
  maintenance: {
    eyebrow: "Workshop",
    title: "Maintenance",
    detail: "Quarantine faulty bicycles and keep them out of service until they are fixed.",
  },
  movement: {
    eyebrow: "Fleet Log",
    title: "Bike Movement",
    detail: "Where every bicycle is right now and when it was last checked.",
  },
  receipts: {
    eyebrow: "Payments",
    title: "Receipts",
    detail: "Full rental log with amounts charged and payment collection status.",
  },
  settings: {
    eyebrow: "Configuration",
    title: "Settings",
    detail: "Configure pricing and review the pickup points you are running.",
  },
  reports: {
    eyebrow: "Insights",
    title: "Reports",
    detail: "Revenue, fleet utilisation and station performance at a glance.",
  },
};

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  detail,
  side,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  side?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-0.5 text-sm font-normal text-slate-500">{detail}</p>
      </div>
      {side ? <div className="shrink-0">{side}</div> : null}
    </section>
  );
}

function StatCard({
  dot,
  badge,
  badgeClass,
  value,
  label,
  valueClass = "",
}: {
  dot: string;
  badge?: string;
  badgeClass?: string;
  value: string;
  label: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all duration-150 hover:border-slate-300">
      <div className="mb-2 flex items-center justify-between">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        {badge ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${badgeClass ?? "bg-slate-50 text-slate-600"}`}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <div
        className={`font-display text-3xl font-extrabold tracking-tight text-slate-900 ${valueClass}`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  detail,
}: {
  icon: GlyphName;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-subtle">
        <Glyph name={icon} className="h-6 w-6" />
      </span>
      <h4 className="font-display text-sm font-bold text-slate-800">{title}</h4>
      <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function Pill({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "emerald" | "amber" | "rose" | "slate" | "teal";
}) {
  const tones = {
    emerald: "bg-emerald-100 text-emerald-800 border border-emerald-200/50",
    amber: "bg-amber-100 text-amber-800 border border-amber-200/60",
    rose: "bg-rose-100 text-rose-700 border border-rose-200/60",
    slate: "bg-slate-100 text-slate-600 border border-slate-200/70",
    teal: "bg-staff-teal/10 text-staff-teal border border-staff-teal/15",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-all duration-150 focus:border-staff-teal focus:bg-white focus:outline-none focus:ring-2 focus:ring-staff-teal/20";

const primaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-staff-teal px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-staff-pine-hover active:scale-[0.98] cursor-pointer";

const secondaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer";

// ---------------------------------------------------------------------------
// Main staff console
// ---------------------------------------------------------------------------

export interface StaffDashboardProps {
  state: EasyRideState;
  save: (state: EasyRideState) => void;
  saving: boolean;
  currentUser: EasyRideUser | null;
  onSignOut?: () => void;
}

export default function StaffDashboard({
  state,
  save,
  saving,
  currentUser,
  onSignOut,
}: StaffDashboardProps) {
  const [section, setSection] = useState<StaffSection>("dashboard");
  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // A staff account may carry a station id that no longer exists in the fleet
  // configuration. Only pre-filter when it resolves to a real station.
  const assignedStation = useMemo(
    () => state.stations.find((s) => s.id === currentUser?.stationId) ?? null,
    [state.stations, currentUser?.stationId],
  );

  const [returnId, setReturnId] = useState("");
  const [returnCondition, setReturnCondition] = useState<EasyRideBicycle["condition"] | "">("");
  const [returnNotes, setReturnNotes] = useState("");
  const [paymentPaid, setPaymentPaid] = useState(true);
  const [issueBike, setIssueBike] = useState("");
  const [issueText, setIssueText] = useState("");
  const [hourlyRateInput, setHourlyRateInput] = useState(String(state.config.hourlyRate));
  const [currencyInput, setCurrencyInput] = useState(state.config.currency);

  // -------------------------------------------------------------------------
  // Derived fleet figures
  // -------------------------------------------------------------------------

  const activeRentals = state.rentals.filter((r) => r.status === "active");
  const holdRequests = activeRentals.filter(
    (r) => r.returnNotes === "HOLD_PENDING" || r.returnNotes === "HOLD_CONFIRMED",
  );
  const onTripRentals = activeRentals.filter(
    (r) => r.returnNotes !== "HOLD_PENDING" && r.returnNotes !== "HOLD_CONFIRMED",
  );
  const completedRentals = state.rentals.filter((r) => r.status === "completed");
  const pendingPaymentRentals = state.rentals.filter((r) => r.paymentStatus === "pending");
  const availableBikes = state.bicycles.filter(
    (b) => b.status === "available" && b.condition !== "faulty",
  );
  const brokenBikes = state.bicycles.filter(
    (b) => b.condition === "faulty" || b.status === "maintenance",
  );
  const totalRevenue = state.rentals
    .filter((r) => r.paymentStatus === "paid")
    .reduce((sum, r) => sum + r.amount, 0);

  const stationBikes = useMemo(
    () => state.bicycles.filter((b) => !stationFilter || b.stationId === stationFilter),
    [state.bicycles, stationFilter],
  );

  const riders = useMemo(() => {
    const map = new Map<
      string,
      { name: string; trips: number; active: number; spend: number; lastSeen: string }
    >();
    for (const rental of state.rentals) {
      const key = rental.customerName;
      const entry = map.get(key) ?? {
        name: key,
        trips: 0,
        active: 0,
        spend: 0,
        lastSeen: rental.startedAt,
      };
      entry.trips += 1;
      if (rental.status === "active") entry.active += 1;
      if (rental.paymentStatus === "paid") entry.spend += rental.amount;
      if (new Date(rental.startedAt) > new Date(entry.lastSeen)) {
        entry.lastSeen = rental.startedAt;
      }
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.trips - a.trips);
  }, [state.rentals]);

  const recentTransactions = useMemo(
    () =>
      [...state.rentals]
        .sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
        )
        .slice(0, 4),
    [state.rentals],
  );

  const movementEvents = useMemo(
    () =>
      state.activity
        .filter((a) => a.kind === "rental" || a.kind === "return" || a.kind === "station")
        .slice(0, 12),
    [state.activity],
  );

  const addActivity = (activity: EasyRideActivity) =>
    [activity, ...state.activity].slice(0, 100);

  // -------------------------------------------------------------------------
  // Station operations
  // -------------------------------------------------------------------------

  const recordInspection = (bike: EasyRideBicycle) => {
    const nowIso = when();
    const officer = currentUser?.name || "Station worker";
    save({
      ...state,
      bicycles: state.bicycles.map((b) =>
        b.id === bike.id ? { ...b, lastChecked: nowIso } : b,
      ),
      activity: addActivity({
        id: uid(),
        message: `${officer} physically inspected ${bike.code} (${textCase(bike.condition)} condition verified)`,
        createdAt: nowIso,
        kind: "maintenance",
      }),
    });
  };

  const updateBikeCondition = (
    bikeId: string,
    condition: EasyRideBicycle["condition"],
  ) => {
    const isFaulty = condition === "faulty";
    save({
      ...state,
      bicycles: state.bicycles.map((b) =>
        b.id === bikeId
          ? {
              ...b,
              condition,
              status: isFaulty
                ? "maintenance"
                : b.status === "maintenance"
                  ? "available"
                  : b.status,
              lastChecked: when(),
            }
          : b,
      ),
      activity: addActivity({
        id: uid(),
        message: `Bike ${bikeId} condition updated to ${condition} by station worker`,
        createdAt: when(),
        kind: "maintenance",
      }),
    });
  };

  const confirmHoldReady = (rental: EasyRideRental) => {
    save({
      ...state,
      rentals: state.rentals.map((r) =>
        r.id === rental.id ? { ...r, returnNotes: "HOLD_CONFIRMED" } : r,
      ),
      bicycles: state.bicycles.map((b) =>
        b.id === rental.bicycleId ? { ...b, lastChecked: when() } : b,
      ),
      activity: addActivity({
        id: uid(),
        message: `Station worker confirmed ${rental.bicycleCode} is inspected & ready for rider ${rental.customerName}`,
        createdAt: when(),
        kind: "rental",
      }),
    });
  };

  const dispatchBikeToRider = (rental: EasyRideRental) => {
    save({
      ...state,
      rentals: state.rentals.map((r) =>
        r.id === rental.id
          ? { ...r, returnNotes: null, startedAt: when() }
          : r,
      ),
      activity: addActivity({
        id: uid(),
        message: `Station worker issued & handed over ${rental.bicycleCode} to ${rental.customerName} on trip`,
        createdAt: when(),
        kind: "rental",
      }),
    });
  };

  const closeRental = (rental: EasyRideRental) => {
    if (!returnCondition) return;
    const now = new Date();
    const started = new Date(rental.startedAt);
    const duration = Math.max(
      1,
      Math.ceil((now.getTime() - started.getTime()) / 60000),
    );
    const amount = Math.ceil(duration / 60) * state.config.hourlyRate;
    const stationName =
      state.stations.find((s) => s.id === rental.pickupStationId)?.name || "Station";
    const note = returnNotes.trim();
    const isFaulty = returnCondition === "faulty" || note.length > 0;

    const maintenanceRecord: EasyRideMaintenance | null = isFaulty
      ? {
          id: uid(),
          bicycleId: rental.bicycleId,
          bicycleCode: rental.bicycleCode,
          stationName,
          issue: note || "Fault discovered during return inspection",
          reportedAt: now.toISOString(),
          status: "open",
          repairCost: 0,
        }
      : null;

    save({
      ...state,
      rentals: state.rentals.map((r) =>
        r.id === rental.id
          ? {
              ...r,
              status: "completed",
              returnedAt: now.toISOString(),
              durationMinutes: duration,
              amount,
              paymentStatus: paymentPaid ? "paid" : "pending",
              returnCondition,
              returnNotes: note || null,
            }
          : r,
      ),
      bicycles: state.bicycles.map((b) =>
        b.id === rental.bicycleId
          ? {
              ...b,
              status: isFaulty ? "maintenance" : "available",
              condition: isFaulty ? "faulty" : returnCondition,
              lastChecked: now.toISOString(),
            }
          : b,
      ),
      maintenance: maintenanceRecord
        ? [maintenanceRecord, ...state.maintenance]
        : state.maintenance,
      activity: [
        {
          id: uid(),
          message: `Rental closed: ${rental.bicycleCode} checked in by staff · ${money(amount, state.config.currency)} collected (${paymentPaid ? "Paid" : "Pending"})`,
          createdAt: now.toISOString(),
          kind: "return" as const,
        },
        ...(maintenanceRecord
          ? [
              {
                id: uid(),
                message: `⚠️ ${rental.bicycleCode} quarantined to workshop: ${note || "Fault"}`,
                createdAt: now.toISOString(),
                kind: "maintenance" as const,
              },
            ]
          : []),
        ...state.activity,
      ].slice(0, 100),
    });

    setReturnId("");
    setReturnCondition("");
    setReturnNotes("");
  };

  const logFault = () => {
    const bike = state.bicycles.find((b) => b.id === issueBike);
    if (!bike || !issueText.trim()) return;
    const station = state.stations.find((s) => s.id === bike.stationId);

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
      bicycles: state.bicycles.map((b) =>
        b.id === bike.id
          ? { ...b, condition: "faulty", status: "maintenance" }
          : b,
      ),
      maintenance: [record, ...state.maintenance],
      activity: addActivity({
        id: uid(),
        message: `Station worker quarantined ${bike.code} for maintenance: ${issueText.trim()}`,
        createdAt: when(),
        kind: "maintenance",
      }),
    });
    setIssueBike("");
    setIssueText("");
  };

  const resolveRepair = (item: EasyRideMaintenance) => {
    save({
      ...state,
      maintenance: state.maintenance.map((m) =>
        m.id === item.id ? { ...m, status: "resolved" } : m,
      ),
      bicycles: state.bicycles.map((b) =>
        b.id === item.bicycleId
          ? { ...b, status: "available", condition: "good", lastChecked: when() }
          : b,
      ),
      activity: addActivity({
        id: uid(),
        message: `Repair completed: ${item.bicycleCode} inspected, tested and returned to available fleet`,
        createdAt: when(),
        kind: "maintenance",
      }),
    });
  };

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const goTo = (next: StaffSection) => {
    setSection(next);
    setSearch("");
    setDrawerOpen(false);
  };

  const stationSelect = (
    <select
      value={stationFilter}
      onChange={(e) => setStationFilter(e.target.value)}
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs focus:border-staff-teal focus:outline-none focus:ring-2 focus:ring-staff-teal/20 cursor-pointer"
    >
      <option value="">All Stations ({state.stations.length})</option>
      {state.stations.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name} ({s.area})
        </option>
      ))}
    </select>
  );

  // -------------------------------------------------------------------------
  // Dashboard — mirrors the approved staff mockup
  // -------------------------------------------------------------------------

  const renderDashboard = () => {
    const heading = SECTION_TITLES.dashboard;
    const staffName = currentUser?.name || "Station Worker";

    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          detail={heading.detail}
          side={
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm shadow-xs">
              <span className="text-xs font-medium text-slate-500">Logged in as:</span>
              <span className="font-display text-xs font-semibold text-slate-800">
                {staffName}
              </span>
              <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-staff-emerald-dark uppercase">
                Staff
              </span>
            </div>
          }
        />

        {/* Welcome banner */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="pointer-events-none absolute -top-24 -right-16 h-80 w-80 rounded-full bg-staff-teal/5 blur-3xl" />
          <div className="pointer-events-none absolute right-12 bottom-0 h-36 w-36 rounded-full bg-staff-amber/10 blur-2xl" />
          <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="max-w-2xl space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-staff-amber" />
                <span className="font-sans text-xs font-bold tracking-wider text-staff-teal uppercase">
                  {heading.eyebrow}
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                {heading.title}
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                Welcome back,{" "}
                <span className="font-semibold text-slate-800">{staffName}</span>!{" "}
                {heading.detail}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                <svg className="h-4 w-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="4" />
                </svg>
                Live Sync: {saving ? "Saving" : "Active"}
              </span>
            </div>
          </div>
        </section>

        {/* Stat cards */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            dot="bg-emerald-500 ring-4 ring-emerald-50"
            badge="Active"
            badgeClass="bg-emerald-50 text-emerald-600"
            value={String(activeRentals.length)}
            label="Active Rentals"
          />
          <StatCard
            dot="bg-slate-300"
            value={String(availableBikes.length)}
            label="Available Bikes"
          />
          <StatCard
            dot="bg-staff-amber ring-4 ring-staff-amber/10"
            badge={state.config.currency}
            badgeClass="bg-staff-amber/10 text-amber-600"
            value={money(totalRevenue, state.config.currency).replace(
              `${state.config.currency} `,
              "",
            )}
            label="Total Revenue"
            valueClass="text-2xl lg:text-[23px] truncate"
          />
          <StatCard
            dot="bg-amber-400"
            value={String(pendingPaymentRentals.length)}
            label="Pending Payments"
          />
          <StatCard
            dot="bg-staff-teal"
            value={String(state.rentals.length)}
            label="Total Rentals"
          />
          <StatCard
            dot="bg-slate-300"
            value={String(completedRentals.length)}
            label="Completed"
          />
        </section>

        {/* Recent activity */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-staff-teal/10 text-staff-teal">
                <Glyph name="clock" className="h-4 w-4" />
              </div>
              <h3 className="font-display text-base font-bold text-slate-900">
                Recent Activity
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-400">
              Auto-refreshed moments ago
            </span>
          </div>

          {recentTransactions.length ? (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((r) => (
                <div
                  key={r.id}
                  className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-100 text-staff-teal transition-colors duration-150 group-hover:bg-staff-teal group-hover:text-white">
                      <Glyph name="bike" className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-semibold text-slate-900">
                          {r.customerName}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                            r.status === "active"
                              ? "border-emerald-200/50 bg-emerald-100 text-emerald-800"
                              : "border-slate-200/70 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs font-normal text-slate-500">
                        Rented {r.bicycleCode}
                        {r.returnedAt ? ` · returned ${niceDate(r.returnedAt)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-sm font-bold text-slate-900">
                      {money(r.amount, state.config.currency)}
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-slate-400">
                      {clockTime(r.startedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-xs text-slate-400">
              No transactions recorded yet.
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-3.5">
            <span className="text-xs text-slate-500">
              Showing last {recentTransactions.length} transactions
            </span>
            <button
              onClick={() => goTo("receipts")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-staff-teal transition-colors hover:text-staff-pine-hover cursor-pointer"
            >
              View all transactions
              <Glyph name="arrowRight" className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Borrowed bikes — fleet out with riders
  // -------------------------------------------------------------------------

  const renderBorrowed = () => {
    const heading = SECTION_TITLES.borrowed;

    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          detail={heading.detail}
          side={stationSelect}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <StatCard
            dot="bg-emerald-500 ring-4 ring-emerald-50"
            badge="On road"
            badgeClass="bg-emerald-50 text-emerald-600"
            value={String(onTripRentals.length)}
            label="Bikes Out With Riders"
          />
          <StatCard
            dot="bg-staff-amber"
            badge="Pending"
            badgeClass="bg-staff-amber/10 text-amber-600"
            value={String(holdRequests.length)}
            label="Awaiting Handover"
          />
          <StatCard
            dot="bg-staff-teal"
            value={money(
              onTripRentals.reduce((sum, r) => {
                const mins = Math.max(
                  1,
                  Math.ceil(
                    (Date.now() - new Date(r.startedAt).getTime()) / 60000,
                  ),
                );
                return sum + Math.ceil(mins / 60) * state.config.hourlyRate;
              }, 0),
              state.config.currency,
            ).replace(`${state.config.currency} `, "")}
            label="Amount Outstanding"
          />
        </div>

        {onTripRentals.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {onTripRentals.map((r) => {
              const station = state.stations.find((s) => s.id === r.pickupStationId);
              const started = new Date(r.startedAt);
              const elapsedMins = Math.max(
                1,
                Math.ceil((Date.now() - started.getTime()) / 60000),
              );
              const amountDue = Math.ceil(elapsedMins / 60) * state.config.hourlyRate;

              return (
                <Card key={r.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Pill tone="emerald">Out on road</Pill>
                        <b className="font-display text-lg font-extrabold text-slate-900">
                          {r.bicycleCode}
                        </b>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        Rider: <b className="text-slate-800">{r.customerName}</b>
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Picked up at: {station?.name || "Unknown station"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[10px] text-slate-400">TRIP TIME</span>
                      <p className="text-xs font-extrabold text-slate-800">
                        {elapsedMins} mins
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">
                        Amount Due
                      </span>
                      <p className="font-display text-base font-extrabold text-slate-900">
                        {money(amountDue, state.config.currency)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setReturnId(r.id);
                        setReturnCondition("good");
                        setReturnNotes("");
                      }}
                      className={primaryButton}
                    >
                      Take Bike Back &amp; Close
                    </button>
                  </div>

                  {returnId === r.id ? (
                    <div className="mt-4 rounded-xl border border-staff-teal/15 bg-staff-teal/5 p-4">
                      <h5 className="text-xs font-bold text-slate-800">
                        Verify Condition &amp; Close
                      </h5>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <Field label="Condition">
                          <select
                            value={returnCondition}
                            onChange={(e) =>
                              setReturnCondition(
                                e.target.value as EasyRideBicycle["condition"],
                              )
                            }
                            className={inputClass}
                          >
                            {["excellent", "good", "fair", "faulty"].map((c) => (
                              <option key={c} value={c}>
                                {textCase(c)}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Payment Status">
                          <select
                            value={paymentPaid ? "paid" : "pending"}
                            onChange={(e) => setPaymentPaid(e.target.value === "paid")}
                            className={inputClass}
                          >
                            <option value="paid">
                              Paid ({money(amountDue, state.config.currency)})
                            </option>
                            <option value="pending">Pending Collection</option>
                          </select>
                        </Field>
                      </div>

                      <div className="mt-2">
                        <Field label="Staff inspection notes">
                          <input
                            type="text"
                            value={returnNotes}
                            onChange={(e) => setReturnNotes(e.target.value)}
                            placeholder="e.g. Checked tires and brakes, clean"
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button onClick={() => closeRental(r)} className={`${primaryButton} flex-1`}>
                          Close Rental &amp; Record
                        </button>
                        <button onClick={() => setReturnId("")} className={secondaryButton}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="bike"
            title="No bikes are out with riders"
            detail="When a bike is checked out it appears here with its live trip time and the amount due."
          />
        )}
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Manual transactions — inspection + handover
  // -------------------------------------------------------------------------

  const renderTransactions = () => {
    const heading = SECTION_TITLES.transactions;

    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          detail={heading.detail}
          side={stationSelect}
        />

        {/* Hold requests */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-slate-900">
              Rider Hold Requests &amp; Dispatch
            </h3>
            <span className="rounded-full bg-staff-amber/10 px-3 py-1 text-xs font-bold text-amber-700">
              {holdRequests.length} waiting
            </span>
          </div>

          {holdRequests.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {holdRequests.map((r) => {
                const bike = state.bicycles.find((b) => b.id === r.bicycleId);
                const meta = bike ? getBikeMeta(bike) : null;
                const station = state.stations.find((s) => s.id === r.pickupStationId);
                const isConfirmed = r.returnNotes === "HOLD_CONFIRMED";

                return (
                  <Card
                    key={r.id}
                    className="border-l-4 border-l-staff-amber p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <b className="font-display text-lg font-extrabold text-slate-900">
                            {r.bicycleCode}
                          </b>
                          {isConfirmed ? (
                            <Pill tone="emerald">Ready for rider</Pill>
                          ) : (
                            <Pill tone="amber">Pending check</Pill>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          Rider: <b className="text-slate-800">{r.customerName}</b>
                        </p>
                        <p className="text-xs text-slate-500">
                          {meta?.modelName} · {station?.name}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">HOLD</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                      {!isConfirmed ? (
                        <button
                          onClick={() => confirmHoldReady(r)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-staff-amber px-4 py-2.5 text-xs font-bold text-staff-pine shadow-xs transition hover:bg-amber-400 cursor-pointer"
                        >
                          Confirm Bike Ready
                        </button>
                      ) : null}
                      <button
                        onClick={() => dispatchBikeToRider(r)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-staff-teal px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-staff-pine-hover cursor-pointer"
                      >
                        Give Bike &amp; Record Start
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="card"
              title="No pending hold requests"
              detail="When riders ask for a bike to be held, their requests appear here for inspection and confirmation."
            />
          )}
        </section>

        {/* Inspection checklist */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                Station Bike Checklist
              </h3>
              <p className="text-xs text-slate-500">
                Physically verify roadworthiness (brakes, tyres, chain) before handing bikes to riders.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
              {stationBikes.filter((b) => b.status === "available").length} road-ready ·{" "}
              {stationBikes.filter((b) => b.condition === "faulty").length} broken
            </span>
          </div>

          {stationBikes.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stationBikes.map((b) => {
                const meta = getBikeMeta(b);
                const station = state.stations.find((s) => s.id === b.stationId);
                const isBroken = b.condition === "faulty" || b.status === "maintenance";

                return (
                  <div
                    key={b.id}
                    className={`rounded-2xl border p-4 transition ${
                      isBroken
                        ? "border-rose-300 bg-rose-50/50"
                        : "border-slate-200 bg-white shadow-card hover:border-staff-teal/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <b className="font-display text-base font-extrabold text-slate-900">
                            {b.code}
                          </b>
                          <span className="text-xs font-medium text-slate-500">
                            ({b.type})
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700">{meta.modelName}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {station?.name || "Off station"}
                        </p>
                      </div>
                      <Pill
                        tone={
                          isBroken ? "rose" : b.status === "available" ? "emerald" : "amber"
                        }
                      >
                        {isBroken ? "Broken" : textCase(b.status)}
                      </Pill>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <div>
                        <span className="block text-[10px] text-slate-400">CONDITION</span>
                        <select
                          value={b.condition}
                          onChange={(e) =>
                            updateBikeCondition(
                              b.id,
                              e.target.value as EasyRideBicycle["condition"],
                            )
                          }
                          className="mt-0.5 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-staff-teal/20 cursor-pointer"
                        >
                          {["excellent", "good", "fair", "faulty"].map((c) => (
                            <option key={c} value={c}>
                              {textCase(c)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400">CHECKED</span>
                        <span className="text-[11px] font-semibold text-slate-600">
                          {niceDate(b.lastChecked)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => recordInspection(b)}
                      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-staff-teal/20 bg-staff-teal/5 px-3 py-2 text-xs font-bold text-staff-teal transition hover:bg-staff-teal/10 cursor-pointer"
                    >
                      Confirm Good Shape (Check Now)
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="bike"
              title="No bicycles at this station"
              detail="Choose a different station from the filter to see its rack."
            />
          )}
        </section>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Customer management
  // -------------------------------------------------------------------------

  const renderCustomers = () => {
    const heading = SECTION_TITLES.customers;
    const filtered = riders.filter((r) =>
      r.name.toLowerCase().includes(search.trim().toLowerCase()),
    );

    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          detail={heading.detail}
          side={
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search riders..."
              className={`${inputClass} max-w-xs`}
            />
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            dot="bg-staff-teal"
            value={String(riders.length)}
            label="Registered Riders"
          />
          <StatCard
            dot="bg-emerald-500 ring-4 ring-emerald-50"
            value={String(
              riders.filter((r) => r.active > 0).length,
            )}
            label="Riders Currently Riding"
          />
          <StatCard
            dot="bg-staff-amber"
            value={String(state.rentals.length)}
            label="Total Trips"
          />
        </div>

        {filtered.length ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-staff-teal/10 font-display text-sm font-bold text-staff-teal">
                      {initials(r.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-semibold text-slate-900">
                          {r.name}
                        </span>
                        {r.active > 0 ? (
                          <Pill tone="emerald">On a ride</Pill>
                        ) : (
                          <Pill tone="slate">Idle</Pill>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs font-normal text-slate-500">
                        {r.trips} trip{r.trips === 1 ? "" : "s"} · last seen {niceDate(r.lastSeen)}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-sm font-bold text-slate-900">
                      {money(r.spend, state.config.currency)}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400">lifetime spend</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon="users"
            title="No riders found"
            detail="Riders appear here as soon as they start a rental."
          />
        )}
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Maintenance
  // -------------------------------------------------------------------------

  const renderMaintenance = () => {
    const heading = SECTION_TITLES.maintenance;

    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          detail={heading.detail}
          side={stationSelect}
        />

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-600 font-bold text-white">
              <Glyph name="cog" className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-rose-950">
                Quarantine Protocol: Keep Broken Bikes Out of Use
              </h4>
              <p className="text-xs text-rose-800">
                Faulty bicycles are locked from customer view and cannot be rented or held until
                fixed and re-inspected.
              </p>
            </div>
          </div>
          <span className="rounded-xl border border-rose-200 bg-white px-3 py-1 text-sm font-extrabold text-rose-800">
            {brokenBikes.length} in quarantine
          </span>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_.9fr]">
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900">
              Workshop Log ({state.maintenance.filter((m) => m.status !== "resolved").length}{" "}
              Open)
            </h4>
            {state.maintenance.length ? (
              state.maintenance.map((m) => {
                const isResolved = m.status === "resolved";
                return (
                  <Card
                    key={m.id}
                    className={`p-4 ${isResolved ? "bg-slate-50 opacity-60" : "border-rose-200"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <b className="font-display text-sm font-extrabold text-slate-900">
                            {m.bicycleCode}
                          </b>
                          <Pill
                            tone={
                              isResolved ? "emerald" : m.status === "in_progress" ? "amber" : "rose"
                            }
                          >
                            {textCase(m.status)}
                          </Pill>
                        </div>
                        <p className="mt-1.5 text-xs font-medium text-slate-700">{m.issue}</p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {m.stationName} · reported {niceDate(m.reportedAt)}
                        </p>
                      </div>

                      {!isResolved ? (
                        <button
                          onClick={() => resolveRepair(m)}
                          className="shrink-0 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 cursor-pointer"
                        >
                          Mark Fixed &amp; Check
                        </button>
                      ) : null}
                    </div>
                  </Card>
                );
              })
            ) : (
              <p className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-400 shadow-card">
                No maintenance records logged.
              </p>
            )}
          </div>

          <Card className="h-fit p-5">
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Glyph name="cog" className="h-4 w-4 text-staff-teal" /> Record Problem with a Bike
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Instantly marks the bike faulty and locks it from rider booking.
            </p>

            <div className="mt-4">
              <Field label="Bicycle to quarantine">
                <select
                  value={issueBike}
                  onChange={(e) => setIssueBike(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select bicycle</option>
                  {state.bicycles.map((b) => {
                    const meta = getBikeMeta(b);
                    return (
                      <option key={b.id} value={b.id}>
                        {b.code} · {meta.modelName} ({b.type})
                      </option>
                    );
                  })}
                </select>
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Problem details">
                <textarea
                  value={issueText}
                  onChange={(e) => setIssueText(e.target.value)}
                  placeholder="Describe damage or faults observed..."
                  className={`${inputClass} min-h-[80px] resize-y`}
                />
              </Field>
            </div>

            <button
              disabled={!issueBike || !issueText.trim()}
              onClick={logFault}
              className={`${primaryButton} mt-4 w-full disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Quarantine Bike for Repair
            </button>
          </Card>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Bike movement
  // -------------------------------------------------------------------------

  const renderMovement = () => {
    const heading = SECTION_TITLES.movement;

    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          detail={heading.detail}
          side={stationSelect}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            dot="bg-emerald-500 ring-4 ring-emerald-50"
            value={String(availableBikes.length)}
            label="Docked At Stations"
          />
          <StatCard
            dot="bg-staff-amber"
            value={String(activeRentals.length)}
            label="Out On The Road"
          />
          <StatCard
            dot="bg-rose-500"
            value={String(brokenBikes.length)}
            label="Held In Workshop"
          />
        </div>

        <Card className="overflow-hidden">
          <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">
                Fleet Position
              </h3>
              <p className="text-xs text-slate-500">
                Availability is the last recorded status, not live tracking.
              </p>
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bike code..."
              className={`${inputClass} max-w-xs`}
            />
          </div>

          <div className="divide-y divide-slate-100">
            {stationBikes
              .filter((b) =>
                `${b.code} ${b.type}`.toLowerCase().includes(search.trim().toLowerCase()),
              )
              .map((b) => {
                const station = state.stations.find((s) => s.id === b.stationId);
                const tone =
                  b.status === "available"
                    ? "emerald"
                    : b.status === "rented"
                      ? "amber"
                      : "rose";
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-100 text-staff-teal">
                        <Glyph name="bike" className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-semibold text-slate-900">
                            {b.code}
                          </span>
                          <Pill tone={tone}>{textCase(b.status)}</Pill>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-normal text-slate-500">
                          {b.type} · {station?.name || "Off station"} · condition{" "}
                          {textCase(b.condition)}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-[11px] text-slate-500">
                        {niceDate(b.lastChecked)}
                      </div>
                      <div className="mt-0.5 text-[10px] uppercase text-slate-400">
                        last checked
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-display text-base font-bold text-slate-900">
              Movement Log
            </h3>
            <p className="text-xs text-slate-500">
              Handoffs, returns and station events recorded by staff.
            </p>
          </div>
          {movementEvents.length ? (
            <div className="divide-y divide-slate-100">
              {movementEvents.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-staff-teal">
                      <Glyph name="arrows" className="h-4 w-4" />
                    </div>
                    <p className="min-w-0 text-xs leading-5 text-slate-700">{a.message}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-slate-400">
                    {clockTime(a.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-xs text-slate-400">
              No movement recorded yet.
            </div>
          )}
        </Card>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Receipts
  // -------------------------------------------------------------------------

  const renderReceipts = () => {
    const heading = SECTION_TITLES.receipts;
    const filtered = state.rentals.filter((r) =>
      `${r.customerName} ${r.bicycleCode}`.toLowerCase().includes(search.trim().toLowerCase()),
    );

    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          detail={heading.detail}
          side={
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter rider or bike..."
              className={`${inputClass} max-w-xs`}
            />
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            dot="bg-emerald-500 ring-4 ring-emerald-50"
            badge="Collected"
            badgeClass="bg-emerald-50 text-emerald-600"
            value={money(totalRevenue, state.config.currency).replace(
              `${state.config.currency} `,
              "",
            )}
            label="Total Collected"
          />
          <StatCard
            dot="bg-amber-400"
            value={String(pendingPaymentRentals.length)}
            label="Pending Collection"
          />
          <StatCard
            dot="bg-staff-teal"
            value={String(state.rentals.length)}
            label="Receipts Issued"
          />
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                  <th className="px-6 py-3">Rider / Bike</th>
                  <th className="px-3 py-3">Pickup Station</th>
                  <th className="px-3 py-3">Started</th>
                  <th className="px-3 py-3">Duration</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-6 py-3">
                      <b className="text-slate-900">{r.customerName}</b>
                      <p className="text-[11px] text-slate-400">{r.bicycleCode}</p>
                    </td>
                    <td className="px-3 py-3">
                      {state.stations.find((s) => s.id === r.pickupStationId)?.name || "—"}
                    </td>
                    <td className="px-3 py-3 text-[11px]">{niceDate(r.startedAt)}</td>
                    <td className="px-3 py-3">
                      {r.durationMinutes != null ? `${r.durationMinutes} min` : "On trip"}
                    </td>
                    <td className="px-3 py-3 font-extrabold text-slate-900">
                      {money(r.amount, state.config.currency)}
                    </td>
                    <td className="px-3 py-3">
                      <Pill tone={r.status === "completed" ? "slate" : "emerald"}>
                        {textCase(r.status)}
                      </Pill>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Pill tone={r.paymentStatus === "paid" ? "emerald" : "amber"}>
                        {textCase(r.paymentStatus)}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 text-xs">
            <span className="font-medium text-slate-500">
              Total Collected:{" "}
              <b className="font-display text-sm font-extrabold text-slate-900">
                {money(totalRevenue, state.config.currency)}
              </b>
            </span>
            <span className="text-slate-400">Records stored locally in browser state</span>
          </div>
        </Card>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Settings
  // -------------------------------------------------------------------------

  const renderSettings = () => {
    const heading = SECTION_TITLES.settings;

    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          detail={heading.detail}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h4 className="text-sm font-bold text-slate-900">Service &amp; Rate Settings</h4>
            <p className="mt-1 text-xs text-slate-500">
              Configure pricing shown to riders upfront.
            </p>

            <div className="mt-4">
              <Field label={`Hourly Rate (${state.config.currency})`}>
                <input
                  type="number"
                  value={hourlyRateInput}
                  onChange={(e) => setHourlyRateInput(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Currency">
                <input
                  type="text"
                  value={currencyInput}
                  onChange={(e) => setCurrencyInput(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

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
              className={`${primaryButton} mt-4`}
            >
              Save Pricing Settings
            </button>
          </Card>

          <Card className="p-6">
            <h4 className="text-sm font-bold text-slate-900">
              Active Pickup Points ({state.stations.length})
            </h4>
            <div className="mt-3 space-y-2">
              {state.stations.map((st: EasyRideStation) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
                >
                  <div>
                    <b>{st.name}</b>
                    <p className="text-[11px] text-slate-400">
                      {st.area} · {st.landmark}
                    </p>
                  </div>
                  <Pill tone={st.active ? "emerald" : "slate"}>
                    {st.active ? "Open" : "Paused"}
                  </Pill>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 md:col-span-2">
            <h4 className="text-sm font-bold text-slate-900">Your Station Assignment</h4>
            <p className="mt-1 text-xs text-slate-500">
              Which pickup point this account is responsible for.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Officer
                </span>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {currentUser?.name || "—"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Assigned Station
                </span>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {assignedStation?.name || "All stations"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Account
                </span>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                  {currentUser?.email || "—"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Reports
  // -------------------------------------------------------------------------

  const renderReports = () => {
    const heading = SECTION_TITLES.reports;

    const stationRows = state.stations.map((st) => {
      const bikes = state.bicycles.filter((b) => b.stationId === st.id);
      const rentals = state.rentals.filter((r) => r.pickupStationId === st.id);
      const revenue = rentals
        .filter((r) => r.paymentStatus === "paid")
        .reduce((sum, r) => sum + r.amount, 0);
      return {
        station: st,
        total: bikes.length,
        available: bikes.filter(
          (b) => b.status === "available" && b.condition !== "faulty",
        ).length,
        rentals: rentals.length,
        revenue,
      };
    });

    const busiest = [...state.bicycles]
      .map((b) => ({
        bike: b,
        trips: state.rentals.filter((r) => r.bicycleId === b.id).length,
      }))
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 5);

    const utilisation = state.bicycles.length
      ? Math.round((availableBikes.length / state.bicycles.length) * 100)
      : 0;

    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          detail={heading.detail}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            dot="bg-emerald-500 ring-4 ring-emerald-50"
            value={`${utilisation}%`}
            label="Fleet Utilisation"
          />
          <StatCard
            dot="bg-staff-amber"
            value={String(state.rentals.length)}
            label="Trips Recorded"
          />
          <StatCard
            dot="bg-staff-teal"
            value={money(
              state.rentals.length ? totalRevenue / state.rentals.length : 0,
              state.config.currency,
            ).replace(`${state.config.currency} `, "")}
            label="Average Trip Value"
          />
          <StatCard
            dot="bg-rose-500"
            value={String(
              state.maintenance.filter((m) => m.status !== "resolved").length,
            )}
            label="Open Repairs"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="font-display text-base font-bold text-slate-900">
                Station Performance
              </h3>
              <p className="text-xs text-slate-500">Revenue and load per pickup point.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {stationRows.map((row) => (
                <div
                  key={row.station.id}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80"
                >
                  <div className="min-w-0">
                    <span className="font-display text-sm font-semibold text-slate-900">
                      {row.station.name}
                    </span>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {row.station.area} · {row.available}/{row.total} available · {row.rentals}{" "}
                      trips
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-sm font-bold text-slate-900">
                      {money(row.revenue, state.config.currency)}
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase text-slate-400">revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="font-display text-base font-bold text-slate-900">
                Most Used Bicycles
              </h3>
              <p className="text-xs text-slate-500">Ranked by completed and active trips.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {busiest.map((entry) => {
                const station = state.stations.find((s) => s.id === entry.bike.stationId);
                return (
                  <div
                    key={entry.bike.id}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-staff-teal">
                        <Glyph name="bike" className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <span className="font-display text-sm font-semibold text-slate-900">
                          {entry.bike.code}
                        </span>
                        <p className="truncate text-[11px] text-slate-500">
                          {entry.bike.type} · {station?.name || "Off station"}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                      {entry.trips} trips
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Shell
  // -------------------------------------------------------------------------

  const renderSection = () => {
    switch (section) {
      case "borrowed":
        return renderBorrowed();
      case "transactions":
        return renderTransactions();
      case "customers":
        return renderCustomers();
      case "maintenance":
        return renderMaintenance();
      case "movement":
        return renderMovement();
      case "receipts":
        return renderReceipts();
      case "settings":
        return renderSettings();
      case "reports":
        return renderReports();
      default:
        return renderDashboard();
    }
  };

  const staffName = currentUser?.name || "Station Worker";
  const staffInitials = initials(staffName);

  const sidebar = (
    <>
      <div className="flex flex-col h-full overflow-y-auto px-5 py-6 space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-staff-teal text-white shadow-sm ring-1 ring-emerald-400/20">
            <Glyph name="bike" className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-xl font-extrabold leading-none tracking-tight text-slate-900">
                Easy<span className="font-black text-staff-teal">Ride</span>
              </span>
            </div>
            <span className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
              Management System
            </span>
          </div>
        </div>

        {/* Current user card */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-staff-teal/15 bg-staff-teal/10 font-display text-sm font-bold text-staff-teal shadow-xs">
            {staffInitials}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-display text-sm font-semibold leading-tight text-slate-900">
              {staffName}
            </h4>
            <div className="mt-1 flex items-center">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-staff-emerald-dark uppercase">
                Staff
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-1">
          <div className="px-2 mb-2">
            <span className="font-sans text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">
              Main Navigation
            </span>
          </div>
          <nav aria-label="Sidebar" className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => goTo(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={`group flex w-full items-start gap-3.5 rounded-xl px-3.5 py-2.5 text-left transition-all duration-150 cursor-pointer ${
                    active
                      ? "bg-staff-teal text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                  }`}
                >
                  <Glyph
                    name={item.icon}
                    className={`mt-0.5 h-5 w-5 shrink-0 transition-colors ${
                      active
                        ? "text-white/90"
                        : "text-slate-400 group-hover:text-staff-teal"
                    }`}
                  />
                  <span className="flex flex-col">
                    <span
                      className={`font-display text-sm ${
                        active
                          ? "font-semibold tracking-wide text-white"
                          : "font-medium text-slate-700 group-hover:text-slate-900"
                      }`}
                    >
                      {item.title}
                    </span>
                    <span
                      className={`text-[11px] font-normal ${
                        active ? "text-white/70" : "text-slate-400 group-hover:text-slate-500"
                      }`}
                    >
                      {item.subtitle}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar footer */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          {assignedStation?.name || "Main Hub"} · Makerere
        </span>
        <span className="font-mono text-[10px]">v2.4</span>
      </div>
    </>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-staff-surface text-slate-800">
      {/* Desktop sidebar */}
      <aside className="z-30 hidden w-72 flex-shrink-0 select-none flex-col justify-between border-r border-slate-200/90 bg-white lg:flex">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative z-10 flex w-72 flex-shrink-0 flex-col justify-between border-r border-slate-200/90 bg-white">
            {sidebar}
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Top header */}
        <header className="sticky top-0 z-20 flex h-18 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 py-3.5 backdrop-blur sm:px-8">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 lg:hidden cursor-pointer"
          >
            <Glyph name="menu" className="h-5 w-5" />
          </button>

          <div className="relative min-w-0 flex-1 max-w-lg">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Glyph name="search" className="h-4 w-4" />
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bikes, models, locations..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-10 text-sm transition-all duration-150 placeholder-slate-400 focus:border-staff-teal focus:bg-white focus:outline-none focus:ring-2 focus:ring-staff-teal/20"
            />
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              aria-label="Notifications"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-staff-teal cursor-pointer"
            >
              <Glyph name="bell" className="h-5 w-5" />
              {pendingPaymentRentals.length ? (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
              ) : null}
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-1.5 pl-2.5 transition-colors hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-staff-teal text-xs font-semibold text-white">
                  {staffInitials}
                </span>
                <Glyph name="chevron" className="mr-1 h-4 w-4 text-slate-400" />
              </button>

              {userMenuOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card-hover">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-slate-900">{staffName}</p>
                      <p className="truncate text-[11px] text-slate-400">
                        {currentUser?.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onSignOut?.();
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="w-full max-w-[1400px] flex-1 space-y-6 p-5 sm:p-8">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
