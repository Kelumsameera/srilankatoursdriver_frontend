import { flattenMessages, type Messages } from "@/i18n/overrides";

/** The website's bundled UI texts for one language, flattened to { "nav.tours": "Tours" } (admin UI texts page). */
export async function bundledMessages(locale: string): Promise<Record<string, string>> {
  const mod = (await import(`../../../messages/${locale}.json`)) as { default: Messages };
  return flattenMessages(mod.default);
}
