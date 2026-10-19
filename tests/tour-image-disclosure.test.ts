import { describe, expect, it } from "vitest";
import { isIllustrative } from "@/lib/editorial-images";

describe("illustrative cover disclosures", () => {
  it("recognizes generated art both locally and in the CMS", () => {
    expect(isIllustrative("/images/editorial/cover.webp")).toBe(true);
    expect(isIllustrative("https://res.cloudinary.com/example/image/upload/file.webp", "AI-generated illustrative coastal golf green")).toBe(true);
  });
  it("keeps uploaded travel photos free of illustration badges", () => {
    expect(isIllustrative("https://res.cloudinary.com/example/image/upload/galle.webp", "Galle lighthouse")).toBe(false);
    expect(isIllustrative()).toBe(false);
  });
});
