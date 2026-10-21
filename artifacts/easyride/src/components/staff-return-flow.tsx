/**
 * Staff check-in flow.
 *
 * Opened from "Return Bike" on the borrowed fleet list. It walks the station
 * worker through a three step hand-back:
 *
 *   1. Check Bike Condition — frame, brakes and tyres
 *   2. Park & Assign — where the bike is docked and what happens to it next
 *   3. Receipt & Finish — money due and the rider receipt
 *
 * The findings are handed back to the staff console, which closes the hire
 * and (when something is wrong) quarantines the bicycle.
 */

import { useMemo, useState } from "react";
import type { EasyRideBicycle } from "@workspace/api-client-react";
import { initials, money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { buildReceiptPdf, downloadTextFile } from "@/lib/receipt-pdf";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

/* ------------------------------------------------------------------------- */
/* Icons                                                                      */
/* ------------------------------------------------------------------------- */

type IconName =
  | "clipboard"
  | "note"
  | "checkCircle"
  | "bike"
  | "pin"
  | "badge"
  | "clock"
  | "refresh"
  | "timer"
  | "info"
  | "arrow"
  | "arrowBack"
  | "save"
  | "phone"
  | "store"
  | "parking"
  | "rule"
  | "taskAlt"
  | "battery"
  | "receipt"
  | "chevronRight"
  | "close"
  | "print"
  | "download"
  | "person"
  | "verified";

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const base = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    className,
    "aria-hidden": true,
  };

  switch (name) {
    case "clipboard":
      return (
        <svg {...base}>
          <path d="M9 4h6v3H9z" />
          <path d="M15 5h2a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h2" />
          <path d="M9 13l2 2 4-4" />
        </svg>
      );
    case "note":
      return (
        <svg {...base}>
          <path d="M4 20h16" />
          <path d="M14 3v5h5" />
          <path d="M14 3H6a2 2 0 00-2 2v13a2 2 0 002 2h6" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      );
    case "checkCircle":
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5l2.5 2.5L16 9.5" />
        </svg>
      );
    case "bike":
      return (
        <svg {...base}>
          <circle cx="5.5" cy="17.5" r="3.5" />
          <circle cx="18.5" cy="17.5" r="3.5" />
          <path d="M15 17.5V11l-3-4H9l-2 6" />
          <path d="M12 17.5V13h3.5" />
          <path d="M8 8h3" />
        </svg>
      );
    case "pin":
      return (
        <svg {...base}>
          <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "badge":
      return (
        <svg {...base}>
          <path d="M12 3l2.2 1.7 2.8-.2.7 2.7 2.3 1.6-1 2.6 1 2.6-2.3 1.6-.7 2.7-2.8-.2L12 21l-2.2-1.7-2.8.2-.7-2.7L4 15.2l1-2.6-1-2.6 2.3-1.6.7-2.7 2.8.2z" />
          <path d="M9.5 12l1.8 1.8 3.4-3.6" />
        </svg>
      );
    case "clock":
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...base}>
          <path d="M20 11a8 8 0 10-2.3 6.1" />
          <path d="M20 5v6h-6" />
        </svg>
      );
    case "timer":
      return (
        <svg {...base}>
          <path d="M10 2h4" />
          <path d="M12 6a8 8 0 108 8" />
          <path d="M12 11v3" />
        </svg>
      );
    case "info":
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...base}>
          <path d="M4 12h15" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      );
    case "arrowBack":
      return (
        <svg {...base}>
          <path d="M20 12H5" />
          <path d="M11 18l-6-6 6-6" />
        </svg>
      );
    case "save":
      return (
        <svg {...base}>
          <path d="M5 3h11l3 3v15H5z" />
          <path d="M8 3v6h8V3" />
          <path d="M8 15h8v6H8z" />
        </svg>
      );
    case "phone":
      return (
        <svg {...base}>
          <path d="M5 4h4l2 5-2.5 1.5a12 12 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z" />
        </svg>
      );
    case "store":
      return (
        <svg {...base}>
          <path d="M4 9l1.5-5h13L20 9" />
          <path d="M4 9h16v11H4z" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
    case "parking":
      return (
        <svg {...base}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M9 17V7h4a3 3 0 010 6H9" />
        </svg>
      );
    case "rule":
      return (
        <svg {...base}>
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      );
    case "taskAlt":
      return (
        <svg {...base}>
          <path d="M4 7l2 2 3-3" />
          <path d="M4 13l2 2 3-3" />
          <path d="M4 19l2 2 3-3" />
          <path d="M12 7h8M12 13h8M12 19h8" />
        </svg>
      );
    case "battery":
      return (
        <svg {...base}>
          <rect x="2" y="7" width="17" height="10" rx="2" />
          <path d="M22 11v2" />
          <path d="M5 10v4M8 10v4" />
        </svg>
      );
    case "receipt":
      return (
        <svg {...base}>
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
          <path d="M9 8h6M9 12h6" />
        </svg>
      );
    case "chevronRight":
      return (
        <svg {...base}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      );
    case "close":
      return (
        <svg {...base}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "print":
      return (
        <svg {...base}>
          <path d="M6 9V3h12v6" />
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
          <path d="M6 14h12v7H6z" />
        </svg>
      );
    case "download":
      return (
        <svg {...base}>
          <path d="M12 3v12" />
          <path d="M7 11l5 5 5-5" />
          <path d="M4 21h16" />
        </svg>
      );
    case "person":
      return (
        <svg {...base}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0114 0" />
        </svg>
      );
    case "verified":
      return (
        <svg {...base}>
          <path d="M12 3l2.2 1.7 2.8-.2.7 2.7 2.3 1.6-1 2.6 1 2.6-2.3 1.6-.7 2.7-2.8-.2L12 21l-2.2-1.7-2.8.2-.7-2.7L4 15.2l1-2.6-1-2.6 2.3-1.6.7-2.7 2.8.2z" />
          <path d="M9.5 12l1.8 1.8 3.4-3.6" />
        </svg>
      );
  }
}

/* ------------------------------------------------------------------------- */
/* Inspection model                                                           */
/* ------------------------------------------------------------------------- */

type CheckpointKey = "frame" | "brakes" | "tires";

interface CheckpointOption {
  value: string;
  label: string;
  /** "pass" clears the checkpoint, "minor" is a note, "fault" quarantines. */
  severity: "pass" | "minor" | "fault";
}

interface Checkpoint {
  key: CheckpointKey;
  title: string;
  hint: string;
  options: CheckpointOption[];
}

const CHECKPOINTS: Checkpoint[] = [
  {
    key: "frame",
    title: "Bike Body & Frame",
    hint: "Check top tube, down tube, forks, kickstand, and saddle post integrity.",
    options: [
      { value: "good", label: "Good (Pass)", severity: "pass" },
      { value: "scratch", label: "Minor Scratch", severity: "minor" },
      { value: "damaged", label: "Damaged / Bent", severity: "fault" },
    ],
  },
  {
    key: "brakes",
    title: "Brakes & Gears",
    hint: "Test front & rear hydraulic levers, cassette shifting smoothness, and chain tension.",
    options: [
      { value: "good", label: "Working Well", severity: "pass" },
      { value: "tuning", label: "Needs Tuning", severity: "minor" },
      { value: "broken", label: "Broken / Defective", severity: "fault" },
    ],
  },
  {
    key: "tires",
    title: "Tires & Air Pressure",
    hint: "Inspect 29-inch knobby tread depth, sidewalls for tears, and check PSI levels.",
    options: [
      { value: "good", label: "Good", severity: "pass" },
      { value: "low_pressure", label: "Low Pressure", severity: "minor" },
      { value: "punctured", label: "Flat / Punctured", severity: "fault" },
    ],
  },
];

/** Standard hire window (4 hours) used to flag a late return. */
const BORROW_WINDOW_MINUTES = 240;

/** Parking bays offered at the station. */
const PARKING_SPOTS = [  { id: "SPOT-01", number: "01", clamp: "01A" },
  { id: "SPOT-02", number: "02", clamp: "02A" },
  { id: "SPOT-03", number: "03", clamp: "03A" },
  { id: "SPOT-04", number: "04", clamp: "04A" },
  { id: "SPOT-05", number: "05", clamp: "05A" },
  { id: "SPOT-06", number: "06", clamp: "06A" },
];

/** What happens to the bicycle once it is parked. */
const DISPOSITIONS = [
  {
    id: "ready" as const,
    title: "Ready for Next Customer",
    badge: "Immediate Avail",
    detail:
      "Put back so someone else can rent it right away. Bike condition verified clean, tires inflated to 38 PSI, and battery charged.",
  },
  {
    id: "maintenance" as const,
    title: "Needs Repair / Mechanic Service",
    badge: "Hold Fleet",
    detail:
      "Lock away for mechanic to check and fix. Automatically marks bay as out-of-rotation and tickets maintenance log.",
  },
];

/* ------------------------------------------------------------------------- */
/* Component                                                                  */
/* ------------------------------------------------------------------------- */

export interface ReturnFlowOutcome {
  condition: EasyRideBicycle["condition"];
  notes: string;
  paymentPaid: boolean;
  /** "ready" returns the bike to the fleet, "maintenance" quarantines it. */
  disposition: "ready" | "maintenance";
  parkingSpot: string;
}

export interface StaffReturnFlowProps {
  rentalId: string;
  bikeCode: string;
  modelName: string;
  image: string;
  category: string;
  riderName: string;
  riderPhone: string;
  stationName: string;
  stationLandmark?: string;
  startedAt: string;
  rate: number;
  amountDue: number;
  currency: string;
  staffName: string;
  flowId: string;
  /** Bays in use at the station, e.g. 12 of 16. */
  baysUsed: number;
  baysTotal: number;
  /** Short spec line for the bike (battery health, size, gearing...). */
  bikeSpec: string;
  /** Leave the flow without touching the hire. */
  onExit: () => void;
  /** Hand the findings back so the console can close the hire. */
  onComplete: (outcome: ReturnFlowOutcome) => void;
}

export default function StaffReturnFlow({
  rentalId,
  bikeCode,
  modelName,
  image,
  category,
  riderName,
  riderPhone,
  stationName,
  stationLandmark,
  startedAt,
  rate,
  amountDue,
  currency,
  staffName,
  flowId,
  baysUsed,
  baysTotal,
  bikeSpec,
  onExit,
  onComplete,
}: StaffReturnFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  // Nothing is preselected — the station worker has to record an outcome
  // for every checkpoint.
  const [answers, setAnswers] = useState<Record<CheckpointKey, string | null>>({
    frame: null,
    brakes: null,
    tires: null,
  });
  const [notes, setNotes] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const [spot, setSpot] = useState<string | null>(null);
  const [disposition, setDisposition] = useState<"ready" | "maintenance" | null>(
    null,
  );
  const [paymentPaid, setPaymentPaid] = useState(true);
  const [sendReceipt, setSendReceipt] = useState(true);
  const [markReady, setMarkReady] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState(false);

  const started = new Date(startedAt);
  const now = new Date();
  const elapsedMinutes = Math.max(
    1,
    Math.ceil((now.getTime() - started.getTime()) / 60_000),
  );
  const durationLabel = `${String(Math.floor(elapsedMinutes / 60)).padStart(
    2,
    "0",
  )}h ${String(elapsedMinutes % 60).padStart(2, "0")}m`;
  const timeOf = (value: Date) =>
    value.toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" });

  /** Checkpoints the worker flagged, with the label they picked. */
  const findings = useMemo(
    () =>
      CHECKPOINTS.map((checkpoint) => {
        const picked = checkpoint.options.find(
          (option) => option.value === answers[checkpoint.key],
        );
        return {
          checkpoint,
          option: picked ?? null,
        };
      }),
    [answers],
  );

  const answered = findings.filter((f) => f.option !== null);
  const checkedCount = answered.length;
  const allAnswered = checkedCount === CHECKPOINTS.length;
  const faults = answered.filter((f) => f.option?.severity === "fault");
  const minors = answered.filter((f) => f.option?.severity === "minor");
  const allClear = allAnswered && faults.length === 0 && minors.length === 0;

  const activeSpot = PARKING_SPOTS.find((s) => s.id === spot) ?? null;
  const parkingReady = Boolean(activeSpot);
  const stepTwoReady = parkingReady && disposition !== null;

  /** The bicycle condition the findings translate into. */
  const condition: EasyRideBicycle["condition"] =
    faults.length || disposition === "maintenance"
      ? "faulty"
      : minors.length
        ? "fair"
        : "excellent";

  /** Notes recorded on the hire: the staff comment plus the findings. */
  const notesForHire = useMemo(() => {
    const flagged = answered
      .filter((f) => f.option && f.option.severity !== "pass")
      .map((f) => `${f.checkpoint.title}: ${f.option?.label}`);
    const comment = notes.trim();
    return [...flagged, ...(comment ? [comment] : [])].join(" · ");
  }, [answered, notes]);

  const steps = [
    {
      id: 1,
      title: "Check Bike Condition",
      subtitle: "Check passed & recorded",
      pageTitle: "Check Bike Condition",
    },
    {
      id: 2,
      title: "Park & Assign",
      subtitle: "Choose parking spot",
      pageTitle: "Park Bike & Set Status",
    },
    {
      id: 3,
      title: "Receipt & Finish",
      subtitle: "Send receipt & complete",
      pageTitle: "Finish Return & Give Receipt",
    },
  ];

  const finish = () => {
    onComplete({
      condition,
      notes: notesForHire,
      paymentPaid,
      disposition: disposition ?? "ready",
      parkingSpot: activeSpot?.id ?? "",
    });
  };

  /** Mirrors the "finalising" micro-interaction before the hire is closed. */
  const completeReturn = () => {
    if (finishing || finished) return;
    setFinishing(true);
    window.setTimeout(() => {
      setFinishing(false);
      setFinished(true);
      window.setTimeout(finish, 1100);
    }, 900);
  };

  /** Receipt metadata shared by the on-screen card and the PDF download. */
  const receiptNumber = `REC-${new Date().getFullYear()}-${(
    rentalId.match(/\d+/g)?.join("").slice(-4) || "0000"
  )}`;
  const receiptCode = `ER-TX-${(rentalId.match(/\d+/g)?.join("").slice(-5) || "00000")}`;
  const withinGrace = elapsedMinutes <= BORROW_WINDOW_MINUTES;
  const receiptRows: { label: string; value: string }[] = [
    {
      label: "Date & Time",
      value: `${now.toLocaleDateString("en-UG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}, ${timeOf(now)}`,
    },
    { label: "Customer Name", value: riderName },
    { label: "Bike Model", value: modelName || category },
    { label: "Assigned Spot", value: `Spot #${activeSpot?.number ?? "--"}` },
    {
      label: "Rental Duration",
      value: `${Math.floor(elapsedMinutes / 60)} hr ${elapsedMinutes % 60} mins (${
        withinGrace ? "Within Grace" : "Over Grace"
      })`,
    },
    { label: "Receiving Officer", value: `${staffName} (Staff)` },
    { label: "Total Paid", value: money(amountDue, currency) },
    { label: "Extra Fee", value: money(0, currency) },
  ];

  const handleDownloadReceipt = () => {
    downloadTextFile(
      `easyride-receipt-${receiptNumber}.pdf`,
      buildReceiptPdf("EasyRide - Bike Return Receipt", receiptRows),
      "application/pdf",
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb & session bar */}
      <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500"
        >
          <button
            type="button"
            onClick={onExit}
            className="cursor-pointer transition-colors hover:text-staff-pine"
          >
            Borrowed Bikes
          </button>
          <span className="font-medium text-slate-300">/</span>
          <span className="cursor-pointer transition-colors hover:text-staff-pine">
            Return &amp; Check-in
          </span>
          <span className="font-medium text-slate-300">/</span>
          <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-staff-pine">
            #{bikeCode}
          </span>
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Staff Session:
            </span>
            <span className="text-xs font-bold text-staff-pine">{staffName}</span>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-card transition-all hover:bg-slate-50"
          >
            <Icon name="close" className="h-4 w-4 text-slate-400" />
            Exit Flow
          </button>
        </div>
      </div>

      {/* Elevated 3-step return stepper */}
      <section
        aria-label="Progress stepper"
        className="rounded-xl bg-white px-6 py-4 shadow-card"
      >
        <div className="relative grid grid-cols-1 items-center gap-4 md:grid-cols-3">
          {steps.map((item) => {
            const active = item.id === step;
            const done = item.id < step;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3",
                  active && "rounded-lg bg-slate-50 p-3",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm",
                    active
                      ? "bg-staff-pine text-emerald-200"
                      : done
                        ? "bg-staff-teal text-emerald-200"
                        : "bg-slate-200 text-slate-500",
                  )}
                >
                  {done ? (
                    <Icon name="checkCircle" className="h-[22px] w-[22px]" />
                  ) : (
                    <span className="text-xl font-bold leading-none">
                      {item.id}
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-bold text-staff-pine">
                    Step {item.id}: {item.title}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1 truncate text-xs font-medium",
                      done ? "text-emerald-700" : "text-slate-500",
                    )}
                  >
                    {done ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        {item.id === 2 && activeSpot
                          ? `Parked at Spot #${activeSpot.number}`
                          : "Check passed & recorded"}
                      </>
                    ) : (
                      item.subtitle
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Page header & badges */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-staff-pine px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                #{bikeCode}
              </span>
              <span className="rounded-md bg-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-staff-pine">
                {modelName || category}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                {step === 1 ? "Live check-in" : "Return in progress"}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-staff-pine lg:text-3xl">
              Step {step}: {steps[step - 1].pageTitle}
            </h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="font-semibold text-staff-pine">
                Staff: {staffName}
              </span>
              <span>•</span>
              <span>
                Station:{" "}
                <strong className="text-slate-700">{stationName}</strong>
              </span>
            </p>
          </div>

          {step === 2 ? (
            <span
              className={cn(
                "inline-flex items-center gap-2 self-start rounded-full px-3.5 py-2 text-xs font-bold shadow-sm lg:self-center",
                allClear ? "bg-white text-emerald-700" : "bg-amber-50 text-amber-700",
              )}
            >
              <Icon name="checkCircle" className="h-5 w-5" />
              {allClear ? "Bike check passed" : "Check flagged issues"}
            </span>
          ) : step === 1 ? (
            <div className="inline-flex items-center gap-2.5 self-start rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 lg:self-center">
              <Icon name="badge" className="h-5 w-5 text-emerald-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-500">FLOW ID</span>
                <span className="text-xs font-bold text-staff-pine">{flowId}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Live success banner */}
        {step === 3 ? (
          <div className="flex items-center justify-between gap-4 rounded-xl bg-emerald-100/50 px-4 py-3 text-emerald-900">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Icon name="checkCircle" className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-staff-pine">
                Bike successfully secured at{" "}
                <strong className="font-bold">
                  Parking Spot #{activeSpot?.number ?? "--"}
                </strong>{" "}
                &amp; telemetry condition verified.
              </span>
            </div>
            <span className="hidden text-[10px] font-bold uppercase tracking-wider text-emerald-700 sm:inline-block">
              Dock {activeSpot?.number ?? "--"} locked
            </span>
          </div>
        ) : null}
      </div>

      {/* Main grid: left content & right summary */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left column */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {step === 1 ? (
            <>
              {/* Inspection checkpoints */}
              <div className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-staff-teal-soft text-staff-teal">
                      <Icon name="clipboard" className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-bold text-staff-pine">
                      Bike Condition Check
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {allAnswered
                      ? "3 Checkpoints Required"
                      : `${checkedCount} of 3 Checked`}
                  </span>
                </div>

                <form className="flex flex-col gap-8">
                  {findings.map((finding, index) => {
                    const { checkpoint, option } = finding;
                    const severity = option?.severity;
                    return (
                      <div key={checkpoint.key} className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label
                            className="flex items-center gap-2 text-base font-bold text-staff-pine"
                            htmlFor={`checkpoint-${checkpoint.key}`}
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-staff-pine">
                              {index + 1}
                            </span>
                            {checkpoint.title}
                          </label>
                          <span
                            className={cn(
                              "flex items-center gap-1 text-[10px] font-semibold",
                              !option
                                ? "text-slate-400"
                                : severity === "pass"
                                  ? "text-emerald-700"
                                  : severity === "minor"
                                    ? "text-amber-600"
                                    : "text-rose-600",
                            )}
                          >
                            <Icon name="checkCircle" className="h-3.5 w-3.5" />
                            {!option
                              ? "Not Checked"
                              : severity === "pass"
                                ? "Verified Good"
                                : severity === "minor"
                                  ? "Needs Attention"
                                  : "Fault Detected"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{checkpoint.hint}</p>
                        <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
                          {checkpoint.options.map((choice) => {
                            const selected = choice.value === answers[checkpoint.key];
                            return (
                              <label
                                key={choice.value}
                                className={cn(
                                  "relative flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-3 transition-all",
                                  selected
                                    ? "border-2 border-staff-teal bg-staff-teal-soft/40 shadow-card"
                                    : "border border-slate-200 bg-white hover:bg-slate-50",
                                )}
                              >
                                <input
                                  id={`checkpoint-${checkpoint.key}-${choice.value}`}
                                  className="sr-only"
                                  type="radio"
                                  name={checkpoint.key}
                                  value={choice.value}
                                  checked={selected}
                                  onChange={() =>
                                    setAnswers((prev) => ({
                                      ...prev,
                                      [checkpoint.key]: choice.value,
                                    }))
                                  }
                                />
                                <span
                                  className={cn(
                                    "text-sm",
                                    selected
                                      ? "font-bold text-staff-pine"
                                      : choice.severity === "fault"
                                        ? "font-medium text-rose-600"
                                        : "font-medium text-slate-700",
                                  )}
                                >
                                  {choice.label}
                                </span>
                                <span
                                  className={cn(
                                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                                    selected ? "border-staff-teal" : "border-slate-300",
                                  )}
                                >
                                  {selected ? (
                                    <span className="h-2.5 w-2.5 rounded-full bg-staff-teal" />
                                  ) : null}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </form>

                {!allAnswered && (
                  <p className="text-xs font-medium text-amber-700">
                    Record an outcome for every checkpoint before moving on.
                  </p>
                )}
              </div>

              {/* Notes & comments */}
              <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Icon name="note" className="h-5 w-5 text-staff-teal" />
                    <h3 className="text-lg font-bold text-staff-pine">
                      Notes &amp; Comments
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Visible in maintenance logs
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-800 shadow-inner transition-all placeholder:text-slate-400 focus:border-staff-teal focus:bg-white focus:outline-none focus:ring-1 focus:ring-staff-teal"
                    placeholder="Add specific mechanical observations or cleanliness remarks..."
                    rows={3}
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setDraftSaved(false);
                    }}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-slate-500">
                    <Icon
                      name="checkCircle"
                      className={cn(
                        "h-3.5 w-3.5",
                        draftSaved ? "text-emerald-600" : "text-slate-300",
                      )}
                    />
                    {draftSaved ? "Autosaved" : "Draft"}
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              {/* Check passed confirmation */}
              <div
                className={cn(
                  "flex flex-col items-start justify-between gap-3 rounded-xl p-4 shadow-card sm:flex-row sm:items-center",
                  allClear
                    ? "bg-emerald-50/70 text-slate-800"
                    : "bg-amber-50 text-slate-800",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm",
                      allClear ? "bg-emerald-600" : "bg-amber-500",
                    )}
                  >
                    <Icon name="taskAlt" className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-staff-pine">
                      {allClear
                        ? "Bike check passed: Cleared to be parked"
                        : "Bike check flagged issues"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {allClear
                        ? `${answered
                            .map((f) => f.checkpoint.title)
                            .join(", ")} passed the standard field checklist.`
                        : "One or more checkpoints were not passed — pick the disposition below to send the bike to the mechanic."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="shrink-0 rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-staff-pine transition-colors hover:bg-slate-100"
                >
                  View details
                </button>
              </div>

              {/* Location allocation */}
              <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Location Allocation
                    </span>
                    <h2 className="text-lg font-bold text-staff-pine">
                      Where is the bike parked?
                    </h2>
                    <p className="text-xs text-slate-500">
                      Select the parking spot where you physically locked and
                      returned this bike.
                    </p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-staff-pine">
                    <Icon name="parking" className="h-4 w-4" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  <label
                    htmlFor="parking-spot"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Parking Spot &amp; Bay
                  </label>
                  <Select
                    value={spot ?? ""}
                    onValueChange={(value) => setSpot(value)}
                  >
                    <SelectTrigger
                      id="parking-spot"
                      aria-label="Parking spot"
                      className={cn(
                        "h-auto w-full items-center justify-between rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-left shadow-sm transition-colors hover:bg-slate-100",
                        "focus:ring-2 focus:ring-staff-teal focus:border-staff-teal",
                        "data-[placeholder]:font-medium data-[placeholder]:text-slate-400",
                        !activeSpot && "border-dashed",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "h-3 w-3 shrink-0 rounded-full",
                            activeSpot ? "bg-emerald-600" : "bg-slate-300",
                          )}
                        />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-bold text-staff-pine">
                            {activeSpot
                              ? `${stationName} - Parking Spot #${activeSpot.number}`
                              : "Select a parking spot"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {activeSpot
                              ? `Dock Sensor Ready • Clamp #${activeSpot.clamp} active`
                              : "Choose the bay the bicycle is docked in"}
                          </span>
                        </div>
                      </div>
                    </SelectTrigger>

                    <SelectContent className="rounded-xl border-slate-200 p-1.5">
                      {PARKING_SPOTS.map((option) => (
                        <SelectItem
                          key={option.id}
                          value={option.id}
                          className="rounded-xl py-2.5 pl-3 pr-9 focus:bg-slate-100 focus:text-staff-pine"
                        >
                          <span className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">
                              {stationName} - Parking Spot #{option.number}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Dock Sensor Ready • Clamp #{option.clamp} active
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {activeSpot ? (
                    <span className="mt-1 inline-flex w-fit items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
                      Bay {activeSpot.number} locked &amp; ready
                    </span>
                  ) : null}
                </div>

                {/* Quick station status metadata */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <span className="block text-[10px] uppercase text-slate-500">
                      Station Capacity
                    </span>
                    <span className="text-sm font-bold text-staff-pine">
                      {baysUsed} / {baysTotal} Bays
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <span className="block text-[10px] uppercase text-slate-500">
                      Dock Clamp State
                    </span>
                    <span className="text-sm font-bold text-emerald-700">
                      {parkingReady ? "Signal Latched" : "Awaiting Signal"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <span className="block text-[10px] uppercase text-slate-500">
                      Zone Speed
                    </span>
                    <span className="text-sm font-bold text-staff-pine">
                      {parkingReady ? "Sync < 0.4s" : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Next status disposition */}
              <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Next Status Disposition
                    </span>
                    <h2 className="text-lg font-bold text-staff-pine">
                      What should happen to this bike next?
                    </h2>
                    <p className="text-xs text-slate-500">
                      Choose if the bike is ready for the next customer or needs
                      technician inspection.
                    </p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-staff-pine">
                    <Icon name="rule" className="h-4 w-4" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {DISPOSITIONS.map((option) => {
                    const selected = option.id === disposition;
                    return (
                      <label
                        key={option.id}
                        className={cn(
                          "group relative flex cursor-pointer items-start gap-4 rounded-xl p-4 transition-all",
                          selected
                            ? "bg-staff-teal-soft/40 shadow-card"
                            : "bg-slate-50 hover:bg-slate-100",
                        )}
                      >
                        <input
                          className="sr-only"
                          type="radio"
                          name="disposition"
                          value={option.id}
                          checked={selected}
                          onChange={() => setDisposition(option.id)}
                        />
                        <span
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full shadow-sm",
                            selected ? "bg-staff-teal" : "bg-white",
                          )}
                        >
                          <span
                            className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              selected ? "bg-emerald-300" : "bg-transparent",
                            )}
                          />
                        </span>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-lg font-bold text-staff-pine">
                              {option.title}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                                option.id === "ready"
                                  ? "bg-emerald-100 text-emerald-900"
                                  : "bg-slate-200 text-slate-600",
                              )}
                            >
                              {option.badge}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {option.detail}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {!disposition && (
                  <p className="text-xs font-medium text-amber-700">
                    Choose where this bike goes next before continuing.
                  </p>
                )}
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              {/* Payment status */}
              <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-card">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-staff-pine">
                      Payment Status
                    </h2>
                    <p className="text-xs text-slate-500">
                      {paymentPaid
                        ? "Bike returned on schedule. Zero balance pending."
                        : "The rider still owes money at the dock."}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      paymentPaid
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-amber-100 text-amber-900",
                    )}
                  >
                    {paymentPaid ? "Fully Paid" : "Payment Pending"}
                  </span>
                </div>

                {/* Fee ledger */}
                <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-slate-50 p-6 sm:flex-row sm:items-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Extra fee due: {currency} 0
                    </span>
                    <div className="mt-1 text-3xl font-bold leading-none tracking-tight text-staff-pine">
                      {money(paymentPaid ? 0 : amountDue, currency)}
                    </div>
                  </div>
                  <div className="space-y-0.5 border-t border-slate-200 pt-3 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0 sm:text-right">
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 sm:justify-end">
                      <Icon name="clock" className="h-4 w-4" />
                      {paymentPaid ? "Returned on time" : "Collection pending"}
                    </span>
                    <p className="max-w-xs text-xs text-slate-500">
                      Initial rental fee of{" "}
                      <strong className="font-semibold text-staff-pine">
                        {money(amountDue, currency)}
                      </strong>{" "}
                      completely covers duration.
                    </p>
                  </div>
                </div>

                {/* Confirmation banner */}
                <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-100 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 font-medium text-staff-pine">
                    <Icon name="checkCircle" className="h-4 w-4 text-emerald-600" />
                    {paymentPaid
                      ? "Nothing more to collect from rider"
                      : "Collect the outstanding amount before releasing the bike"}
                  </span>
                  <span className="font-bold text-staff-pine">
                    Balance: {money(paymentPaid ? 0 : amountDue, currency)}
                  </span>
                </div>
              </div>

              {/* Finish return & notifications */}
              <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-staff-pine">
                    Finish Return &amp; Notifications
                  </h2>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Operational Actions
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                    <input
                      className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 text-staff-teal accent-staff-teal focus:ring-0"
                      type="checkbox"
                      checked={sendReceipt}
                      onChange={(e) => setSendReceipt(e.target.checked)}
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold text-staff-pine">
                        Send receipt by SMS to customer
                        {riderPhone ? ` (${riderPhone})` : ""}
                      </span>
                      <span className="text-xs text-slate-500">
                        Instant confirmation sent via EasyRide SMS Gateway
                      </span>
                    </span>
                  </label>

                  <label
                    className={cn(
                      "flex items-start gap-3 rounded-lg p-4 transition-colors",
                      disposition === "maintenance"
                        ? "bg-amber-50/70"
                        : "cursor-pointer bg-slate-50 hover:bg-slate-100",
                    )}
                  >
                    <input
                      className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 text-staff-teal accent-staff-teal focus:ring-0 disabled:cursor-not-allowed"
                      type="checkbox"
                      checked={markReady && disposition !== "maintenance"}
                      disabled={disposition === "maintenance"}
                      onChange={(e) => setMarkReady(e.target.checked)}
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold text-staff-pine">
                        {disposition === "maintenance"
                          ? "Bike held for mechanic service"
                          : "Mark bike as ready for the next customer"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {disposition === "maintenance"
                          ? "The bicycle stays out of rotation and the bay is flagged"
                          : "Update fleet catalog & unlock smart frame for the next rider immediately"}
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </>
          ) : null}

          {/* Navigation buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {step === 1 ? (
              <button
                type="button"
                onClick={() => {
                  setDraftSaved(true);
                  onExit();
                }}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-staff-pine transition hover:bg-slate-100"
              >
                <Icon name="save" className="h-4 w-4" />
                Save Draft
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-100 px-6 py-2.5 text-sm font-semibold text-staff-pine transition-all shadow-sm hover:bg-slate-200"
              >
                <Icon name="arrowBack" className="h-4 w-4" />
                Back to Step {step - 1}
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                disabled={step === 1 ? !allAnswered : !stepTwoReady}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-staff-teal px-6 py-3 text-sm font-semibold text-white transition-all shadow-card-hover hover:bg-staff-pine-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:w-auto"
              >
                {step === 1 ? "Next: Park & Assign Spot" : "Next: Receipt & Finish"}
                <Icon name="arrow" className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={completeReturn}
                disabled={finishing || finished}
                className={cn(
                  "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all shadow-card-hover hover:shadow-lg disabled:cursor-default sm:w-auto",
                  finished
                    ? "bg-emerald-600"
                    : "bg-staff-pine hover:bg-staff-teal",
                  finishing && "opacity-75",
                )}
              >
                {finished ? (
                  <>
                    <Icon name="checkCircle" className="h-5 w-5 text-emerald-200" />
                    Return Complete!
                  </>
                ) : finishing ? (
                  <>
                    <Icon name="refresh" className="h-5 w-5 animate-spin" />
                    Finalizing Record...
                  </>
                ) : (
                  <>
                    <span>Complete Return &amp; Finish</span>
                    <Icon name="taskAlt" className="h-5 w-5 text-emerald-200" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right column: official digital receipt (step 3) or rental summary */}
        <div className="flex flex-col gap-4 lg:col-span-5 lg:sticky lg:top-20">
          {step === 3 ? (
            <aside className="w-full overflow-hidden rounded-xl bg-white shadow-card-hover">
              {/* Receipt header */}
              <div className="relative overflow-hidden bg-staff-teal px-6 py-7 text-center text-white">
                <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-emerald-400/20 blur-xl" />
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <span className="rounded-full bg-emerald-200/20 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-200">
                    Official Receipt
                  </span>
                  <h3 className="text-2xl font-bold tracking-tight">Bike Return Receipt</h3>
                  <p className="text-xs text-slate-300">
                    {stationName}
                    {stationLandmark ? ` • ${stationLandmark}` : ""}
                  </p>
                  <div className="mt-3 pt-2">
                    <span className="rounded bg-white/10 px-3 py-1 font-mono text-xs font-bold tracking-wider text-emerald-200">
                      #{receiptNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Receipt body */}
              <div className="flex flex-col gap-5 px-6 py-6">
                <dl className="flex flex-col gap-2 text-sm">
                  {receiptRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-3 border-b border-slate-100 py-1 last:border-0"
                    >
                      <dt className="font-medium text-slate-500">{row.label}</dt>
                      <dd
                        className={cn(
                          "text-right font-bold text-staff-pine",
                          row.label === "Assigned Spot" && "text-emerald-700",
                        )}
                      >
                        {row.label === "Assigned Spot" ? (
                          <span className="inline-flex items-center gap-1">
                            <Icon name="parking" className="h-4 w-4" />
                            {row.value}
                          </span>
                        ) : (
                          row.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* Grand totals */}
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Total Paid
                    </span>
                    <p className="text-xs text-slate-500">Standard rental fee</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold leading-tight text-staff-pine">
                      {money(amountDue, currency)}
                    </span>
                    <p className="text-[10px] font-bold text-emerald-700">
                      Extra fee: {money(0, currency)}
                    </p>
                  </div>
                </div>

                {/* Receipt actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-slate-100 px-4 py-2.5 text-xs font-bold text-staff-pine transition-all hover:bg-slate-200"
                  >
                    <Icon name="print" className="h-4 w-4" />
                    Print Receipt
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadReceipt}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-staff-teal px-4 py-2.5 text-xs font-bold text-white shadow-card transition-all hover:bg-staff-pine"
                  >
                    <Icon name="download" className="h-4 w-4 text-emerald-200" />
                    Download PDF
                  </button>
                </div>

                {/* Signed footer */}
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Icon name="verified" className="h-3.5 w-3.5 text-emerald-600" />
                    Cryptographically Signed
                  </span>
                  <span className="font-mono text-slate-400">{receiptCode}</span>
                </div>
              </div>

              {/* Perforated edge */}
              <div className="flex h-2 items-center justify-around overflow-hidden bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50">
                {Array.from({ length: 8 }).map((_, index) => (
                  <span key={index} className="h-2 w-2 rounded-full bg-white" />
                ))}
              </div>
            </aside>
          ) : (
            <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-card">
            {/* Summary header */}
            <div className="flex items-center justify-between pb-1">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-staff-pine">
                    Rental Summary
                  </h3>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    {rentalId}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Current return details &amp; validation
                </p>
              </div>
              <Icon name="receipt" className="h-6 w-6 text-emerald-600" />
            </div>

            {/* Customer identity */}
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-staff-teal text-lg font-bold text-white shadow-sm">
                {initials(riderName)}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-bold text-staff-pine">
                    {riderName}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
                    Active Member
                  </span>
                </div>
                <span className="truncate text-xs text-slate-500">
                  {riderPhone || "No contact on file"}
                </span>
              </div>
            </div>

            {/* Bike thumbnail */}
            <div className="flex items-center gap-4 rounded-xl bg-slate-50/60 p-3 shadow-sm">
              <img
                alt={modelName || bikeCode}
                className="h-16 w-20 shrink-0 rounded-lg bg-slate-100 object-cover"
                src={image}
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-bold text-staff-pine">
                  {modelName || category}
                </span>
                <span className="text-xs text-slate-500">
                  Fleet ID: #{bikeCode}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                  <Icon name="battery" className="h-3 w-3" />
                  {bikeSpec}
                </span>
              </div>
            </div>

            {/* Chrono stats */}
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3">
              {(
                [
                  ["Elapsed Time", durationLabel],
                  ["Pickup Time", timeOf(started)],
                  ["Return Time", timeOf(now)],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label} className="flex flex-col text-center">
                  <span className="text-[10px] uppercase text-slate-500">
                    {label}
                  </span>
                  <span className="mt-0.5 text-sm font-bold text-staff-pine">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Return status & billing */}
            <div className="flex flex-col gap-1.5 rounded-xl bg-staff-teal p-4 text-white shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Return Status
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                  {paymentPaid ? "On-Time" : "Pending"}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <div>
                  <p className="text-3xl font-bold leading-none">
                    {money(amountDue, currency)}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    {paymentPaid
                      ? "Nothing else to pay • On-Time (No Extra Fee)"
                      : "Money still to collect from the rider"}
                  </p>
                </div>
                <span className="rounded-full bg-staff-pine px-3 py-1 text-[10px] font-bold text-emerald-200">
                  Prepaid Pass
                </span>
              </div>
            </div>

            {/* Action buttons */}
            {step === 2 ? (
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!stepTwoReady) return;
                    setStep(3);
                  }}
                  disabled={!stepTwoReady}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon name="checkCircle" className="h-4 w-4" />
                  Confirm Parking Spot
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="w-full cursor-pointer rounded-full bg-slate-100 py-2.5 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Save Draft / Cancel
                </button>
              </div>
            ) : null}

            {/* Dock verification notice */}
            <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-slate-500">
              <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-[11px] leading-tight">
                {step === 2
                  ? "Dock sensor sync confirms the bay is physically latched. Verify the QR lock is closed before you walk away."
                  : "Inspect closely before confirming step 1. Any unflagged frame damage will be marked to staff handling history."}
              </p>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
