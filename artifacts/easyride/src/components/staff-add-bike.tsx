/**
 * "Add Bike" — the staff console task for registering a new bicycle.
 *
 * The screen is a three step wizard (identity → station & condition →
 * handover check) so each decision gets its own page. There is no backend:
 * the bicycle is written into the shared fleet state (localStorage) and its
 * model name, photo and specs are kept in the local metadata store so every
 * surface shows the same thing.
 */

import { useMemo, useRef, useState } from "react";
import type {
  EasyRideBicycle,
  EasyRideState,
  EasyRideStation,
} from "@workspace/api-client-react";
import { getBikeMeta } from "@/lib/mock-data";
import { saveCustomBikeMeta } from "@/lib/custom-bike-meta";
import { fileToStorableImage } from "@/lib/image-upload";
import { toast } from "@/hooks/use-toast";
import { uid, when } from "@/lib/format";
import { cn } from "@/lib/utils";

type BikeType = "Electric" | "Mountain" | "City" | "Racing" | "Hybrid";

const BIKE_TYPES: { id: BikeType; hint: string }[] = [
  { id: "Electric", hint: "Pedal assist" },
  { id: "Mountain", hint: "Off-road frame" },
  { id: "City", hint: "Campus commuter" },
  { id: "Racing", hint: "Road race rig" },
  { id: "Hybrid", hint: "Fitness hybrid" },
];

/** Placeholder shown until the staff member uploads their own picture. */
const DEFAULT_PHOTO = "/bikes/bike-3.jpg";

const CONDITIONS: { id: EasyRideBicycle["condition"]; hint: string }[] = [
  { id: "excellent", hint: "As new, no wear" },
  { id: "good", hint: "Normal campus wear" },
  { id: "fair", hint: "Serviceable, cosmetically worn" },
];

const HANDOVER_CHECKS = [
  { id: "brakes", label: "Brakes & levers bite properly" },
  { id: "tyres", label: "Tyres inflated, no cuts or bulges" },
  { id: "chain", label: "Chain & gears shift smoothly" },
  { id: "gear", label: "Lights, bell & QR lock working" },
];

const TYPE_PREFIX: Record<BikeType, string> = {
  Electric: "E",
  Mountain: "M",
  City: "C",
  Racing: "R",
  Hybrid: "H",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-all duration-150 focus:border-staff-teal focus:bg-white focus:outline-none focus:ring-2 focus:ring-staff-teal/20";

const primaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-staff-teal px-5 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-staff-pine-hover active:scale-[0.98] cursor-pointer";

const secondaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer";

const slug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export interface StaffAddBikeProps {
  state: EasyRideState;
  save: (state: EasyRideState) => void;
  staffName: string;
}

export default function StaffAddBike({
  state,
  save,
  staffName,
}: StaffAddBikeProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [type, setType] = useState<BikeType>("City");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [modelName, setModelName] = useState("");
  const [photo, setPhoto] = useState(DEFAULT_PHOTO);
  const [photoName, setPhotoName] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [stationId, setStationId] = useState(state.stations[0]?.id ?? "");
  const [condition, setCondition] = useState<EasyRideBicycle["condition"]>(
    "excellent",
  );
  const [holdForMaintenance, setHoldForMaintenance] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({
    brakes: false,
    tyres: false,
    chain: false,
    gear: false,
  });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState<{
    id: string;
    code: string;
  } | null>(null);

  /** Next free fleet code for the chosen family, e.g. ER-C307. */
  const suggestedCode = useMemo(() => {
    const prefix = TYPE_PREFIX[type];
    const pattern = new RegExp(`^ER-${prefix}(\\d+)$`, "i");
    const numbers = state.bicycles
      .map((bike) => bike.code.match(pattern))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => Number(match[1]));
    const next = (numbers.length ? Math.max(...numbers) : 100) + 1;
    return `ER-${prefix}${next}`;
  }, [state.bicycles, type]);

  const effectiveCode = codeTouched ? code.trim().toUpperCase() : suggestedCode;

  const chosenStation: EasyRideStation | undefined = state.stations.find(
    (station) => station.id === stationId,
  );

  const checkedCount = HANDOVER_CHECKS.filter((check) => checks[check.id]).length;
  const allChecked = checkedCount === HANDOVER_CHECKS.length;

  const codeTaken = state.bicycles.some(
    (bike) => bike.code.toUpperCase() === effectiveCode,
  );

  const stationBikes = state.stations.map((station) => ({
    station,
    count: state.bicycles.filter((bike) => bike.stationId === station.id).length,
  }));

  const registeredBikes = state.bicycles
    .filter((bike) => bike.id.startsWith("bike-custom-"))
    .slice(-4)
    .reverse();

  /** What still has to be filled in before the wizard can move on. */
  const stepReady = (target: 1 | 2 | 3) => {
    if (target === 1) {
      return (
        Boolean(effectiveCode) &&
        !codeTaken &&
        Boolean(modelName.trim())
      );
    }
    if (target === 2) return Boolean(stationId);
    return allChecked;
  };

  const stepError = (target: 1 | 2 | 3) => {
    if (target === 1) {
      if (!effectiveCode) return "Give the bicycle a fleet code so it can be tracked.";
      if (codeTaken) return `${effectiveCode} is already in the fleet. Use another code.`;
      if (!modelName.trim())
        return "Add the model name so riders know what they are booking.";
      return "";
    }
    if (target === 2) return "Choose the station the bicycle is parked at.";
    return "Complete the handover checklist before registering the bicycle.";
  };

  const goToStep = (target: 1 | 2 | 3) => {
    // Moving forward is only allowed once the current step is complete.
    if (target > step && !stepReady(step)) {
      setError(stepError(step));
      return;
    }
    setError("");
    setStep(target);
  };

  const resetForm = () => {
    setStep(1);
    setCode("");
    setCodeTouched(false);
    setModelName("");
    setPhoto(DEFAULT_PHOTO);
    setPhotoName("");
    setPhotoError("");
    setCondition("excellent");
    setHoldForMaintenance(false);
    setChecks({ brakes: false, tyres: false, chain: false, gear: false });
    setNotes("");
    setError("");
    setRegistered(null);
  };

  const handlePhoto = async (file?: File | null) => {
    if (!file) return;
    setPhotoError("");
    const result = await fileToStorableImage(file);
    if ("error" in result) {
      setPhotoError(result.error);
      return;
    }
    setPhoto(result.dataUrl);
    setPhotoName(file.name);
  };

  const handleRegister = () => {
    const cleanCode = effectiveCode.trim().toUpperCase();
    const cleanModel = modelName.trim();

    if (!stepReady(1)) {
      setError(stepError(1));
      return;
    }
    if (!stepReady(2)) {
      setError(stepError(2));
      return;
    }
    if (!stepReady(3)) {
      setError(stepError(3));
      return;
    }

    const id = `bike-custom-${slug(cleanCode) || uid()}`;
    const bike: EasyRideBicycle = {
      id,
      code: cleanCode,
      type,
      stationId,
      status: holdForMaintenance ? "maintenance" : "available",
      condition,
      lastChecked: when(),
    };

    save({
      ...state,
      bicycles: [...state.bicycles, bike],
      activity: [
        {
          id: uid(),
          message: `New bicycle ${cleanCode} (${cleanModel}) registered at ${
            chosenStation?.name ?? "station"
          } by ${staffName}`,
          createdAt: when(),
          kind: "station" as const,
        },
        ...state.activity,
      ].slice(0, 100),
    });

    saveCustomBikeMeta(id, {
      modelName: cleanModel,
      type,
      image: photo,
      specs: {
        highlight: `${type} bicycle added to the ${chosenStation?.name ?? "station"} fleet`,
        gears: type === "Mountain" ? "12-spd Shimano" : "8-spd Shimano",
        weight: type === "Racing" ? "7.9 kg" : "13.4 kg",
      },
    });

    setError("");
    setRegistered({ id, code: cleanCode });

    // Corner notification: the bicycle and its details are now in the system.
    toast({
      variant: "success",
      title: "Bicycle added successfully",
      description: (
        <div className="mt-1 space-y-0.5 text-xs text-emerald-900/90">
          <p className="font-bold text-emerald-950">
            {cleanCode} · {cleanModel}
          </p>
          <p>Category: {type}</p>
          <p>Station: {chosenStation?.name ?? "—"}</p>
          <p>
            Condition: {condition} • Status:{" "}
            {holdForMaintenance ? "Held for maintenance" : "Available to rent"}
          </p>
        </div>
      ),
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress rail */}
      {registered ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-600 text-white">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-bold text-emerald-900">
                {registered.code} joined the fleet
              </p>
              <p className="text-xs text-emerald-800/80">
                It is now listed on the station board and available to rent.
              </p>
            </div>
          </div>
          <button type="button" onClick={resetForm} className={secondaryButton}>
            Register another bike
          </button>
        </section>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left: the active step */}
        <div className="flex flex-col gap-5 lg:col-span-7" onChange={() => setError("")}>
          {/* STEP 1 — identity */}
          {step === 1 ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-staff-teal text-xs font-bold text-white">
                    1
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900">
                      Bike Identity
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Code, model and how it looks in the catalogue.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">
                    Fleet code
                  </span>
                  <div className="flex gap-2">
                    <input
                      className={inputClass + " font-mono"}
                      value={effectiveCode}
                      onChange={(event) => {
                        setCodeTouched(true);
                        setCode(event.target.value.toUpperCase());
                      }}
                      placeholder={suggestedCode}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCodeTouched(false);
                        setCode("");
                      }}
                      className={secondaryButton}
                      title="Use the suggested code"
                    >
                      Auto
                    </button>
                  </div>
                  {codeTouched && codeTaken ? (
                    <span className="mt-1 block text-[11px] font-semibold text-rose-600">
                      {effectiveCode} is already in the fleet.
                    </span>
                  ) : (
                    <span className="mt-1 block text-[11px] text-slate-400">
                      Suggested for a {type.toLowerCase()} bike: {suggestedCode}
                    </span>
                  )}
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">
                    Model name
                  </span>
                  <input
                    className={inputClass}
                    value={modelName}
                    onChange={(event) => setModelName(event.target.value)}
                    placeholder="e.g. Trek FX 3 Disc Hybrid"
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">
                    Riders see this on the booking page.
                  </span>
                </label>
              </div>

              <div className="mt-4">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">
                  Category
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {BIKE_TYPES.map((option) => {
                    const selected = option.id === type;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setError("");
                          setType(option.id);
                        }}
                        className={cn(
                          "cursor-pointer rounded-xl border p-3 text-left transition",
                          selected
                            ? "border-2 border-staff-teal bg-staff-teal/5 shadow-card"
                            : "border border-slate-200 bg-white hover:bg-slate-50",
                        )}
                      >
                        <span
                          className={cn(
                            "block text-sm font-bold",
                            selected ? "text-staff-teal" : "text-slate-700",
                          )}
                        >
                          {option.id}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {option.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photo upload */}
              <div className="mt-4">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">
                  Upload photo
                </span>
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    void handlePhoto(event.dataTransfer.files?.[0]);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-5 text-center transition",
                    dragging
                      ? "border-staff-teal bg-staff-teal/5"
                      : "border-slate-300 bg-slate-50/60",
                  )}
                >
                  <div className="h-24 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <img
                      src={photo}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      {photoName || "Drop a photo here or browse for one"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      JPG, PNG or WebP · resized automatically for the catalogue
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className={secondaryButton}
                    >
                      Choose photo
                    </button>
                    {photoName ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoName("");
                          setPhoto(DEFAULT_PHOTO);
                        }}
                        className={secondaryButton}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      void handlePhoto(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  {photoError ? (
                    <p className="text-[11px] font-semibold text-rose-600">
                      {photoError}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          {/* STEP 2 — station & condition */}
          {step === 2 ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-staff-teal text-xs font-bold text-white">
                    2
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900">
                      Station &amp; Condition
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Where it lives and how road-ready it is today.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">
                    Home station
                  </span>
                  <select
                    className={inputClass + " cursor-pointer"}
                    value={stationId}
                    onChange={(event) => setStationId(event.target.value)}
                  >
                    {state.stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name} ({station.area})
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-[11px] text-slate-400">
                    {chosenStation?.landmark ?? "Pickup point for this bicycle"}
                  </span>
                </label>

                <div>
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">
                    Arrival condition
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {CONDITIONS.map((option) => {
                      const selected = option.id === condition;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setError("");
                            setCondition(option.id);
                          }}
                          className={cn(
                            "cursor-pointer rounded-xl border p-2.5 text-left transition",
                            selected
                              ? "border-2 border-staff-teal bg-staff-teal/5"
                              : "border border-slate-200 bg-white hover:bg-slate-50",
                          )}
                        >
                          <span
                            className={cn(
                              "block text-xs font-bold capitalize",
                              selected ? "text-staff-teal" : "text-slate-700",
                            )}
                          >
                            {option.id}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {option.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition hover:bg-slate-100">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 accent-staff-teal"
                  checked={holdForMaintenance}
                  onChange={(event) => setHoldForMaintenance(event.target.checked)}
                />
                <span>
                  <span className="block text-xs font-bold text-slate-800">
                    Hold for maintenance
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    Adds the bicycle to the workshop queue instead of the
                    rentable fleet.
                  </span>
                </span>
              </label>
            </section>
          ) : null}

          {/* STEP 3 — handover checklist */}
          {step === 3 ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-staff-teal text-xs font-bold text-white">
                    3
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900">
                      Handover Checklist
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Confirm the bike is safe before it joins the fleet.
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                    allChecked
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {checkedCount} / {HANDOVER_CHECKS.length} checked
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {HANDOVER_CHECKS.map((check) => {
                  const checked = checks[check.id];
                  return (
                    <label
                      key={check.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition",
                        checked
                          ? "border-staff-teal/40 bg-emerald-50/60"
                          : "border-slate-200 bg-white hover:bg-slate-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 accent-staff-teal"
                        checked={checked}
                        onChange={(event) =>
                          setChecks((prev) => ({
                            ...prev,
                            [check.id]: event.target.checked,
                          }))
                        }
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        {check.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">
                  Handover notes{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </span>
                <textarea
                  className={inputClass + " min-h-20 resize-none"}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Tyre pressure, replaced parts, or anything the next shift should know..."
                />
              </label>
            </section>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
              {error}
            </p>
          ) : null}

          {/* Step navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => goToStep((step - 1) as 1 | 2 | 3)}
                className={secondaryButton}
              >
                Back to Step {step - 1}
              </button>
            ) : (
              <button type="button" onClick={resetForm} className={secondaryButton}>
                Reset form
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => goToStep((step + 1) as 1 | 2 | 3)}
                className={primaryButton}
              >
                {step === 1 ? "Next: Station & Condition" : "Next: Handover Checklist"}
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 12h15" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </button>
            ) : (
              <button type="button" onClick={handleRegister} className={primaryButton}>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Register Bicycle
              </button>
            )}
          </div>
        </div>

        {/* Right: live preview + impact */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Fleet Card Preview
                </h3>
                <p className="text-[11px] text-slate-500">
                  How riders will see this bicycle.
                </p>
              </div>
              <span className="rounded-full bg-staff-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-staff-teal">
                Live
              </span>
            </div>

            <div className="p-5">
              <div className="relative h-40 overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={photo}
                  alt={modelName || "New bicycle"}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-md bg-staff-pine/85 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                  {effectiveCode || "ER-—"}
                </span>
                <span
                  className={cn(
                    "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                    holdForMaintenance
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800",
                  )}
                >
                  {holdForMaintenance ? "Workshop" : "Available"}
                </span>
              </div>

              <h4 className="mt-4 font-display text-lg font-extrabold text-slate-900">
                {modelName.trim() || "Untitled bicycle"}
              </h4>
              <p className="text-xs text-slate-500">
                {type} · {chosenStation?.name ?? "No station"}
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Condition
                  </dt>
                  <dd className="mt-0.5 font-bold capitalize text-slate-800">
                    {condition}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Status
                  </dt>
                  <dd className="mt-0.5 font-bold text-slate-800">
                    {holdForMaintenance ? "Maintenance" : "Available"}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Fleet size
                  </dt>
                  <dd className="mt-0.5 font-bold text-slate-800">
                    {state.bicycles.length} → {state.bicycles.length + 1}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    At this station
                  </dt>
                  <dd className="mt-0.5 font-bold text-slate-800">
                    {stationBikes.find((entry) => entry.station.id === stationId)
                      ?.count ?? 0}{" "}
                    →{" "}
                    {(stationBikes.find((entry) => entry.station.id === stationId)
                      ?.count ?? 0) + 1}
                  </dd>
                </div>
              </dl>

              {notes.trim() ? (
                <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
                  {notes.trim()}
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="font-display text-base font-bold text-slate-900">
              Recently registered
            </h3>
            {registeredBikes.length ? (
              <ul className="mt-3 space-y-2">
                {registeredBikes.map((bike) => {
                  const meta = getBikeMeta(bike);
                  const station = state.stations.find(
                    (entry) => entry.id === bike.stationId,
                  );
                  return (
                    <li
                      key={bike.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5"
                    >
                      <img
                        src={meta.image}
                        alt=""
                        className="h-10 w-12 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800">
                          {meta.modelName}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400">
                          {bike.code} · {station?.name ?? "No station"}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {bike.status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center text-xs text-slate-500">
                Bicycles you register will show up here.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
