import { expect, request, type APIRequestContext, type Page } from "@playwright/test";

export const API_URL = (process.env.E2E_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/$/, "");
/** Set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (the Super Admin created by `npm run seed`). */
export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? "",
  password: process.env.E2E_ADMIN_PASSWORD ?? "",
};
if (!ADMIN.email || !ADMIN.password) {
  throw new Error("Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD before running the E2E tests.");
}

/** Authenticated API client (cookies) for setup / clean-up. */
export async function adminApi(): Promise<APIRequestContext> {
  const ctx = await request.newContext({ baseURL: `${API_URL}/` });
  const res = await ctx.post("auth/login", { data: ADMIN });
  expect(res.ok(), `admin login failed: ${await res.text()}`).toBeTruthy();
  return ctx;
}

export async function apiJson<T>(ctx: APIRequestContext, method: "get" | "post" | "put" | "patch" | "delete", path: string, data?: unknown): Promise<T> {
  const res = await ctx[method](path.replace(/^\//, ""), data === undefined ? undefined : { data });
  const body = await res.json();
  expect(res.ok(), `${method.toUpperCase()} ${path}: ${JSON.stringify(body)}`).toBeTruthy();
  return body.data as T;
}

export async function loginUi(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByTestId("admin-user")).toBeVisible();
}

/** Public pages are cached (ISR) – after an admin change the backend revalidates them; poll until visible. */
export async function expectEventually(page: Page, url: string, check: (page: Page) => Promise<void>, attempts = 10) {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    await page.goto(url);
    try {
      await check(page);
      return;
    } catch (err) {
      lastError = err;
      await page.waitForTimeout(1000);
    }
  }
  throw lastError;
}

export const unique = (prefix: string) => `${prefix} ${Date.now().toString(36)}`;
