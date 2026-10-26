import type { Tour } from "@/types/cms";

// Seasonal package months – keep in sync with seasonalTourCategories() in backend/src/services/public.service.ts
const SEASON_MONTHS: Record<string, [number, number]> = { "east-coast-tours": [7, 10], "down-south-tours": [11, 6] };

// The month (1–12) in Sri Lanka now
export function colomboMonth(now = new Date()) {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Colombo", month: "numeric" }).format(now));
}

// Is month (1–12) inside [from, to]? Ranges may run over New Year (November – June).
export function monthInRange(month: number, [from, to]: [number, number]) {
  return from <= to ? month >= from && month <= to : month >= from || month <= to;
}

// Slug of the seasonal category in season now (Sri Lanka time), e.g. "east-coast-tours" in August
export function inSeasonCategory(now = new Date()) {
  const month = colomboMonth(now);
  return Object.keys(SEASON_MONTHS).find((slug) => monthInRange(month, SEASON_MONTHS[slug]));
}

/** Seasonal package categories first (the one in season now leads), then the rest in their own order. */
export function seasonFirst<T extends { slug: string }>(categories: T[], now = new Date()) {
  const inSeason = inSeasonCategory(now);
  const rank = (slug: string) => (slug === inSeason ? 0 : slug in SEASON_MONTHS ? 1 : 2);
  return [...categories].sort((a, b) => rank(a.slug) - rank(b.slug));
}

/** First and last month of a seasonal tour's season, e.g. [7, 10]; undefined for other tours. */
export function seasonRange(tour: Tour | undefined) {
  return tour?.category?.slug ? SEASON_MONTHS[tour.category.slug] : undefined;
}

// Intl gives the traditional Sinhala names (ඇසළ, වප් …); visitors know the everyday Gregorian ones
const SI_MONTHS = ["ජනවාරි", "පෙබරවාරි", "මාර්තු", "අප්‍රේල්", "මැයි", "ජූනි", "ජූලි", "අගෝස්තු", "සැප්තැම්බර්", "ඔක්තෝබර්", "නොවැම්බර්", "දෙසැම්බර්"];

/** January–December as short ("Jul") and one-letter ("J") labels in the page's language. */
export function monthLabels(locale: string) {
  const at = (m: number) => new Date(Date.UTC(2026, m, 15));
  const short = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
  const narrow = new Intl.DateTimeFormat(locale, { month: "narrow", timeZone: "UTC" });
  const months = Array.from({ length: 12 }, (_, m) => m);
  if (locale === "si") return { short: SI_MONTHS, narrow: SI_MONTHS.map((name) => Array.from(new Intl.Segmenter("si").segment(name))[0].segment) };
  return { short: months.map((m) => short.format(at(m))), narrow: months.map((m) => narrow.format(at(m))) };
}

// "July – October" in the page's language
export function seasonMonths(tour: Tour | undefined, locale: string) {
  const range = seasonRange(tour);
  if (!range) return undefined;
  const month = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" });
  const name = (m: number) => (locale === "si" ? SI_MONTHS[m - 1] : month.format(new Date(Date.UTC(2026, m - 1, 15))));
  return range.map(name).join(" – ");
}
