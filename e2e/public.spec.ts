import { expect, test } from "@playwright/test";

test.describe("public website", () => {
  test("homepage renders CMS content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator('[data-section="popularTours"]')).toBeVisible();
    await expect(page.getByTestId("whatsapp-float")).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+/);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
  });

  test("language switch changes locale, URL and direction", async ({ page, isMobile }) => {
    await page.goto("/en/tours");
    if (isMobile) await page.goto("/ar/tours");
    else {
      await page.getByTestId("language-switcher").first().click();
      await page.getByRole("option", { name: "Deutsch" }).click();
      await expect(page).toHaveURL(/\/de\/tours/);
      await expect(page.locator("html")).toHaveAttribute("lang", "de");
      await page.goto("/ar/tours");
    }
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("tours list → tour detail", async ({ page }) => {
    await page.goto("/en/tours");
    const first = page.getByTestId("tour-list").locator("article").first();
    await first.getByRole("heading").getByRole("link").click();
    await expect(page).toHaveURL(/\/en\/tours\/[a-z0-9-]+$/);
    await expect(page.getByTestId("tour-title")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Itinerary" })).toBeVisible();
  });

  test("booking form validates and submits", async ({ page }) => {
    await page.goto("/en/booking");
    const form = page.getByTestId("booking-form");
    await form.getByRole("button", { name: /send booking request/i }).click();
    await expect(form.getByRole("alert").first()).toBeVisible();
    await form.getByLabel("Full name").fill("E2E Guest");
    await form.getByLabel("Email").fill("e2e.guest@example.com");
    const d = new Date(Date.now() + 40 * 86_400_000).toISOString().slice(0, 10);
    await form.getByLabel("Start date").fill(d);
    await form.getByRole("button", { name: /send booking request/i }).click();
    await expect(page.getByText(/Your reference: SLTD-B-/)).toBeVisible();
  });

  test("tailor-made multi-step form submits", async ({ page }) => {
    await page.goto("/en/tailor-made-tours");
    const form = page.getByTestId("tailor-made-form");
    const next = () => form.getByRole("button", { name: "Next" }).click();
    await form.getByLabel("First name").fill("E2E");
    await form.getByLabel("Email").fill("e2e.tm@example.com");
    await next();
    await form.getByLabel("Arrival date").fill(new Date(Date.now() + 50 * 86_400_000).toISOString().slice(0, 10));
    await form.getByLabel("Departure date").fill(new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10));
    await next(); // travellers
    for (let i = 0; i < 9; i++) {
      await next(); // travellers → arrival … requirements → review
      await expect(page.getByText(`Step ${i + 4} of 12`)).toBeVisible();
    }
    await expect(form.getByRole("heading", { name: "Review & submit" })).toBeVisible();
    await expect(form.getByRole("button", { name: "Send my enquiry" })).toBeVisible();
    await form.getByRole("button", { name: "Send my enquiry" }).click();
    await expect(page.getByText(/Your reference: SLTD-T-/)).toBeVisible();
  });

  test("unknown pages return 404", async ({ page }) => {
    const res = await page.goto("/en/this-page-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("404")).toBeVisible();
  });

  test("sitemap and robots", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain('hreflang="de"');
    expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /admin");
  });
});
