import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PageRenderer } from "@/components/sections/PageRenderer";
import { PageBody } from "@/components/ui/PageBody";
vi.mock("@/i18n/navigation", () => ({ Link: "a" }));
beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => vi.unstubAllGlobals());

describe("CMS page body", () => {
  it("does not leave an empty block when body text is cleared", () => {
    expect(renderToStaticMarkup(React.createElement(PageBody, { content: "   " }))).toBe("");
  });
  it("renders saved Markdown even when the page has no sections", async () => {
    const html = renderToStaticMarkup(await PageRenderer({ sections: [], settings: null, content: "## Updated body", part: "body" }));
    expect(html).toContain("Updated body</h2>");
    expect(html).toContain('data-testid="page-body"');
  });
  it("does not duplicate body text in a hero-only render", async () => {
    const html = renderToStaticMarkup(await PageRenderer({ sections: [], settings: null, content: "Updated body", part: "hero" }));
    expect(html).not.toContain("Updated body");
  });
});
