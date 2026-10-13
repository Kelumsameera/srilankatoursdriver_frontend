import { test, expect } from "@playwright/test";

/** Read-only tests. Start the real backend via scripts/qa-readonly.ts and Next.js first.
 * These tests never submit customer/Admin forms or modify CMS data. */
const destinationSlug = process.env.E2E_DESTINATION_SLUG || "colombo-city";
const widths = [320, 375, 390, 430, 768, 1024, 1440];

for (const width of widths) {
  test(`homepage and destination have no overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    for (const route of ["/en", `/en/destinations/${destinationSlug}`]) {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if (route.includes("destinations")) await expect(page.getByTestId("destination-map")).toBeVisible();
    }
  });
}

test("muted inline hero playback advances, pauses, resumes and switches source", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en");
  await page.locator(".homepage-hero").hover(); // hold carousel position; video playback is independent
  const video = page.locator(".homepage-hero video");
  await expect(video).toHaveCount(1);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 30000 }).toBeGreaterThan(0);
  expect(await video.evaluate((v: HTMLVideoElement) => ({ muted: v.muted, inline: v.playsInline, loop: v.loop, paused: v.paused }))).toEqual({ muted: true, inline: true, loop: true, paused: false });
  await page.getByRole("button", { name: "Pause background video", exact: true }).click();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await expect(video).toHaveCount(1); // pause retains the video element
  await page.getByRole("button", { name: "Play background video", exact: true }).click();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);
  const before = await video.getAttribute("src");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(video).not.toHaveAttribute("src", before!);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 30000 }).toBeGreaterThan(0);
});

test("reduced motion keeps a poster without video downloads until a user requests playback", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  const video = page.locator(".homepage-hero video");
  await expect(video).not.toHaveAttribute("src");
  await expect(page.locator(".homepage-hero picture img")).toBeVisible();
  await page.getByRole("button", { name: "Play background video", exact: true }).click();
  await expect(video).toHaveAttribute("src", /vc_h264,f_mp4/);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 30000 }).toBeGreaterThan(0);
});

test("rejected autoplay keeps the poster and does not retry automatically", async ({ page }) => {
  await page.addInitScript(() => {
    let attempts = 0;
    HTMLMediaElement.prototype.play = function () {
      document.documentElement.dataset.qaPlayAttempts = String(++attempts);
      return Promise.reject(new DOMException("QA simulated autoplay policy", "NotAllowedError"));
    };
  });
  await page.goto("/en");
  await page.locator(".homepage-hero").hover();
  await expect(page.locator(".homepage-hero video")).toHaveAttribute("data-playback-status", "blocked");
  await expect(page.locator(".homepage-hero picture img")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play background video", exact: true })).toBeVisible();
  const attempts = await page.locator("html").getAttribute("data-qa-play-attempts");
  await page.waitForTimeout(1000); // deliberately check that policy rejection does not start a retry loop
  expect(await page.locator("html").getAttribute("data-qa-play-attempts")).toBe(attempts);
});

test("media network failure preserves the poster and main CTA", async ({ page }) => {
  await page.route("**/video/upload/**", (route) => route.request().resourceType() === "media" ? route.abort("failed") : route.continue());
  await page.goto("/en");
  await page.locator(".homepage-hero").hover();
  await expect(page.locator(".homepage-hero video")).toHaveAttribute("data-playback-status", "error");
  await expect(page.locator(".homepage-hero picture img")).toBeVisible();
  await expect(page.locator(".homepage-hero").getByRole("link", { name: "Explore tours", exact: true })).toBeVisible();
});

test("Arabic destination preserves north-up geography and localized labels", async ({ page }) => {
  await page.goto(`/ar/destinations/${destinationSlug}`);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByTestId("destination-map")).toHaveAttribute("aria-label", /سريلانكا/);
});
