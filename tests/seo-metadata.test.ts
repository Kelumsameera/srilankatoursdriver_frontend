import { describe, expect, it, vi } from "vitest";
import { buildMetadata } from "@/lib/seo";

vi.mock("@/lib/api/server", () => ({
  getSiteSettings: vi.fn(async () => null),
  getSeo: vi.fn(async () => null),
  getBranding: vi.fn(async () => null),
}));

describe("page SEO fields", () => {
  it("uses an explicit SEO title exactly without adding the layout title suffix", async () => {
    const metadata = await buildMetadata({ locale: "en", path: "/destinations", title: "Visible heading", seo: { seoTitle: "Saved SEO title" } });
    expect(metadata.title).toEqual({ absolute: "Saved SEO title" });
    expect(metadata.openGraph?.title).toBe("Saved SEO title");
  });

  it("keeps the site template for pages without an explicit SEO title", async () => {
    const metadata = await buildMetadata({ locale: "en", path: "/destinations", title: "Visible heading" });
    expect(metadata.title).toBe("Visible heading");
  });
});
