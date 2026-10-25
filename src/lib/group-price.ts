import type { GroupPrice } from "@/types/cms";

/** The price-list row for exactly this many travellers – same rule as backend/src/utils/group-price.ts. */
export function groupPriceFor(rows: GroupPrice[] | undefined, persons: number): GroupPrice | undefined {
  if (!rows?.length || !Number.isFinite(persons) || persons < 1) return undefined;
  return rows.find((r) => r.persons === persons);
}

/** Largest group the price list covers (0 when there is no list). */
export function maxGroupSize(rows: GroupPrice[] | undefined): number {
  return rows?.length ? Math.max(...rows.map((r) => r.persons)) : 0;
}

/** Last day of a trip that starts on `start` (yyyy-mm-dd) and lasts `days` days. */
export function tripEndDate(start: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !(days >= 1)) return "";
  const date = new Date(`${start}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  date.setUTCDate(date.getUTCDate() + days - 1);
  return date.toISOString().slice(0, 10);
}
