import { describe, expect, it } from "vitest";
import { textLogo } from "@/components/site/Logo";

const icon = { url: "https://res.cloudinary.com/demo/image/upload/branding/pin.png" };

describe("icon + text logo (Admin → Branding)", () => {
  it("is off until the icon or line 1 is set, so the logo images keep showing", () => {
    expect(textLogo(null, "Sri Lanka Tours Driver")).toBeNull();
    expect(textLogo({ primaryLogo: icon, logoTextLine1: "  ", logoTextLine2: "TOURS DRIVER" }, "Site")).toBeNull();
    expect(textLogo({ logoIcon: { url: "" } }, "Site")).toBeNull();
  });

  it("shows the icon with one or two text lines", () => {
    expect(textLogo({ logoIcon: icon, logoTextLine1: "SRI LANKA", logoTextLine2: "TOURS DRIVER" }, "Site")).toEqual({ icon, lines: ["SRI LANKA", "TOURS DRIVER"] });
    expect(textLogo({ logoTextLine1: "SRI LANKA ", logoTextLine2: "" }, "Site")).toEqual({ icon: null, lines: ["SRI LANKA"] });
  });

  it("an icon without text uses the site name", () => {
    expect(textLogo({ logoIcon: icon }, "Sri Lanka Tours Driver")?.lines).toEqual(["Sri Lanka Tours Driver"]);
  });
});
