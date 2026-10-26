import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { tourHeroMedia } from "@/lib/tour-hero";

describe("tour hero media", () => {
  it.each([[undefined, "sri-lanka-fishing"], ["down-south-tours", "sri-lanka-fishing"], ["beach-tours", "sri-lanka-fishing"], ["cultural-tours", "sigiriya"], ["hill-country-tours", "ella"]])("matches %s to bundled footage", (category, scene) => {
    const media = tourHeroMedia(category);
    expect(media.video.url).toBe(`/videos/tours/${scene}.mp4`);
    for (const asset of [media.video, media.poster]) {
      expect(existsSync(resolve("public", asset.url!.slice(1)))).toBe(true);
    }
  });

  it("keeps admin-selected category footage and rejects image assets as videos", () => {
    const video = { url: "https://example.com/coast.mp4", resourceType: "video" as const };
    expect(tourHeroMedia("down-south-tours", video).video).toBe(video);
    expect(tourHeroMedia("cultural-tours", { ...video, resourceType: "image" }).video.url).toBe("/videos/tours/sigiriya.mp4");
  });
});
