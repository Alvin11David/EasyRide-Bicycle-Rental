/**
 * Metadata for bicycles registered by staff through the "Add Bike" screen.
 *
 * The seeded fleet keeps its model names, photos and specs in a static map.
 * A bicycle added at runtime needs somewhere to live as well — there is no
 * backend here, so the extra entries are kept in localStorage and picked up
 * by `getBikeMeta`.
 */

export interface CustomBikeMeta {
  modelName: string;
  type: string;
  image: string;
  specs: {
    range?: string;
    speed?: string;
    gears?: string;
    weight?: string;
    power?: string;
    highlight: string;
  };
}

export const CUSTOM_BIKE_META_KEY = "easyride_custom_bike_meta_v1";

/** Every bike registered through the staff console. */
export function readCustomBikeMeta(): Record<string, CustomBikeMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CUSTOM_BIKE_META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Store (or replace) the metadata of a single bicycle. */
export function saveCustomBikeMeta(id: string, meta: CustomBikeMeta): void {
  if (typeof window === "undefined" || !id) return;
  try {
    const all = readCustomBikeMeta();
    all[id] = meta;
    window.localStorage.setItem(CUSTOM_BIKE_META_KEY, JSON.stringify(all));
  } catch {
    /* storage full or unavailable — the bike still joins the fleet */
  }
}
