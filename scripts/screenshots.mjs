// Takes screenshots of the public pages + admin login at 5 widths (en and ar) and checks each page for layout problems.
// READ-ONLY: every non-GET request from the browser is blocked, so no form, beacon or analytics call reaches the API.
//
//   node scripts/screenshots.mjs <outDir> [baseUrl] [pageFilter]
//   node scripts/screenshots.mjs "$LOCALAPPDATA/sltd-qa/baseline-screenshots" http://localhost:3000
//   node scripts/screenshots.mjs "$LOCALAPPDATA/sltd-qa/part2a-after" http://localhost:3000 tours
//
// Writes <outDir>/<width>/<locale>-<page>.jpg and <outDir>/report.json.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const WIDTHS = [360, 390, 768, 1024, 1440];
const LOCALES = ["en", "ar"];

// Public pages, relative to /<locale>. Detail slugs are real published items.
const PUBLIC_PAGES = [
  "",
  "about",
  "tours",
  "tours/galle-one-day-tour",
  "tours/08-days-east-coast-hotels",
  "excursions",
  "excursions/colombo",
  "excursions/kandy",
  "vehicles",
  "vehicles/honda-fit",
  "destinations",
  "destinations/kandy",
  "blog",
  "contact",
  "faqs",
  "gallery",
  "reviews",
  "tailor-made-tours",
  "booking",
  "account",
  "account/login",
  "account/register",
  "account/forgot-password",
  "account/reset-password",
  "privacy-policy",
  "this-page-does-not-exist",
];

// Build the list of URLs to visit: every public page in every locale, plus the admin login
function buildTargets(pageFilter) {
  const targets = [];
  for (const locale of LOCALES) {
    for (const page of PUBLIC_PAGES) {
      targets.push({ name: `${locale}-${page.replaceAll("/", "_") || "home"}`, url: `/${locale}${page ? "/" + page : ""}` });
    }
  }
  targets.push({ name: "admin-login", url: "/admin/login" });
  if (!pageFilter) return targets;
  // "tours,blog" keeps pages whose name (without the locale) starts with tours or blog, e.g. en-tours_galle-one-day-tour
  const prefixes = pageFilter.split(",");
  return targets.filter((target) => prefixes.some((prefix) => target.name.replace(/^(en|ar)-/, "").startsWith(prefix)));
}

// Scroll to the bottom in steps so lazy images load, then back to the top
async function scrollThroughPage(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
}

// Layout checks that run inside the page
async function checkPage(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const brokenImages = [...document.images]
      .filter((image) => image.complete && image.naturalWidth === 0 && image.getAttribute("src"))
      .map((image) => image.currentSrc || image.src);
    return {
      horizontalOverflow: root.scrollWidth - root.clientWidth,
      h1Count: document.querySelectorAll("h1").length,
      brokenImages,
      dir: root.getAttribute("dir"),
    };
  });
}

// Visit one URL at one width, save the screenshot and return the check results
async function capture(browser, baseUrl, outDir, target, width) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const consoleErrors = [];

  // Block every write request: only GET/HEAD/OPTIONS may leave the browser.
  // Blocked requests get an empty 204 instead of a network error, so they don't show up as console errors.
  await page.route("**/*", (route) => {
    const method = route.request().method();
    return ["GET", "HEAD", "OPTIONS"].includes(method) ? route.continue() : route.fulfill({ status: 204, body: "" });
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text().slice(0, 300));
  });
  page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message.slice(0, 300)}`));

  let status = 0;
  try {
    const response = await page.goto(baseUrl + target.url, { waitUntil: "load", timeout: 60_000 });
    status = response?.status() ?? 0;
    // Wait for images and data to settle. Some pages (admin login) keep polling, so give up after 10 s.
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    await scrollThroughPage(page);
    const checks = await checkPage(page);
    mkdirSync(path.join(outDir, String(width)), { recursive: true });
    await page.screenshot({ path: path.join(outDir, String(width), `${target.name}.jpg`), fullPage: true, type: "jpeg", quality: 70 });
    return { page: target.name, url: target.url, width, status, finalUrl: page.url().replace(baseUrl, ""), ...checks, consoleErrors };
  } catch (error) {
    return { page: target.name, url: target.url, width, status, error: String(error).slice(0, 300), consoleErrors };
  } finally {
    await context.close();
  }
}

// Read the command line, visit every target at every width, and write report.json
async function main() {
  const [outDir, baseUrl = "http://localhost:3000", pageFilter] = process.argv.slice(2);
  if (!outDir) {
    console.log("Usage: node scripts/screenshots.mjs <outDir> [baseUrl] [pageFilter]");
    process.exitCode = 1;
    return;
  }

  // Use the installed Chrome (Playwright's own browsers are not downloaded here)
  const browser = await chromium.launch({ channel: "chrome" });
  const results = [];
  for (const target of buildTargets(pageFilter)) {
    for (const width of WIDTHS) {
      const result = await capture(browser, baseUrl, outDir, target, width);
      results.push(result);
      const problems = [
        result.error && "ERROR",
        result.horizontalOverflow > 0 && `overflow ${result.horizontalOverflow}px`,
        result.h1Count !== undefined && result.h1Count !== 1 && `${result.h1Count} h1`,
        result.brokenImages?.length && `${result.brokenImages.length} broken img`,
        result.consoleErrors.length && `${result.consoleErrors.length} console errors`,
      ].filter(Boolean);
      console.log(`${result.status} ${width} ${target.url} ${problems.join(", ")}`);
    }
  }
  await browser.close();

  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "report.json"), JSON.stringify(results, null, 2) + "\n");
  console.log(`Saved ${results.length} screenshots and report.json to ${outDir}`);
}

await main();
