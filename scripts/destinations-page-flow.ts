/// <reference path="../../backend/src/types/express.d.ts" />
/** Real admin -> MongoDB -> public HTML test. Uses a temporary database only. Run from frontend after next build. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium } from "@playwright/test";
import { startAdminQa } from "../../backend/scripts/admin-functional-server";

async function main() {
  const qa = await startAdminQa();
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3101"], {
    cwd: process.cwd(), windowsHide: true, stdio: "ignore",
    env: { ...process.env, NODE_ENV: "production", API_URL_INTERNAL: qa.baseURL },
  });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const { Page, PageSection, Destination, Media } = qa.models;
    await Media.create({ publicId: "qa/header", secureUrl: "https://example.com/qa-header.jpg", resourceType: "image", title: "QA Header" });
    const page = await Page.create({ slug: "destinations", title: "Original title", subtitle: "Original subtitle", isSystem: true, status: "published" });
    const section = await PageSection.create({ page: page._id, type: "richText", title: "Extra section", content: "Extra section content", enabled: false });
    await Destination.create({ name: "QA Destination", slug: "qa-destination", status: "published" });
    for (let attempt = 0; attempt < 60; attempt++) {
      try { if ((await fetch("http://localhost:3101/admin/login")).ok) break; } catch { /* server starting */ }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    const context = await browser.newContext();
    const login = await context.request.post(`${qa.baseURL}/auth/login`, { data: { email: qa.email, password: qa.password }, headers: { origin: "http://localhost:3000" } });
    assert.equal(login.status(), 200, "isolated QA login");
    await context.addCookies((await context.cookies()).map(cookie => ({ ...cookie, domain: "localhost" })));
    await context.route("**/api/**", async route => {
      const request = route.request();
      const url = new URL(request.url());
      const response = await route.fetch({ url: `${qa.baseURL}${url.pathname.replace(/^\/api/, "")}${url.search}`, headers: { ...request.headers(), origin: "http://localhost:3000" } });
      await route.fulfill({ response });
    });
    const admin = await context.newPage();
    await admin.goto("http://localhost:3101/admin/pages/destinations");
    await admin.locator('input[name="title"]').fill("Updated destination heading");
    await admin.locator('textarea[name="subtitle"]').fill("Updated destination subtitle");
    await admin.getByRole("button", { name: "Choose Header image", exact: true }).click();
    await admin.getByRole("button", { name: "Select QA Header", exact: true }).click();
    await admin.getByTestId("media-use-selected").click();
    await admin.getByLabel("Alt text", { exact: true }).fill("Updated header alt");
    await admin.getByRole("button", { name: "Choose OpenGraph image", exact: true }).click();
    await admin.getByRole("button", { name: "Select QA Header", exact: true }).click();
    await admin.getByTestId("media-use-selected").click();
    await admin.locator("textarea").nth(1).fill("## Updated destination body\n\nSaved through the real admin form.");
    for (const [name, value] of Object.entries({ "seo.seoTitle": "Updated SEO title", "seo.canonicalUrl": "https://example.test/destinations", "seo.ogTitle": "Updated social title", "seo.robots": "noindex,nofollow" })) {
      await admin.locator(`input[name="${name}"]`).fill(value);
    }
    await admin.locator('textarea[name="seo.metaDescription"]').fill("Updated SEO description");
    await admin.locator('textarea[name="seo.ogDescription"]').fill("Updated social description");
    await admin.getByPlaceholder("Type and press Enter").fill("updated keyword");
    await admin.getByPlaceholder("Type and press Enter").press("Enter");
    const save = admin.waitForResponse(response => response.url().endsWith(`/admin/pages/${page._id}`) && response.request().method() === "PUT");
    await admin.getByTestId("save-button").click();
    assert.equal((await save).status(), 200, "save accepted by actual API");
    await admin.reload();
    assert.equal(await admin.locator('input[name="title"]').inputValue(), "Updated destination heading", "saved form persists after reload");
    const publicPage = await context.newPage();
    await publicPage.goto("http://localhost:3101/en/destinations");
    assert.equal(await publicPage.locator("h1").textContent(), "Updated destination heading");
    assert.equal(await publicPage.getByText("Updated destination subtitle", { exact: true }).count(), 1);
    for (const [selector, value] of Object.entries({ 'meta[name="description"]': "Updated SEO description", 'meta[property="og:title"]': "Updated social title", 'meta[property="og:description"]': "Updated social description", 'link[rel="canonical"]': "https://example.test/destinations" })) {
      assert.equal(await publicPage.locator(selector).getAttribute(selector.startsWith("link") ? "href" : "content"), value);
    }
    assert.equal(await publicPage.title(), "Updated SEO title");
    assert.equal(await publicPage.locator('meta[property="og:image"]').getAttribute("content"), "https://example.com/qa-header.jpg");
    assert.match(await publicPage.locator('meta[name="keywords"]').getAttribute("content") ?? "", /updated keyword/);
    assert.match(await publicPage.locator('meta[name="robots"]').getAttribute("content") ?? "", /noindex.*nofollow/);
    assert.equal(await publicPage.getByText("Extra section content", { exact: true }).count(), 0, "disabled section hidden");
    const popup = admin.waitForEvent("popup");
    await admin.getByRole("button", { name: "Preview (incl. disabled)", exact: true }).click();
    const preview = await popup;
    await preview.waitForLoadState("domcontentloaded");
    await preview.getByText("Extra section content", { exact: true }).waitFor();
    await preview.close();
    const html = await publicPage.content();
    const problems: string[] = [];
    if (await publicPage.locator(".page-banner img").getAttribute("alt") !== "Updated header alt") problems.push("Header image alt was discarded");
    if (html.indexOf('data-testid="page-body"') > html.indexOf('data-testid="destination-list"')) problems.push("Body text is below the destination listing");
    assert.match(await publicPage.getByTestId("page-body").textContent() ?? "", /Updated destination body/);
    const toggle = admin.waitForResponse(response => response.url().endsWith(`/sections/${section._id}`) && response.request().method() === "PUT");
    await admin.getByRole("button", { name: "Enable", exact: true }).click();
    assert.equal((await toggle).status(), 200);
    await publicPage.reload();
    assert.equal(await publicPage.getByText("Extra section content", { exact: true }).count(), 1, "enabled section appears on next request");
    await admin.locator('textarea[name="subtitle"]').fill("");
    const clear = admin.waitForResponse(response => response.url().endsWith(`/admin/pages/${page._id}`) && response.request().method() === "PUT");
    await admin.getByTestId("save-button").click();
    assert.equal((await clear).status(), 200);
    await publicPage.reload();
    assert.equal(await publicPage.locator(".page-banner p.text-pretty").count(), 0, "cleared subtitle stays cleared");
    console.log(JSON.stringify({ savedAndReloaded: true, publicHeading: true, metadata: true, bodyText: true, sectionVisibility: true, disabledPreview: true, clearedSubtitle: true, problems }));
    assert.deepEqual(problems, []);
  } finally {
    await browser.close();
    server.kill();
    await once(server, "exit");
    await qa.stop();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
