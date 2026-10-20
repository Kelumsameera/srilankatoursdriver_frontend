import { getRequestConfig } from "next-intl/server";
import { IntlErrorCode } from "next-intl";
import { getUiMessages } from "@/lib/api/server";
import { defaultLocale, isLocale } from "./routing";
import { applyOverrides, type Messages } from "./overrides";

/** Locale messages layered over English, so a key missing from a translation falls back instead of breaking the page. */
function withFallback(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [k, v] of Object.entries(override)) {
    const b = base[k];
    out[k] = v && typeof v === "object" && b && typeof b === "object" ? withFallback(b, v) : v;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : defaultLocale;
  const english = (await import("../../messages/en.json")).default as Messages;
  const bundled = locale === defaultLocale ? english : withFallback(english, (await import(`../../messages/${locale}.json`)).default as Messages);
  // Texts edited in Admin → Translations → UI texts win over the bundled files.
  const messages = applyOverrides(bundled, await getUiMessages(locale));
  return {
    locale,
    messages,
    timeZone: "Asia/Colombo",
    // A key missing in English too renders its last segment rather than throwing; only log it during development.
    onError(error) {
      if (error.code !== IntlErrorCode.MISSING_MESSAGE || process.env.NODE_ENV !== "production") console.error(error);
    },
    getMessageFallback({ key }) {
      return key.split(".").pop() ?? key;
    },
  };
});
