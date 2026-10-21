/**
 * Bridge between the rider-facing booking surface and the staff console.
 *
 * The rider app keeps its own catalogue + order list in localStorage, while
 * the staff console works off the shared `EasyRideState`. Without a bridge a
 * bike borrowed from the rider app never shows up as "Borrowed" for the
 * station team.
 *
 * There is no backend here — the two surfaces are reconciled through
 * localStorage only.
 */

import type {
  EasyRideActivity,
  EasyRideBicycle,
  EasyRideRental,
  EasyRideState,
  EasyRideStation,
} from "@workspace/api-client-react";
import { uid } from "@/lib/format";

export const CUSTOMER_FLEET_KEY = "bikerent_customer_fleet_v1";
export const CUSTOMER_ORDERS_KEY = "bikerent_customer_orders_v1";

/** Depots offered by the rider app. Shared so both consoles agree. */
export const KAMPALA_STATIONS = [
  { name: "Makerere Hill Road", open: true, count: 18, desc: "Main Campus Library Gate" },
  { name: "Wandegeya Market", open: true, count: 12, desc: "Market & Plaza Junction" },
  { name: "Kiwatule Rec Centre", open: true, count: 15, desc: "Kabaka's Trail Way" },
  { name: "Ntinda Junction", open: true, count: 10, desc: "Kisementi & Capital Shoppers" },
  { name: "Bugolobi Village Mall", open: true, count: 14, desc: "Spring Road Hub" },
  { name: "Acacia Mall", open: true, count: 16, desc: "Kololo Hill Avenue" },
  { name: "Nakaserero Market", open: true, count: 8, desc: "Downtown Commercial Dock" },
  { name: "Kasubi Tombs", open: true, count: 7, desc: "Heritage Gateway Bay" },
];

/**
 * Detail the shared state cannot express (rate, hire length, contact) for
 * rentals that originated on the rider app. Keyed by the rental id.
 */
export const CUSTOMER_RENTAL_META_KEY = "easyride_customer_rental_meta_v1";

export interface CustomerRentalMeta {
  orderId: string;
  bikeId: string;
  bikeCode: string;
  bikeName: string;
  stationName: string;
  rate: number;
  hours: number;
  phone: string;
}

export interface CustomerRentalInput {
  orderId: string;
  bikeId: string;
  bikeCode: string;
  bikeName: string;
  bikeType: string;
  customerName: string;
  phone: string;
  stationName: string;
  stationLandmark?: string;
  rate: number;
  hours: number;
  amount: number;
  /** When the ride actually started (defaults to now). */
  startedAt?: string;
}

/** Shape of a rider-app order as it is stored in localStorage. */
export interface CustomerOrderRecord {
  orderId: string;
  bikeId: string;
  bikeCode: string;
  bikeName: string;
  customerName: string;
  phone: string;
  station: string;
  hours: number;
  totalAmount: number;
  startTime?: string;
  date?: string;
  status: "active" | "completed";
}

/** Shape of a rider-app catalogue bike as it is stored in localStorage. */
export interface CustomerFleetRecord {
  id: string;
  code: string;
  name: string;
  type: string;
  station: string;
  rate: number;
  status: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const slug = (value: string) =>
  value
    .trim()
    .replace(/^#/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Customer catalogue types -> the fleet types used by the staff console. */
const BIKE_TYPES: Record<string, string> = {
  electric: "Electric",
  mountain: "Mountain",
  city: "City",
  racing: "Racing",
  hybrid: "Hybrid",
};

export const customerRentalId = (orderId: string) => `rental-cust-${orderId}`;

export const isCustomerRental = (rentalId: string) =>
  rentalId.startsWith("rental-cust-");

/** Resolve (or create) the shared station that matches a rider-app depot. */
function resolveStation(
  state: EasyRideState,
  stationName: string,
  landmark?: string,
): { stations: EasyRideStation[]; station: EasyRideStation } {
  const name = stationName.trim() || "Main Campus";
  const byName = state.stations.find(
    (s) => slug(s.name) === slug(name) || slug(name).includes(slug(s.name)),
  );
  if (byName) return { stations: state.stations, station: byName };

  const byArea = state.stations.find((s) =>
    name.toLowerCase().includes(s.area.toLowerCase()),
  );
  if (byArea) return { stations: state.stations, station: byArea };

  const station: EasyRideStation = {
    id: `station-${slug(name) || "pickup"}`,
    name,
    area: "Kampala",
    landmark: landmark || "Rider-app pickup point",
    active: true,
  };
  return { stations: [...state.stations, station], station };
}

/** Resolve (or create) the shared bicycle record for a rider-app bike. */
function resolveBicycle(
  state: EasyRideState,
  input: CustomerRentalInput,
  stationId: string,
  nowIso: string,
): { bicycles: EasyRideBicycle[]; bicycle: EasyRideBicycle } {
  const code = input.bikeCode.replace(/^#/, "");
  const existing = state.bicycles.find((b) => slug(b.code) === slug(code));

  if (existing) {
    const bicycle: EasyRideBicycle = { ...existing, status: "rented" };
    return {
      bicycles: state.bicycles.map((b) => (b.id === existing.id ? bicycle : b)),
      bicycle,
    };
  }

  const bicycle: EasyRideBicycle = {
    id: `bike-cust-${slug(code) || uid()}`,
    code,
    type: BIKE_TYPES[slug(input.bikeType)] ?? "City",
    stationId,
    status: "rented",
    condition: "good",
    lastChecked: nowIso,
  };
  return { bicycles: [...state.bicycles, bicycle], bicycle };
}

// ---------------------------------------------------------------------------
// Rider-app stores
// ---------------------------------------------------------------------------

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/** Rider-app orders, newest first. */
export function readCustomerOrders(): CustomerOrderRecord[] {
  const orders = readJson<CustomerOrderRecord[]>(CUSTOMER_ORDERS_KEY, []);
  return Array.isArray(orders) ? orders : [];
}

/** Rider-app catalogue. */
export function readCustomerFleet(): CustomerFleetRecord[] {
  const fleet = readJson<CustomerFleetRecord[]>(CUSTOMER_FLEET_KEY, []);
  return Array.isArray(fleet) ? fleet : [];
}

// ---------------------------------------------------------------------------
// Meta store (localStorage only)
// ---------------------------------------------------------------------------

export function readCustomerRentalMeta(): Record<string, CustomerRentalMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CUSTOMER_RENTAL_META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCustomerRentalMeta(
  id: string,
  meta: CustomerRentalMeta,
): void {
  if (typeof window === "undefined") return;
  try {
    const all = readCustomerRentalMeta();
    all[id] = meta;
    window.localStorage.setItem(CUSTOMER_RENTAL_META_KEY, JSON.stringify(all));
  } catch {
    /* storage full or unavailable — the rental still lives in the shared state */
  }
}

function forgetCustomerRentalMeta(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const all = readCustomerRentalMeta();
    if (!all[id]) return;
    delete all[id];
    window.localStorage.setItem(CUSTOMER_RENTAL_META_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Shared-state transitions
// ---------------------------------------------------------------------------

/**
 * Record a rider-app booking as an active hire so the station team sees the
 * bike as borrowed straight away.
 */
export function applyCustomerRental(
  state: EasyRideState,
  input: CustomerRentalInput,
): EasyRideState {
  if (!state) return state;

  const nowIso = new Date().toISOString();
  const startedAt = input.startedAt && !Number.isNaN(Date.parse(input.startedAt))
    ? new Date(input.startedAt).toISOString()
    : nowIso;
  const { stations, station } = resolveStation(
    state,
    input.stationName,
    input.stationLandmark,
  );
  const { bicycles, bicycle } = resolveBicycle(
    state,
    input,
    station.id,
    nowIso,
  );

  const id = customerRentalId(input.orderId);
  const rental: EasyRideRental = {
    id,
    customerName: input.customerName,
    bicycleId: bicycle.id,
    bicycleCode: bicycle.code,
    pickupStationId: station.id,
    startedAt,
    returnedAt: null,
    durationMinutes: null,
    amount: input.amount,
    paymentStatus: "paid",
    returnCondition: null,
    returnNotes: null,
    status: "active",
  };

  const rentals = state.rentals.some((r) => r.id === id)
    ? state.rentals.map((r) => (r.id === id ? rental : r))
    : [rental, ...state.rentals];

  const activity: EasyRideActivity = {
    id: uid(),
    message: `Rented ${bicycle.code} to ${input.customerName} from the rider app`,
    createdAt: nowIso,
    kind: "rental",
  };

  writeCustomerRentalMeta(id, {
    orderId: input.orderId,
    bikeId: input.bikeId,
    bikeCode: bicycle.code,
    bikeName: input.bikeName,
    stationName: input.stationName,
    rate: input.rate,
    hours: input.hours,
    phone: input.phone,
  });

  return {
    ...state,
    stations,
    bicycles,
    rentals,
    activity: [activity, ...state.activity],
  };
}

/** Close a rider-app hire inside the shared state. */
export function completeCustomerRental(
  state: EasyRideState,
  rentalId: string,
): EasyRideState {
  if (!state) return state;
  const rental = state.rentals.find((r) => r.id === rentalId);
  if (!rental || rental.status === "completed") return state;

  const nowIso = new Date().toISOString();
  const durationMinutes = Math.max(
    1,
    Math.round((Date.now() - new Date(rental.startedAt).getTime()) / 60_000),
  );

  const activity: EasyRideActivity = {
    id: uid(),
    message: `Returned ${rental.bicycleCode} by ${rental.customerName}`,
    createdAt: nowIso,
    kind: "return",
  };

  return {
    ...state,
    rentals: state.rentals.map((r) =>
      r.id === rentalId
        ? {
            ...r,
            status: "completed",
            returnedAt: nowIso,
            durationMinutes,
          }
        : r,
    ),
    bicycles: state.bicycles.map((b) =>
      b.id === rental.bicycleId
        ? { ...b, status: "available", lastChecked: nowIso }
        : b,
    ),
    activity: [activity, ...state.activity],
  };
}

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------

/**
 * Best-effort start time for a rider-app order that was written before the
 * bridge existed.
 */
function orderStartedAt(order: CustomerOrderRecord): string | undefined {
  if (!order.date) return undefined;
  const parsed = Date.parse(`${order.date} ${order.startTime ?? ""}`);
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
}

/**
 * Bring the shared state in line with the rider-app order list.
 *
 * Hires booked on the rider app are mirrored live, but an order created
 * before the bridge existed (or in a tab that never saw it) would otherwise
 * stay invisible to the station team. This pass re-creates any missing hire
 * and closes hires the rider app has already finished.
 *
 * Returns the same reference when nothing had to change.
 */
export function reconcileCustomerRentals(state: EasyRideState): EasyRideState {
  if (!state) return state;

  const orders = readCustomerOrders();
  if (!orders.length) return state;

  const fleet = readCustomerFleet();
  let next = state;
  let changed = false;

  for (const order of orders) {
    if (!order?.orderId) continue;
    const id = customerRentalId(order.orderId);
    const existing = next.rentals.find((r) => r.id === id);

    if (order.status === "active") {
      if (existing) continue;

      const bike = fleet.find((b) => b.id === order.bikeId);
      const rate = bike?.rate ?? (order.hours ? order.totalAmount / order.hours : 0);

      next = applyCustomerRental(next, {
        orderId: order.orderId,
        bikeId: order.bikeId,
        bikeCode: order.bikeCode || bike?.code || order.bikeId,
        bikeName: order.bikeName || bike?.name || order.bikeCode,
        bikeType: bike?.type ?? "city",
        customerName: order.customerName,
        phone: order.phone,
        stationName: order.station || bike?.station || "Main Campus",
        stationLandmark: KAMPALA_STATIONS.find(
          (s) => s.name === (order.station || bike?.station),
        )?.desc,
        rate,
        hours: order.hours || 1,
        amount: order.totalAmount,
        startedAt: orderStartedAt(order),
      });
      changed = true;
      continue;
    }

    // The rider already finished this trip — close the hire too.
    if (existing && existing.status === "active") {
      next = completeCustomerRental(next, id);
      changed = true;
    }
  }

  return changed ? next : state;
}

// ---------------------------------------------------------------------------
// Rider-app side effects
// ---------------------------------------------------------------------------

/**
 * Mark the rider-app order as returned and free the bike on the rider
 * catalogue. Used when the station team closes the hire from their side.
 */
export function releaseCustomerOrder(orderId: string): void {
  if (typeof window === "undefined" || !orderId) return;

  try {
    const raw = window.localStorage.getItem(CUSTOMER_ORDERS_KEY);
    const orders = raw ? JSON.parse(raw) : [];
    if (Array.isArray(orders) && orders.length) {
      const next = orders.map((o: { orderId?: string; status?: string }) =>
        o.orderId === orderId ? { ...o, status: "completed" } : o,
      );
      window.localStorage.setItem(CUSTOMER_ORDERS_KEY, JSON.stringify(next));
    }
  } catch {
    /* ignore */
  }

  try {
    const raw = window.localStorage.getItem(CUSTOMER_FLEET_KEY);
    const fleet = raw ? JSON.parse(raw) : [];
    if (Array.isArray(fleet) && fleet.length) {
      const meta = readCustomerRentalMeta()[customerRentalId(orderId)];
      const bikeId = meta?.bikeId;
      const next = fleet.map((b: { id?: string; status?: string }) =>
        b.id === bikeId ? { ...b, status: "available" } : b,
      );
      window.localStorage.setItem(CUSTOMER_FLEET_KEY, JSON.stringify(next));
    }
  } catch {
    /* ignore */
  }

  forgetCustomerRentalMeta(customerRentalId(orderId));
}

/** Drop the cached meta for a rental that was closed from the rider app. */
export function forgetCustomerRental(orderId: string): void {
  forgetCustomerRentalMeta(customerRentalId(orderId));
}

// ---------------------------------------------------------------------------
// Rider-app booking
// ---------------------------------------------------------------------------

/** Payment rails offered on the reservation screen. */
export type CustomerPaymentMethod = "mobile_money" | "visa" | "cash";

/** A hire of this many hours or more is billed as a day pass. */
export const DAY_PASS_HOURS = 8;
export const DAY_PASS_DISCOUNT = 0.2;

/**
 * What a hire costs: the hourly rate times the hours, less the day-pass
 * discount for long hires. Shared so the reservation screen and the recorded
 * order never disagree on the amount.
 */
export function hireAmount(rate: number, hours: number): number {
  const duration = Math.max(1, Math.round(hours || 1));
  const gross = Math.max(0, rate) * duration;
  return duration >= DAY_PASS_HOURS ? gross * (1 - DAY_PASS_DISCOUNT) : gross;
}

export interface CustomerBookingInput {
  bike: {
    id: string;
    code: string;
    name: string;
    type: string;
    station: string;
    rate: number;
  };
  hours: number;
  customerName: string;
  phone: string;
  paymentMethod?: CustomerPaymentMethod;
  /** When the rider wants to collect the bike (defaults to now). */
  pickupTime?: string;
}

/** Overwrite the rider-app catalogue held in localStorage. */
export function writeCustomerFleet(fleet: unknown[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CUSTOMER_FLEET_KEY, JSON.stringify(fleet));
  } catch {
    /* storage full or unavailable */
  }
}

/** Overwrite the rider-app order list held in localStorage. */
export function writeCustomerOrders(orders: unknown[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CUSTOMER_ORDERS_KEY, JSON.stringify(orders));
  } catch {
    /* storage full or unavailable */
  }
}

/**
 * Take a booking from the reservation screen.
 *
 * The order is written to the rider-app order list, the bike is marked as
 * borrowed on the rider catalogue and the hire is mirrored into the shared
 * state so the station team sees it straight away.
 *
 * Returns the order that was created together with the updated shared state.
 */
export function bookCustomerBike(
  state: EasyRideState,
  input: CustomerBookingInput,
): { state: EasyRideState; order: CustomerOrderRecord } {
  const hours = Math.max(1, Math.round(input.hours || 1));
  const amount = hireAmount(input.bike.rate, hours);

  const order: CustomerOrderRecord = {
    orderId: `ORD-${Date.now().toString().slice(-6)}`,
    bikeId: input.bike.id,
    bikeCode: input.bike.code,
    bikeName: input.bike.name,
    customerName: input.customerName.trim() || "Atugonza",
    phone: input.phone.trim() || "+256 772 100 200",
    station: input.bike.station,
    hours,
    totalAmount: amount,
    startTime: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    date: new Date().toLocaleDateString(),
    status: "active",
  };

  // The bike is off the road until it is returned.
  const fleet = readCustomerFleet();
  if (fleet.length) {
    writeCustomerFleet(
      fleet.map((b) => (b.id === order.bikeId ? { ...b, status: "rented" } : b)),
    );
  }

  writeCustomerOrders([order, ...readCustomerOrders()]);

  const nextState = applyCustomerRental(state, {
    orderId: order.orderId,
    bikeId: order.bikeId,
    bikeCode: order.bikeCode,
    bikeName: order.bikeName,
    bikeType: input.bike.type,
    customerName: order.customerName,
    phone: order.phone,
    stationName: order.station,
    stationLandmark: KAMPALA_STATIONS.find((s) => s.name === order.station)?.desc,
    rate: input.bike.rate,
    hours,
    amount,
    startedAt: input.pickupTime,
  });

  return { state: nextState, order };
}
