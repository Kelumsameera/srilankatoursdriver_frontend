import { expect, request, test, type APIRequestContext } from "@playwright/test";
import { ADMIN, API_URL, adminApi, apiJson, expectEventually, loginUi, unique } from "./helpers";

test.describe.serial("admin modules", () => {
  let api: APIRequestContext;
  const cleanup: string[] = [];

  test.beforeAll(async () => {
    api = await adminApi();
  });
  test.afterAll(async () => {
    if (!api) return;
    for (const p of cleanup.reverse()) await api.delete(p.replace(/^\//, ""));
    await api.dispose();
  });

  test("unauthenticated users are sent to login; logout ends the session", async ({ page }) => {
    await page.goto("/admin/content/tours");
    await expect(page).toHaveURL(/\/admin\/login/);
    await loginUi(page);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("protected admin APIs reject anonymous and under-privileged users", async () => {
    const anon = await request.newContext({ baseURL: `${API_URL}/` });
    expect((await anon.get("admin/tours")).status()).toBe(401);
    expect((await anon.put("admin/site-settings", { data: { siteName: "x" } })).status()).toBe(401);

    const roles = await apiJson<{ _id: string; name: string }[]>(api, "get", "/admin/roles");
    const editorRole = roles.find((r) => r.name === "Editor")!;
    const email = `e2e-editor-${Date.now()}@example.com`;
    const user = await apiJson<{ _id: string }>(api, "post", "/admin/users", { name: "E2E Editor", email, password: "EditorPassw0rd", role: editorRole._id });
    cleanup.push(`/admin/users/${user._id}`);

    const editor = await request.newContext({ baseURL: `${API_URL}/` });
    expect((await editor.post("auth/login", { data: { email, password: "EditorPassw0rd" } })).ok()).toBeTruthy();
    const tours = await (await editor.get("admin/tours")).json();
    expect(tours.success).toBe(true);
    expect((await editor.delete(`admin/tours/${tours.data[0]._id}`)).status()).toBe(403);
    expect((await editor.put("admin/site-settings", { data: { siteName: "hacked" } })).status()).toBe(403);
    expect((await editor.get("admin/users")).status()).toBe(403);
    // Refresh rotates the session cookie and keeps working.
    expect((await editor.post("auth/refresh")).ok()).toBeTruthy();
    expect((await editor.get("auth/me")).ok()).toBeTruthy();
    await editor.post("auth/logout");
    expect((await editor.get("admin/tours")).status()).toBe(401);
    await anon.dispose();
    await editor.dispose();
  });

  test("navbar: add, rename, disable and delete a menu item", async ({ page }) => {
    const label = unique("E2E Menu");
    await loginUi(page);
    await page.goto("/admin/content/navigation/new");
    await page.locator("#f-label").fill(label);
    await page.locator("#f-url").fill("/faqs");
    await page.getByTestId("save-button").click();
    await expect(page).toHaveURL(/\/admin\/content\/navigation\/[a-f0-9]{24}$/);
    const id = page.url().split("/").pop()!;
    cleanup.push(`/admin/navigation/${id}`);
    await expectEventually(page, "/en", async (p) => {
      await expect(p.getByRole("navigation", { name: "Main" }).getByRole("link", { name: label })).toBeVisible();
    });

    await page.goto(`/admin/content/navigation/${id}`);
    await page.locator("#f-label").fill(`${label} renamed`);
    await page.getByTestId("save-button").click();
    await expect(page.getByText(/Saved/)).toBeVisible();
    await expectEventually(page, "/en", async (p) => {
      await expect(p.getByRole("navigation", { name: "Main" }).getByRole("link", { name: `${label} renamed` })).toBeVisible();
    });

    await apiJson(api, "patch", `/admin/navigation/${id}/status`, { enabled: false });
    await expectEventually(page, "/en", async (p) => {
      await expect(p.getByRole("navigation", { name: "Main" }).getByRole("link", { name: `${label} renamed` })).toHaveCount(0);
    });

    await page.goto("/admin/content/navigation");
    await page.getByRole("row", { name: new RegExp(`${label} renamed`) }).getByRole("button", { name: "Delete" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("row", { name: new RegExp(`${label} renamed`) })).toHaveCount(0);
    cleanup.pop();
  });

  test("excursions: create with category, publish, view detail, unpublish, delete", async ({ page }) => {
    const title = unique("E2E Excursion");
    await loginUi(page);
    await page.goto("/admin/content/excursions/new");
    await page.locator("#f-title").fill(title);
    await page.locator("#f-category").selectOption({ label: "Safari" });
    await page.locator("#f-duration").fill("Half day");
    await page.locator("#f-status").selectOption("published");
    await page.getByTestId("save-button").click();
    await expect(page).toHaveURL(/\/admin\/content\/excursions\/[a-f0-9]{24}$/);
    const id = page.url().split("/").pop()!;
    cleanup.push(`/admin/excursions/${id}`);
    const ex = await apiJson<{ slug: string }>(api, "get", `/admin/excursions/${id}`);
    await expectEventually(page, "/en/excursions?category=safari", async (p) => {
      await expect(p.getByRole("link", { name: title })).toBeVisible();
    });
    await page.goto(`/en/excursions/${ex.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

    await apiJson(api, "patch", `/admin/excursions/${id}/status`, { status: "draft" });
    await expectEventually(page, `/en/excursions/${ex.slug}`, async (p) => {
      await expect(p.getByText("404")).toBeVisible();
    });
  });

  test("vehicles: create, publish, unpublish, delete", async ({ page }) => {
    const name = unique("E2E Vehicle");
    await loginUi(page);
    await page.goto("/admin/content/vehicles/new");
    await page.locator("#f-name").fill(name);
    await page.locator("#f-seats").fill("5");
    await page.locator("#f-status").selectOption("published");
    await page.getByTestId("save-button").click();
    await expect(page).toHaveURL(/\/admin\/content\/vehicles\/[a-f0-9]{24}$/);
    const id = page.url().split("/").pop()!;
    await expectEventually(page, "/en/vehicles", async (p) => {
      await expect(p.getByRole("heading", { name })).toBeVisible();
    });
    await page.goto("/admin/content/vehicles");
    const row = page.getByRole("row", { name: new RegExp(name) });
    await row.getByRole("button", { name: "Unpublish" }).click();
    await expect(row.getByText("draft")).toBeVisible();
    await expectEventually(page, "/en/vehicles", async (p) => {
      await expect(p.getByRole("heading", { name })).toHaveCount(0);
    });
    await row.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("row", { name: new RegExp(name) })).toHaveCount(0);
    expect((await api.get(`admin/vehicles/${id}`)).status()).toBe(404);
  });

  test("FAQs: create, reorder, delete", async ({ page }) => {
    const q = unique("E2E question?");
    const faq = await apiJson<{ _id: string }>(api, "post", "/admin/faqs", { question: q, answer: "Yes.", status: "published", order: 9999 });
    cleanup.push(`/admin/faqs/${faq._id}`);
    await expectEventually(page, "/en/faqs", async (p) => {
      await expect(p.getByText(q)).toBeVisible();
    });
    await loginUi(page);
    await page.goto("/admin/content/faqs");
    const rows = page.getByTestId("resource-table").locator("tbody tr");
    const last = rows.filter({ hasText: q });
    await last.getByRole("button", { name: "Move up" }).click();
    await expect.poll(async () => (await apiJson<{ order: number }>(api, "get", `/admin/faqs/${faq._id}`)).order).toBeLessThan(9999);
  });

  test("tailor-made enquiry submitted publicly appears in the admin CRM", async ({ page }) => {
    const list = await apiJson<{ _id: string; personal: { email: string } }[]>(api, "get", "/admin/tailor-made-enquiries?search=e2e.tm@example.com");
    test.skip(list.length === 0, "run public.spec first");
    await loginUi(page);
    await page.goto("/admin/tailor-made");
    await page.getByPlaceholder(/Search name/).fill("e2e.tm@example.com");
    await expect(page.getByTestId("crm-table").locator("tbody tr").first()).toBeVisible();
    await page.goto(`/admin/tailor-made/${list[0]._id}`);
    await expect(page.getByText("1. Personal information")).toBeVisible();
    await expect(page.getByText("e2e.tm@example.com").first()).toBeVisible();
    await page.getByTestId("crm-status").selectOption("processing");
    await expect(page.getByText("Status → processing")).toBeVisible();
  });

  test("homepage preview shows disabled sections only with a token", async ({ page, context }) => {
    await loginUi(page);
    await page.goto("/admin/pages/home");
    const popup = context.waitForEvent("page");
    await page.getByRole("button", { name: /Preview/ }).click();
    const preview = await popup;
    await preview.waitForLoadState();
    await expect(preview).toHaveURL(/\/en\/preview\/home\?token=/);
    await expect(preview.getByText(/Preview mode/)).toBeVisible();
    const res = await page.goto("/en/preview/home?token=invalid");
    expect(res?.status()).toBe(404);
  });

  test("CMS content translation is served for the chosen locale", async ({ page }) => {
    const dests = await apiJson<{ _id: string; slug: string; name: string }[]>(api, "get", "/admin/destinations?search=Ella");
    const ella = dests.find((d) => d.slug === "ella")!;
    const name = `Ella (DE ${Date.now().toString(36)})`;
    await loginUi(page);
    await page.goto(`/admin/translations/editor?type=destination&id=${ella._id}&locale=de`);
    await page.getByLabel("name (de)").fill(name);
    await page.getByTestId("save-translation").click();
    await expect(page.getByText("Translation saved")).toBeVisible();
    try {
      await expectEventually(page, "/de/destinations/ella", async (p) => {
        await expect(p.getByTestId("destination-title")).toHaveText(name);
      });
      await page.goto("/en/destinations/ella");
      await expect(page.getByTestId("destination-title")).toHaveText("Ella");
    } finally {
      await apiJson(api, "put", `/admin/translations/destination/${ella._id}/de`, { fields: {} });
    }
  });

  test("media library explains missing Cloudinary configuration instead of crashing", async ({ page }) => {
    const status = await apiJson<{ configured: boolean }>(api, "get", "/admin/media/status");
    await loginUi(page);
    await page.goto("/admin/media");
    if (status.configured) await expect(page.getByTestId("cloudinary-missing")).toHaveCount(0);
    else await expect(page.getByTestId("cloudinary-missing")).toBeVisible();
    await page.goto("/admin/branding");
    await expect(page.getByText("Primary logo", { exact: true })).toBeVisible();
  });

  test("admin is usable on a phone", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("link", { name: "Bookings" }).first().click().catch(async () => {
      await page.getByRole("button", { name: "Bookings" }).click();
      await page.getByRole("link", { name: "All Bookings" }).click();
    });
    await expect(page).toHaveURL(/\/admin\/bookings/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await ctx.close();
  });
});
