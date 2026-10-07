import { expect, test, type APIRequestContext } from "@playwright/test";
import { ADMIN, adminApi, apiJson, expectEventually, loginUi, unique } from "./helpers";

/**
 * Critical acceptance tests (spec §51): everything below is changed through the admin
 * and must appear on the public website without touching source code.
 */
test.describe.serial("admin CRM/CMS acceptance", () => {
  let api: APIRequestContext;
  let original: Record<string, unknown>;
  let originalBranding: Record<string, unknown>;
  const created: { path: string }[] = [];

  test.beforeAll(async () => {
    api = await adminApi();
    original = await apiJson(api, "get", "/admin/site-settings");
    originalBranding = await apiJson(api, "get", "/admin/branding");
  });

  test.afterAll(async () => {
    if (!api || !original) return;
    // Restore settings & remove test content so the suite is repeatable.
    const s = original as Record<string, unknown> & { footer: Record<string, unknown> };
    await apiJson(api, "put", "/admin/site-settings", {
      siteName: s.siteName,
      whatsapp: s.whatsapp,
      email: s.email,
      footer: { copyright: s.footer.copyright, description: s.footer.description },
    });
    await apiJson(api, "put", "/admin/branding", { primaryLogo: originalBranding.primaryLogo ?? null, lightLogo: originalBranding.lightLogo ?? null });
    for (const c of created.reverse()) await api.delete(c.path.replace(/^\//, ""));
    await api.dispose();
  });

  test("admin login & dashboard", async ({ page }) => {
    await loginUi(page);
    await expect(page.getByTestId("dashboard-cards")).toContainText("Total Tours");
  });

  test("rejects wrong password", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("Test 1–3: site name, WhatsApp and email update everywhere", async ({ page }) => {
    const siteName = unique("E2E Site");
    await loginUi(page);
    await page.goto("/admin/settings");
    await page.locator("#f-siteName").fill(siteName);
    await page.locator("#f-whatsapp").fill("+94 77 000 1111");
    await page.locator("#f-email").fill("e2e-contact@example.com");
    await page.getByTestId("save-button").click();
    await expect(page.getByText(/Saved/)).toBeVisible();

    await expectEventually(page, "/en/contact", async (p) => {
      await expect(p).toHaveTitle(new RegExp(siteName));
      await expect(p.getByTestId("whatsapp-float")).toHaveAttribute("href", /wa\.me\/94770001111/);
      await expect(p.getByTestId("footer-whatsapp")).toHaveAttribute("href", /wa\.me\/94770001111/);
      await expect(p.getByTestId("contact-email")).toHaveText("e2e-contact@example.com");
      await expect(p.getByTestId("footer-email")).toHaveText("e2e-contact@example.com");
    });
  });

  test("Test 4: logo from branding shows in navbar and footer", async ({ page }) => {
    // Uses an existing Cloudinary URL so the test also works without Cloudinary credentials.
    const logo = { publicId: "srilankatoursdriver/branding/e2e", url: "https://res.cloudinary.com/demo/image/upload/sample.png", resourceType: "image", width: 300, height: 100, alt: "E2E logo" };
    await apiJson(api, "put", "/admin/branding", { primaryLogo: logo, lightLogo: logo, logoAlt: "E2E logo" });
    await expectEventually(page, "/en", async (p) => {
      await expect(p.locator("header img[alt='E2E logo']").first()).toHaveAttribute("src", /res\.cloudinary\.com\/demo\/image\/upload\/.*sample\.png/);
      await expect(p.locator("footer img[alt='E2E logo']")).toHaveCount(1);
    });
  });

  test("Test 5 & 6: create and edit a tour in the admin", async ({ page }) => {
    const title = unique("E2E Tour");
    await loginUi(page);
    await page.goto("/admin/content/tours/new");
    await page.locator("#f-title").fill(title);
    await page.locator("#f-shortDescription").fill("Created by the end-to-end test.");
    await page.locator("#f-status").selectOption("published");
    await page.getByTestId("save-button").click();
    await expect(page).toHaveURL(/\/admin\/content\/tours\/[a-f0-9]{24}$/);
    const id = page.url().split("/").pop()!;
    created.push({ path: `/admin/tours/${id}` });
    const tour = await apiJson<{ slug: string }>(api, "get", `/admin/tours/${id}`);

    await expectEventually(page, "/en/tours", async (p) => {
      await expect(p.getByTestId("tour-list")).toContainText(title);
    });

    await page.goto(`/admin/content/tours/${id}`);
    await page.locator("#f-shortDescription").fill("Edited by the end-to-end test.");
    await page.getByTestId("save-button").click();
    await expect(page.getByText(/Saved/)).toBeVisible();
    await expectEventually(page, `/en/tours/${tour.slug}`, async (p) => {
      await expect(p.getByText("Edited by the end-to-end test.").first()).toBeVisible();
    });
  });

  test("Test 7: gallery item appears in public gallery", async ({ page }) => {
    const title = unique("E2E Photo");
    const item = await apiJson<{ _id: string }>(api, "post", "/admin/gallery", {
      title,
      status: "published",
      media: { publicId: "srilankatoursdriver/gallery/e2e", url: "https://res.cloudinary.com/demo/image/upload/sample.jpg", resourceType: "image", width: 864, height: 576 },
    });
    created.push({ path: `/admin/gallery/${item._id}` });
    await expectEventually(page, "/en/gallery", async (p) => {
      await expect(p.getByTestId("gallery-grid").getByRole("button", { name: title })).toBeVisible();
    });
  });

  test("Test 8: new destination appears publicly", async ({ page }) => {
    const name = unique("E2E Destination");
    await loginUi(page);
    await page.goto("/admin/content/destinations/new");
    await page.locator("#f-name").fill(name);
    await page.locator("#f-region").fill("Test Province");
    await page.locator("#f-status").selectOption("published");
    await page.getByTestId("save-button").click();
    await expect(page).toHaveURL(/\/admin\/content\/destinations\/[a-f0-9]{24}$/);
    created.push({ path: `/admin/destinations/${page.url().split("/").pop()}` });
    await expectEventually(page, "/en/destinations", async (p) => {
      await expect(p.getByTestId("destination-list")).toContainText(name);
    });
  });

  test("Test 9: homepage hero edit", async ({ page }) => {
    const slides = await apiJson<{ _id: string; title: string }[]>(api, "get", "/admin/hero");
    const hero = slides[0];
    const title = unique("E2E Hero");
    await loginUi(page);
    await page.goto(`/admin/content/hero/${hero._id}`);
    await page.locator("#f-title").fill(title);
    await page.getByTestId("save-button").click();
    await expect(page.getByText(/Saved/)).toBeVisible();
    try {
      await expectEventually(page, "/en", async (p) => {
        await expect(p.getByRole("heading", { level: 1, name: title })).toBeVisible();
      });
    } finally {
      await apiJson(api, "put", `/admin/hero/${hero._id}`, { title: hero.title });
    }
  });

  test("Test 10: footer content", async ({ page }) => {
    const text = unique("© E2E footer");
    await loginUi(page);
    await page.goto("/admin/footer");
    await page.locator("#f-footer-copyright").fill(text);
    await page.getByTestId("save-button").click();
    await expect(page.getByText(/Saved/)).toBeVisible();
    await expectEventually(page, "/en/faqs", async (p) => {
      await expect(p.getByTestId("footer-copyright")).toHaveText(text);
    });
  });

  test("homepage sections can be disabled and re-enabled", async ({ page }) => {
    await loginUi(page);
    await page.goto("/admin/pages/home");
    const list = page.getByTestId("section-list");
    await expect(list).toBeVisible();
    const row = list.locator("li").filter({ hasText: "Why choose us" }).first();
    await row.getByRole("button", { name: "Disable" }).click();
    await expect(row.getByText("disabled")).toBeVisible();
    await expectEventually(page, "/en", async (p) => {
      await expect(p.locator('[data-section="whyChooseUs"]')).toHaveCount(0);
    });
    await page.goto("/admin/pages/home");
    await page.getByTestId("section-list").locator("li").filter({ hasText: "Why choose us" }).first().getByRole("button", { name: "Enable" }).click();
    await expectEventually(page, "/en", async (p) => {
      await expect(p.locator('[data-section="whyChooseUs"]')).toHaveCount(1);
    });
  });

  test("blog post & review moderation", async ({ page }) => {
    const title = unique("E2E Post");
    const post = await apiJson<{ _id: string; slug: string }>(api, "post", "/admin/blog", { title, status: "published", content: "## Hello\nFrom the E2E test." });
    created.push({ path: `/admin/blog/${post._id}` });
    await expectEventually(page, "/en/blog", async (p) => {
      await expect(p.getByText(title)).toBeVisible();
    });

    const guest = unique("E2E Reviewer");
    const pub = await page.request.post(`${(process.env.E2E_API_URL ?? "http://localhost:5000/api").replace(/\/$/, "")}/reviews`, {
      data: { guestName: guest, email: "r@example.com", rating: 5, review: "Wonderful trip, our driver was fantastic and friendly." },
    });
    expect(pub.ok()).toBeTruthy();
    const pending = await apiJson<{ _id: string; guestName: string }[]>(api, "get", `/admin/reviews?status=pending&search=${encodeURIComponent(guest)}`);
    created.push({ path: `/admin/reviews/${pending[0]._id}` });
    await loginUi(page);
    await page.goto("/admin/content/reviews");
    await page.getByRole("row", { name: new RegExp(guest) }).getByRole("button", { name: "Publish" }).click();
    await expectEventually(page, "/en/reviews", async (p) => {
      await expect(p.getByText(guest)).toBeVisible();
    });
  });

  test("bookings CRM: status change and note", async ({ page }) => {
    const bookings = await apiJson<{ _id: string }[]>(api, "get", "/admin/bookings?search=e2e.guest@example.com");
    test.skip(bookings.length === 0, "run public.spec first to create a booking");
    await loginUi(page);
    await page.goto(`/admin/bookings/${bookings[0]._id}`);
    await page.getByTestId("crm-status").selectOption("contacted");
    await expect(page.getByText("Status → contacted")).toBeVisible();
    await page.getByLabel("New note").fill("Called the guest (E2E).");
    await page.getByRole("button", { name: "Add note" }).click();
    await expect(page.getByText("Called the guest (E2E).")).toBeVisible();
  });
});
