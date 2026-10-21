/**
 * Small shared formatting helpers used by the guest, rider and staff surfaces.
 * Kept in one place so the dashboards stay consistent with each other.
 */

export const uid = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const when = () => new Date().toISOString();

export const niceDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-UG", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

export const money = (amount: number, currency: string) =>
  `${currency} ${Number(amount || 0).toLocaleString("en-UG", {
    maximumFractionDigits: 0,
  })}`;

export const textCase = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const clockTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleTimeString("en-UG", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : "—";

export const initials = (name?: string | null) =>
  (name || "ER")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "ER";
