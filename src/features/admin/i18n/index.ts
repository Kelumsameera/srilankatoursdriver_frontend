import en from "./en.json";
import si from "./si.json";

/** Languages the admin panel itself can be shown in (the website has its own list). */
export const ADMIN_LOCALES = ["en", "si"] as const;
export type AdminLocale = (typeof ADMIN_LOCALES)[number];
export const ADMIN_LOCALE_NAMES: Record<AdminLocale, string> = { en: "English", si: "සිංහල" };

/** Cookie that remembers the admin language (set by the switcher in the admin top bar). */
export const ADMIN_LOCALE_COOKIE = "admin_lang";

export const isAdminLocale = (v: unknown): v is AdminLocale => typeof v === "string" && (ADMIN_LOCALES as readonly string[]).includes(v);

type Messages = { [key: string]: string | Messages };

/** Sinhala layered over English, so an untranslated admin text shows in English instead of breaking. */
function withFallback(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [k, v] of Object.entries(override)) {
    const b = base[k];
    out[k] = typeof v === "object" && b && typeof b === "object" ? withFallback(b, v) : v;
  }
  return out;
}

export const ADMIN_MESSAGES: Record<AdminLocale, Messages> = { en, si: withFallback(en, si) };
