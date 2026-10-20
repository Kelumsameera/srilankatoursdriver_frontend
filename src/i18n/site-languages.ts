import { SERVER_API_URL } from "@/lib/config";
import { defaultLocale as fallbackDefault, isLocale, locales, type Locale } from "./routing";

/** The languages a visitor can use (Admin → Translations → Languages) and the default one. */
export interface SiteLanguages {
  enabled: Locale[];
  defaultLocale: Locale;
}

const ALL: SiteLanguages = { enabled: [...locales], defaultLocale: fallbackDefault };

/** Turns the public /languages rows into SiteLanguages. English is always kept, unknown codes are ignored. */
export function pickSiteLanguages(rows: { code: string; enabled?: boolean; isDefault?: boolean }[] | null | undefined): SiteLanguages {
  if (!rows?.length) return ALL;
  const enabled = rows.filter((r) => r.enabled !== false && isLocale(r.code)).map((r) => r.code as Locale);
  if (!enabled.includes("en")) enabled.unshift("en");
  const chosen = rows.find((r) => r.isDefault)?.code;
  return { enabled, defaultLocale: isLocale(chosen) && enabled.includes(chosen) ? chosen : fallbackDefault };
}

// The proxy runs on every page request, so the answer is kept in memory for a minute.
const CACHE_MS = 60_000;
let cached: { at: number; value: SiteLanguages } | null = null;

/** Enabled + default language for the proxy. If the API cannot be reached, every language stays available. */
export async function siteLanguages(): Promise<SiteLanguages> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;
  try {
    const res = await fetch(`${SERVER_API_URL}/languages`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(String(res.status));
    const body = (await res.json()) as { data?: { code: string; enabled?: boolean; isDefault?: boolean }[] };
    cached = { at: Date.now(), value: pickSiteLanguages(body.data) };
  } catch {
    // Keep the last good answer for another minute; fall back to all languages if there is none.
    cached = { at: Date.now(), value: cached?.value ?? ALL };
  }
  return cached.value;
}
