import { defineConfig, devices } from "@playwright/test";

/**
 * Read-only public tests. Start the real API from backend/ with
 * `node --import tsx scripts/qa-readonly.ts`, then start the frontend locally.
 * Do not seed or mutate an unverified database. If using an installed Chrome:
 *
 *   PLAYWRIGHT_CHROMIUM_PATH=... npm run test:e2e
 * Run invocations sequentially, or use distinct --output directories.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /public\.spec\.ts/ },
  ],
});
