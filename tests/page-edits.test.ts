import { afterEach, describe, expect, it, vi } from "vitest";
import { TAGS, getDetail, getList, getPage } from "@/lib/api/server";
import { SECTION_TYPES, pageForm, sectionForm } from "@/lib/admin/page-fields";
import { allFields, fromFormValues, toFormValues } from "@/components/admin/form/values";
import { pageUpdate, sectionUpdate } from "../../backend/src/validations/content";

afterEach(() => vi.unstubAllGlobals());

describe("published CMS edits", () => {
  // Cached (a no-store page fetch made every route dynamic and slow), but refreshed by any content change
  // through the webhook's tags, and within a minute even when the webhook is not configured.
  it("caches page data briefly, tagged with every content type the sections embed", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { page: { title: "Home" }, sections: [] } })));
    vi.stubGlobal("fetch", fetch);
    expect((await getPage("home", "en"))?.page.title).toBe("Home");
    const [, options] = fetch.mock.calls[0];
    expect(options.cache).toBeUndefined();
    expect(options.next.revalidate).toBeLessThanOrEqual(60);
    expect(options.next.tags).toEqual(expect.arrayContaining([...Object.values(TAGS)]));
  });

  it("preserves Next.js dynamic-render signals instead of treating them as API failures", async () => {
    const signal = Object.assign(new Error("Dynamic server usage"), { digest: "DYNAMIC_SERVER_USAGE" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(signal));
    await expect(getPage("home", "en")).rejects.toBe(signal);
  });

  it("preserves render signals through destination detail and list helpers", async () => {
    const signal = Object.assign(new Error("Dynamic server usage"), { digest: "DYNAMIC_SERVER_USAGE" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(signal));
    await expect(getDetail("destinations", "anuradhapura", "en")).rejects.toBe(signal);
    await expect(getList("destinations", { locale: "en" })).rejects.toBe(signal);
  });

  it("serializes page text, media and SEO for the save endpoint", () => {
    const fields = allFields(pageForm);
    const payload = fromFormValues(fields, toFormValues(fields, { title: "Updated page", content: "## New content", status: "published" }));
    expect(pageUpdate.parse(payload)).toMatchObject({ title: "Updated page", content: "## New content", status: "published" });
  });

  for (const { value } of SECTION_TYPES) {
    it(`${value}: saves edited section text and visibility`, () => {
      const fields = allFields(sectionForm(value));
      const values = toFormValues(fields, { title: "Original", enabled: true, settings: { theme: "light", source: "featured", layout: "grid", limit: 6 } });
      values.title = "Updated section";
      const payload = fromFormValues(fields, values);
      expect(sectionUpdate.parse(payload)).toMatchObject({ title: "Updated section", enabled: true });
    });
  }
});
