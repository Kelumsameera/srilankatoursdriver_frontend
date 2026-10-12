import { test, expect } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

// Read-only, real API evidence. Never submits forms or replaces API responses.
const output = path.resolve("test-results/qa-evidence");
const locales = ["en", "si", "ta", "de", "fr", "es", "it", "zh", "ja", "ko", "ru", "ar", "hi", "pt"];
const resolveDependency = createRequire(path.resolve("package.json"));
test("published locale pages, screenshots, SEO and automated accessibility evidence", async ({ page }) => {
  test.setTimeout(180000);
  mkdirSync(output, { recursive: true });
  const results: unknown[] = [];
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const locale of locales) {
    await page.goto(`/${locale}/destinations/colombo-city`);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    results.push(await page.evaluate(() => ({
      locale: document.documentElement.lang, dir: document.documentElement.dir,
      heading: document.querySelector("h1")?.textContent,
      canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
      alternates: Array.from(document.querySelectorAll<HTMLLinkElement>('link[hreflang]')).map(link => ({ locale: link.hreflang, href: link.href })),
      ogTitle: document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content,
      jsonLd: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(script => JSON.parse(script.textContent || "{}")),
      brokenImages: Array.from(document.images).filter(img => img.complete && img.naturalWidth === 0).map(img => img.currentSrc),
    })));
  }
  const accessibility: unknown[] = [];
  for (const [name, route, width] of [
    ["home-desktop", "/en", 1440], ["home-mobile", "/en", 390],
    ["destination-desktop", "/en/destinations/colombo-city", 1440],
    ["destination-mobile", "/en/destinations/colombo-city", 390],
    ["home-landscape", "/en", 844],
  ] as const) {
    await page.setViewportSize({ width, height: name.includes("landscape") ? 390 : 1000 });
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
    await page.addScriptTag({ content: readFileSync(resolveDependency.resolve("axe-core/axe.min.js"), "utf8") });
    accessibility.push(await page.evaluate(async (label) => {
      const axe = (window as unknown as { axe: { run: (context: string, options: unknown) => Promise<{ violations: unknown[] }> } }).axe;
      const result = await axe.run("main", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } });
      return { page: label, violations: result.violations, overflow: document.documentElement.scrollWidth > innerWidth };
    }, name));
    // Real keyboard movement: check focus lands on a usable visible element.
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en");
  await expect(page.locator(".homepage-hero video")).not.toHaveAttribute("src");
  await page.screenshot({ path: path.join(output, "hero-poster-fallback.png"), fullPage: false });
  writeFileSync(path.join(output, "browser-evidence.json"), JSON.stringify({ results, accessibility, pageErrors: errors }, null, 2));
  expect(errors).toEqual([]);
  for (const result of accessibility as { page: string; violations: unknown[]; overflow: boolean }[]) {
    expect(result.violations, result.page).toEqual([]);
    expect(result.overflow, result.page).toBe(false);
  }
});
