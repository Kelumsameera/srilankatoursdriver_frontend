import { afterEach, describe, expect, it, vi } from "vitest";
import { getPage } from "@/lib/api/server";
import { SECTION_TYPES, pageForm, sectionForm } from "@/lib/admin/page-fields";
import { allFields, fromFormValues, toFormValues } from "@/components/admin/form/values";
import { pageUpdate, sectionUpdate } from "../../backend/src/validations/content";

afterEach(() => vi.unstubAllGlobals());

describe("published CMS edits", () => {
  it("loads the current page and section data without the persistent cache or webhook", async () => {
    const response = (title: string) => new Response(JSON.stringify({ success: true, data: { page: { title }, sections: [] } }));
    const fetch = vi.fn().mockResolvedValueOnce(response("Before")).mockResolvedValueOnce(response("After"));
    vi.stubGlobal("fetch", fetch);
    expect((await getPage("home", "en"))?.page.title).toBe("Before");
    expect((await getPage("home", "en"))?.page.title).toBe("After");
    for (const [, options] of fetch.mock.calls) {
      expect(options.cache).toBe("no-store");
      expect(options.next).toBeUndefined();
    }
  });

  it("preserves Next.js dynamic-render signals instead of treating them as API failures", async () => {
    const signal = Object.assign(new Error("Dynamic server usage"), { digest: "DYNAMIC_SERVER_USAGE" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(signal));
    await expect(getPage("home", "en")).rejects.toBe(signal);
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
