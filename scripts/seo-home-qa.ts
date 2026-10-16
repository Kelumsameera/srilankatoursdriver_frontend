/// <reference path="../../backend/src/types/express.d.ts" />
/** Verify homepage semantics using a production frontend and a temporary database. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium } from "@playwright/test";
import { startAdminQa } from "../../backend/scripts/admin-functional-server";

async function main() {
  const qa = await startAdminQa();
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3101"], {
    windowsHide: true, stdio: "ignore", env: { ...process.env, NODE_ENV: "production", API_URL_INTERNAL: qa.baseURL },
  });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const { Page, PageSection, HeroMedia } = qa.models;
    const page = await Page.findOneAndUpdate({ slug: "home" }, { $set: { title: "Sri Lanka Tours Driver" } }, { returnDocument: "after" });
    assert.ok(page);
    await PageSection.create({ page: page._id, type: "hero", enabled: true });
    await HeroMedia.create({ title: "Discover Sri Lanka", enabled: true });
    for (let attempt = 0; attempt < 60; attempt++) {
      try { if ((await fetch("http://localhost:3101/admin/login")).ok) break; } catch { /* starting */ }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    for (const width of [390, 1366]) {
      const tab = await browser.newPage({ viewport: { width, height: 900 } });
      await tab.goto("http://localhost:3101/en");
      const headings = await tab.locator("main h1").allTextContents();
      assert.equal(headings.length, 1);
      assert.match(headings[0], /Sri Lanka Tours Driver/);
      assert.match(headings[0], /Discover Sri Lanka/);
      assert.equal(await tab.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      console.log(JSON.stringify({ width, h1: headings[0], passed: true }));
      await tab.close();
    }
  } finally {
    await browser.close();
    server.kill();
    await once(server, "exit");
    await qa.stop();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
