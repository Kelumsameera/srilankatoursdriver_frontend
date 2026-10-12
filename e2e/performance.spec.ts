import { test, expect } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

test("real hero sources and local timing evidence", async ({ page }) => {
  test.setTimeout(120000);
  await page.addInitScript(() => {
    const evidence = { lcp: 0, cls: 0 };
    (window as unknown as { qaTiming: typeof evidence }).qaTiming = evidence;
    new PerformanceObserver(list => { for (const entry of list.getEntries()) evidence.lcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver(list => {
      for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[]) if (!entry.hadRecentInput) evidence.cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  const results: unknown[] = [];
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const started = Date.now();
    await page.goto("/en");
    await page.locator(".homepage-hero").hover();
    const video = page.locator(".homepage-hero video");
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 30000 }).toBeGreaterThan(0);
    const startupMs = Date.now() - started;
    const slides: unknown[] = [];
    for (let index = 0; index < 4; index++) {
      await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 30000 }).toBeGreaterThan(0);
      slides.push(await video.evaluate((v: HTMLVideoElement) => ({ src: v.currentSrc, currentTime: v.currentTime, paused: v.paused, readyState: v.readyState, error: v.error?.code ?? null })));
      if (index < 3) await page.getByRole("button", { name: "Next", exact: true }).click();
    }
    results.push({ width, startupMs, slides, timing: await page.evaluate(() => ({
      ...(window as unknown as { qaTiming: { lcp: number; cls: number } }).qaTiming,
      resources: performance.getEntriesByType("resource").filter(entry => entry.name.includes("cloudinary")).map(entry => ({ name: entry.name, duration: entry.duration, transferSize: (entry as PerformanceResourceTiming).transferSize })),
    })) });
    await page.screenshot({ path: path.resolve(`test-results/qa-evidence/home-hero-${width}.png`) });
  }
  mkdirSync(path.resolve("test-results/qa-evidence"), { recursive: true });
  writeFileSync(path.resolve("test-results/qa-evidence/local-performance.json"), JSON.stringify({ runtime: process.env.QA_RUNTIME || "unspecified", note: "Single local Chromium run. LCP/CLS are page-entry observations through slide switching; not field CWV. Cross-origin transferSize=0 can mean unavailable. No INP measured.", results }, null, 2));
});
