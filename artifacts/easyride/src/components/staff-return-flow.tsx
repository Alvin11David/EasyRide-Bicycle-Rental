/**
 * Staff check-in flow.
 *
 * Opened from "Return Bike" on the borrowed fleet list. It walks the station
 * worker through a three step hand-back:
 *
 *   1. Check Bike Condition — frame, brakes and tyres
 *   2. Park & Assign — dock bay and lock status
 *   3. Receipt & Finish — money due and the rider receipt
 *
 * The findings are handed back to the staff console, which closes the hire
 * and (when something is wrong) quarantines the bicycle.
 */

import { useMemo, useState } from "react";
import type { EasyRideBicycle } from "@workspace/api-client-react";
import { initials, money } from "@/lib/format";

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
  | "save"
  | "phone"
  | "store"
  | "lock"
  | "unlock"
  | "receipt"
  | "person";

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
    case "lock":
      return (
        <svg {...base}>
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 118 0v3" />
        </svg>
      );
    case "unlock":
      return (
        <svg {...base}>
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 017.5-2" />
        </svg>
      );
    case "receipt":
      return (
        <svg {...base}>
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
          <path d="M9 8h6M9 12h6" />
        </svg>
      );
    case "person":
      return (
        <svg {...base}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0114 0" />
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

const DOCK_BAYS = [
  { id: "A1", label: "Dock Zone A — Bay 01" },
  { id: "B2", label: "Dock Zone B — Bay 02" },
  { id: "B4", label: "Dock Zone B — Bay 04" },
  { id: "C1", label: "Dock Zone C — Bay 01" },
  { id: "C2", label: "Dock Zone C — Bay 02" },
];

/* ------------------------------------------------------------------------- */
/* Component                                                                  */
/* ------------------------------------------------------------------------- */

export interface ReturnFlowOutcome {
  condition: EasyRideBicycle["condition"];
  notes: string;
  paymentPaid: boolean;
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
  const [dock, setDock] = useState(DOCK_BAYS[1].id);
  const [lockStatus, setLockStatus] = useState<"locked" | "unlocked">("locked");
  const [paymentPaid, setPaymentPaid] = useState(true);

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

  /** The bicycle condition the findings translate into. */
  const condition: EasyRideBicycle["condition"] = faults.length
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
      subtitle: "Physical inspection & safety check",
    },
    {
      id: 2,
      title: "Park & Assign",
      subtitle: "Dock selection & lock status",
    },
    {
      id: 3,
      title: "Receipt & Finish",
      subtitle: "Billing clear & rider receipt",
    },
  ];

  const finish = () => {
    onComplete({
      condition,
      notes: notesForHire,
      paymentPaid,
    });
  };

  return (
    <div className="flex flex-col gap-7">
      {/* Multi-step wizard progress stepper */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-3">
          {steps.map((item, index) => {
            const active = item.id === step;
            const done = item.id < step;
            return (
              <div key={item.id} className="relative flex items-center gap-4 md:pl-4">
                {index > 0 ? (
                  <span
                    aria-hidden
                    className="absolute -left-5 top-1/2 hidden h-0.5 w-8 -translate-y-1/2 bg-slate-200 md:block"
                  />
                ) : null}
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold shadow-md ${
                    active
                      ? "bg-staff-teal text-white"
                      : done
                        ? "bg-staff-teal-soft text-staff-teal"
                        : "border border-slate-300 bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? (
                    <Icon name="checkCircle" className="h-5 w-5" />
                  ) : (
                    item.id
                  )}
                </div>
                <div className={`flex min-w-0 flex-col ${active ? "" : "opacity-70"}`}>
                  <span
                    className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                      active
                        ? "text-emerald-700"
                        : done
                          ? "text-emerald-700"
                          : "text-slate-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        active || done ? "bg-emerald-600" : "bg-slate-300"
                      }`}
                    />
                    Step {item.id} {active ? "• Active" : done ? "• Done" : ""}
                  </span>
                  <span className="truncate text-lg font-bold tracking-tight text-staff-pine">
                    {item.title}
                  </span>
                  <span className="text-xs text-slate-500">{item.subtitle}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Page context title area */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-staff-teal px-3 py-1 text-[10px] font-bold tracking-wide text-white">
              #{bikeCode}
            </span>
            <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-700">
              <Icon name="bike" className="h-3.5 w-3.5 text-staff-teal" />
              {modelName || category}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Live
              Check-in
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-staff-pine lg:text-4xl">
            Step {step}: {steps[step - 1].title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              Inspecting Staff: {staffName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Icon name="pin" className="h-3.5 w-3.5 text-slate-400" /> Station:{" "}
              {stationName}
              {stationLandmark ? ` (${stationLandmark})` : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
            <Icon name="badge" className="h-5 w-5 text-emerald-600" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-500">FLOW ID</span>
              <span className="text-xs font-bold text-staff-pine">{flowId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-12">
        {/* Left column: the active step */}
        <div className="flex flex-col gap-7 lg:col-span-8">
          {step === 1 ? (
            <>
              {/* Inspection checkpoints */}
              <div className="flex flex-col gap-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-7">
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
                            className={`flex items-center gap-1 text-[10px] font-semibold ${
                              !option
                                ? "text-slate-400"
                                : severity === "pass"
                                  ? "text-emerald-700"
                                  : severity === "minor"
                                    ? "text-amber-600"
                                    : "text-rose-600"
                            }`}
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
                                className={`relative flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-3 transition-all ${
                                  selected
                                    ? "border-2 border-staff-teal bg-staff-teal-soft/40 shadow-card"
                                    : "border border-slate-200 bg-white hover:bg-slate-50"
                                }`}
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
                                  className={`text-sm ${
                                    selected
                                      ? "font-bold text-staff-pine"
                                      : choice.severity === "fault"
                                        ? "font-medium text-rose-600"
                                        : "font-medium text-slate-700"
                                  }`}
                                >
                                  {choice.label}
                                </span>
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                    selected
                                      ? "border-staff-teal"
                                      : "border-slate-300"
                                  }`}
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
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-7">
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
                      className={`h-3.5 w-3.5 ${
                        draftSaved ? "text-emerald-600" : "text-slate-300"
                      }`}
                    />
                    {draftSaved ? "Autosaved" : "Draft"}
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              {/* Dock assignment */}
              <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-staff-teal-soft text-staff-teal">
                      <Icon name="store" className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-bold text-staff-pine">
                      Park &amp; Assign Dock
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {stationName}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Choose the bay the bicycle is docked in. The rider is notified of
                  the bay and the lock code on their receipt.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {DOCK_BAYS.map((bay) => {
                    const selected = bay.id === dock;
                    return (
                      <label
                        key={bay.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                          selected
                            ? "border-2 border-staff-teal bg-staff-teal-soft/40 shadow-card"
                            : "border border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <input
                          className="sr-only"
                          type="radio"
                          name="dock"
                          value={bay.id}
                          checked={selected}
                          onChange={() => setDock(bay.id)}
                        />
                        <span
                          className={`text-sm ${
                            selected
                              ? "font-bold text-staff-pine"
                              : "font-medium text-slate-700"
                          }`}
                        >
                          {bay.label}
                        </span>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            selected ? "border-staff-teal" : "border-slate-300"
                          }`}
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

              {/* Lock status */}
              <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-7">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-staff-teal-soft text-staff-teal">
                    <Icon name="lock" className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-staff-pine">
                    Lock Status
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(
                    [
                      {
                        id: "locked",
                        label: "Locked & Sealed",
                        note: "QR lock closed, helmet returned",
                        icon: "lock" as IconName,
                      },
                      {
                        id: "unlocked",
                        label: "Left Unlocked",
                        note: "Station will finish the lock after check-in",
                        icon: "unlock" as IconName,
                      },
                    ]
                  ).map((choice) => {
                    const selected = choice.id === lockStatus;
                    return (
                      <label
                        key={choice.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                          selected
                            ? "border-2 border-staff-teal bg-staff-teal-soft/40 shadow-card"
                            : "border border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <input
                          className="sr-only"
                          type="radio"
                          name="lockStatus"
                          value={choice.id}
                          checked={selected}
                          onChange={() => setLockStatus(choice.id as "locked" | "unlocked")}
                        />
                        <span className="flex items-center gap-2.5">
                          <Icon
                            name={choice.icon}
                            className="h-4 w-4 text-staff-teal"
                          />
                          <span className="flex flex-col">
                            <span
                              className={`text-sm ${
                                selected
                                  ? "font-bold text-staff-pine"
                                  : "font-medium text-slate-700"
                              }`}
                            >
                              {choice.label}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {choice.note}
                            </span>
                          </span>
                        </span>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            selected ? "border-staff-teal" : "border-slate-300"
                          }`}
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
            </>
          ) : null}

          {step === 3 ? (
            <>
              {/* Rider receipt */}
              <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-staff-teal-soft text-staff-teal">
                      <Icon name="receipt" className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-bold text-staff-pine">
                      Rider Receipt
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Rental {rentalId}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Rider
                    </span>
                    <p className="mt-1 text-base font-bold text-slate-800">
                      {riderName}
                    </p>
                    <p className="text-xs text-slate-500">{riderPhone || "No contact on file"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Bicycle
                    </span>
                    <p className="mt-1 text-base font-bold text-slate-800">
                      {modelName || category}
                    </p>
                    <p className="text-xs text-slate-500">Fleet #{bikeCode}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 divide-y divide-slate-100">
                  {(
                    [
                      ["Pickup Time", started.toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" })],
                      ["Return Time", now.toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" })],
                      ["Duration", durationLabel],
                      ["Dock Bay", DOCK_BAYS.find((b) => b.id === dock)?.label ?? dock],
                      [
                        "Lock",
                        lockStatus === "locked" ? "Locked & sealed" : "Left unlocked",
                      ],
                    ] as [string, string][]
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between pt-2 first:pt-0"
                    >
                      <span className="text-xs text-slate-500">{label}</span>
                      <span className="text-sm font-bold text-slate-800">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Amount Due
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      {paymentPaid ? "Cleared" : "Pending"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-3">
                    <span className="text-2xl font-bold tracking-tight text-staff-pine">
                      {money(amountDue, currency)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {money(rate, currency)}/hr
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2.5">
                    <Icon name="store" className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Payment {paymentPaid ? "collected" : "left pending"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Toggle if the rider still owes money at the dock.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaymentPaid((v) => !v)}
                    className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                      paymentPaid
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {paymentPaid ? "Paid" : "Pending"}
                  </button>
                </div>
              </div>

              {/* Findings summary */}
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-7">
                <div className="flex items-center gap-2.5">
                  <Icon
                    name="info"
                    className={`h-5 w-5 ${
                      allClear ? "text-emerald-600" : "text-amber-500"
                    }`}
                  />
                  <h3 className="text-lg font-bold text-staff-pine">
                    Inspection Findings
                  </h3>
                </div>
                {allClear ? (
                  <p className="text-sm text-slate-600">
                    All three checkpoints passed. The bicycle returns to the
                    available fleet as{" "}
                    <span className="font-bold text-staff-pine">
                      {condition}
                    </span>
                    .
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2 text-sm">
                    {findings
                      .filter((f) => f.option && f.option.severity !== "pass")
                      .map((f) => (
                        <li
                          key={f.checkpoint.key}
                          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2"
                        >
                          <span className="font-semibold text-slate-700">
                            {f.checkpoint.title}
                          </span>
                          <span
                            className={`font-bold ${
                              f.option?.severity === "fault"
                                ? "text-rose-600"
                                : "text-amber-600"
                            }`}
                          >
                            {f.option?.label}
                          </span>
                        </li>
                      ))}
                    {notes.trim() ? (
                      <li className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-slate-600">
                        {notes.trim()}
                      </li>
                    ) : null}
                  </ul>
                )}
                {faults.length ? (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    A fault was recorded — the bicycle will be quarantined to the
                    workshop when this hire is closed.
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          {/* Bottom action bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {step === 1 ? (
              <button
                type="button"
                onClick={() => {
                  setDraftSaved(true);
                  onExit();
                }}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-staff-pine transition hover:bg-slate-100"
              >
                <Icon name="save" className="h-4 w-4" />
                Save Draft
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-staff-pine transition hover:bg-slate-100"
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                disabled={step === 1 && !allAnswered}
                className="flex cursor-pointer items-center gap-2 rounded-full bg-staff-pine px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-staff-teal hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {step === 1 ? "Next: Park & Assign Spot" : "Next: Receipt & Finish"}
                <Icon name="arrow" className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                className="flex cursor-pointer items-center gap-2 rounded-full bg-staff-pine px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-staff-teal hover:shadow-lg"
              >
                Finish &amp; Close Rental
                <Icon name="arrow" className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right column: sticky rental summary */}
        <div className="flex flex-col gap-4 lg:col-span-4 lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 p-6">
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-staff-pine">
                  Rental Summary
                </h3>
                <span className="text-[10px] text-slate-500">
                  Current rental details
                </span>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-staff-pine shadow-xs">
                {rentalId}
              </span>
            </div>

            <div className="flex flex-col gap-6 p-6">
              {/* Customer box */}
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Customer
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    Active Member
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-slate-800">
                      {riderName}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                      <Icon name="phone" className="h-3.5 w-3.5 text-slate-400" />
                      {riderPhone || "Not on file"}
                    </span>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-staff-teal text-sm font-bold text-white">
                    {initials(riderName)}
                  </div>
                </div>

                {/* Bike product card */}
                <div className="mt-1 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-white">
                    <img
                      alt={modelName || bikeCode}
                      className="h-full w-full object-cover"
                      src={image}
                    />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-xs font-bold text-staff-pine">
                      {modelName || category}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700">
                      Fleet #{bikeCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timings */}
              <div className="flex flex-col divide-y divide-slate-100">
                <div className="flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Icon name="clock" className="h-4 w-4 text-slate-400" />
                    Pickup Time
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {started.toLocaleTimeString("en-UG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Icon name="refresh" className="h-4 w-4 text-slate-400" />
                    Return Time
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {now.toLocaleTimeString("en-UG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Icon name="timer" className="h-4 w-4 text-emerald-600" />
                    Duration
                  </span>
                  <span className="text-base font-bold text-staff-pine">
                    {durationLabel}
                  </span>
                </div>
              </div>

              {/* Total due */}
              <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Total Due
                  </span>
                  <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {paymentPaid ? "Cleared" : "Pending"}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tracking-tight text-staff-pine">
                      {money(amountDue, currency)}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                      ({money(rate, currency)}/hr)
                    </span>
                  </div>
                </div>
                <p className="flex items-center gap-1 border-t border-slate-200 pt-2 text-xs font-medium text-emerald-700">
                  <Icon name="checkCircle" className="h-3.5 w-3.5" />
                  {paymentPaid
                    ? "Payment collected • Nothing else to pay"
                    : "Payment pending • Follow up with the rider"}
                </p>
              </div>

              {/* Staff guidance */}
              <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-[11px] leading-tight text-slate-500">
                  Inspect closely before confirming step 1. Any unflagged frame
                  damage will be marked to staff handling history.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
