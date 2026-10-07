import { defineRouting } from "next-intl/routing";

export const locales = ["en", "si", "ta", "de", "fr", "es", "it", "zh", "ja", "ko", "ru", "ar", "hi", "pt"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const rtlLocales: Locale[] = ["ar"];

export const localeNames: Record<Locale, string> = {
  en: "English",
  si: "සිංහල",
  ta: "தமிழ்",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  zh: "简体中文",
  ja: "日本語",
  ko: "한국어",
  ru: "Русский",
  ar: "العربية",
  hi: "हिन्दी",
  pt: "Português",
};

/** BCP-47 tags used for hreflang / OpenGraph. */
export const localeTags: Record<Locale, string> = {
  en: "en",
  si: "si-LK",
  ta: "ta-LK",
  de: "de",
  fr: "fr",
  es: "es",
  it: "it",
  zh: "zh-CN",
  ja: "ja",
  ko: "ko",
  ru: "ru",
  ar: "ar",
  hi: "hi",
  pt: "pt",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});
