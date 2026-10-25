import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { destinationCover, destinationImage } from "@/lib/editorial-images";
import { generatedDestinationImages } from "@/lib/generated-destination-images";
import { localImageUrl } from "@/lib/cloudinary-loader";

describe("destination cover assets", () => {
  it.each(Object.entries(generatedDestinationImages))("%s has all responsive image files", (slug, media) => {
    expect(destinationImage({ slug, name: slug })).toEqual(media);
    for (const width of [640, 1080, 1536]) {
      expect(existsSync(path.join(process.cwd(), "public", localImageUrl(media.url, width)))).toBe(true);
    }
    expect(media.alt).toMatch(/^AI-generated illustrative/);
  });

  it("keeps an uploaded CMS photo ahead of generated art", () => {
    const heroMedia = { url: "https://example.com/galle.jpg", resourceType: "image" as const };
    expect(destinationCover({ slug: "galle", name: "Galle", heroMedia })).toBe(heroMedia);
  });

  it("does not assign another location's art to an unknown destination", () => {
    expect(destinationImage({ slug: "unknown-place", name: "Unknown" })).toBeNull();
  });
});
