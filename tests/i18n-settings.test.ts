import { describe, expect, it } from "vitest";
import { applyOverrides, flattenMessages } from "@/i18n/overrides";
import { pickSiteLanguages } from "@/i18n/site-languages";
import { alternates } from "@/lib/seo";
import en from "@/features/admin/i18n/en.json";
import si from "@/features/admin/i18n/si.json";
import { ADMIN_MESSAGES } from "@/features/admin/i18n";
import { ADMIN_NAV } from "@/features/admin/navigation";

describe("website languages", () => {
  it("keeps enabled languages, always English, and only an enabled default", () => {
    expect(pickSiteLanguages([{ code: "en" }, { code: "si", isDefault: true }, { code: "de", enabled: false }])).toEqual({ enabled: ["en", "si"], defaultLocale: "si" });
    expect(pickSiteLanguages([{ code: "si" }, { code: "de", enabled: false, isDefault: true }])).toEqual({ enabled: ["en", "si"], defaultLocale: "en" });
    expect(pickSiteLanguages([{ code: "xx" }]).enabled).toEqual(["en"]);
    expect(pickSiteLanguages(null).enabled).toHaveLength(14);
  });

  it("hreflang lists only enabled languages, x-default is the default language", () => {
    const alt = alternates("/tours", "si", { enabled: ["en", "si"], defaultLocale: "si" });
    expect(Object.keys(alt.languages)).toEqual(["en", "si-LK", "x-default"]);
    expect(alt.languages["x-default"]).toMatch(/\/si\/tours$/);
  });
});

describe("UI text overrides", () => {
  const messages = { nav: { tours: "Tours", home: "Home" }, common: { bookNow: "Book now" } };

  it("replaces existing texts only and never changes the structure", () => {
    const out = applyOverrides(messages, { "nav.tours": "චාරිකා", "nav.unknown": "x", nav: "broken", "common.bookNow": "  " });
    expect(out).toEqual({ nav: { tours: "චාරිකා", home: "Home" }, common: { bookNow: "Book now" } });
    expect(messages.nav.tours).toBe("Tours");
  });

  it("flattens messages to dotted keys", () => {
    expect(flattenMessages(messages)).toEqual({ "nav.tours": "Tours", "nav.home": "Home", "common.bookNow": "Book now" });
  });
});

describe("admin panel texts", () => {
  it("Sinhala has every English key, and missing keys would fall back to English", () => {
    const enKeys = Object.keys(flattenMessages(en));
    expect(Object.keys(flattenMessages(si)).sort()).toEqual(enKeys.sort());
    expect(Object.keys(flattenMessages(ADMIN_MESSAGES.si))).toHaveLength(enKeys.length);
  });

  it("every sidebar label has a translation", () => {
    const labels = ADMIN_NAV.flatMap((g) => [g.label, ...(g.children ?? []).map((c) => c.label)]);
    expect(labels.filter((l) => !(l in en.nav))).toEqual([]);
  });
});
