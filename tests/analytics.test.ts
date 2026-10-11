import { afterEach, describe, expect, it, vi } from "vitest";
import { track } from "@/lib/analytics";
import { failureType } from "@/components/forms/fields";

describe("analytics", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("does nothing when no tag manager has created window.dataLayer", () => {
    vi.stubGlobal("window", {});
    expect(() => track("whatsapp_click", { location: "float" })).not.toThrow();
  });

  it("pushes exactly one event with the given non-personal params", () => {
    const dataLayer: unknown[] = [];
    vi.stubGlobal("window", { dataLayer });
    track("trip_inquiry_success", { form: "tailor_made" });
    expect(dataLayer).toEqual([{ event: "trip_inquiry_success", form: "tailor_made" }]);
  });

  it("labels failed submissions without exposing API details", () => {
    expect(failureType({ status: 400, errors: [{}] })).toBe("fields");
    expect(failureType({ status: 429, errors: [] })).toBe("rate_limited");
    expect(failureType({ status: 0, errors: [] })).toBe("network");
    expect(failureType({ status: 500, errors: [] })).toBe("generic");
  });
});
