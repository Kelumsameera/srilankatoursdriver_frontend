import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import cloudinaryLoader, { localImageUrl, videoPoster } from "@/lib/cloudinary-loader";
import { pageBanner, type PageBannerKey } from "@/lib/page-banners";
import { editorialImages } from "@/lib/editorial-images";

const KEYS: PageBannerKey[] = ["tours", "destinations", "vehicles", "tailor-made-tours", "excursions", "gallery", "blog", "default"];
const publicFile = (url: string) => path.join(process.cwd(), "public", url);

describe("localImageUrl", () => {
  it("resizes video posters without retaining a conflicting original width", () => {
    const poster = videoPoster("https://res.cloudinary.com/x/video/upload/v1/hero.mp4");
    const responsive = cloudinaryLoader({ src: poster, width: 640 });
    expect(responsive).toContain("w_640");
    expect(responsive).not.toContain("w_1280");
    expect(responsive).toContain("so_1/");
    expect(responsive).toMatch(/hero\.jpg$/);
  });

  it("serves the smallest pre-rendered variant that covers the width", () => {
    expect(localImageUrl("/images/banners/tours-banner.webp", 384)).toBe("/images/banners/tours-banner-640.webp");
    expect(localImageUrl("/images/banners/tours-banner.webp", 640)).toBe("/images/banners/tours-banner-640.webp");
    expect(localImageUrl("/images/banners/tours-banner.webp", 828)).toBe("/images/banners/tours-banner-1080.webp");
    expect(localImageUrl("/images/banners/tours-banner.webp", 1920)).toBe("/images/banners/tours-banner.webp");
  });

  it("serves the 320px variant of small decorations on phones", () => {
    const foliage = "/images/decor/homepage-tropical-foliage-corner-v2.webp";
    expect(localImageUrl(foliage, 256)).toBe("/images/decor/homepage-tropical-foliage-corner-v2-320.webp");
    expect(localImageUrl(foliage, 384)).toBe("/images/decor/homepage-tropical-foliage-corner-v2-640.webp");
    for (const w of [256, 384, 1080, 4000]) expect(existsSync(publicFile(localImageUrl(foliage, w)))).toBe(true);
  });

  it("leaves other local files alone apart from the width hint", () => {
    expect(localImageUrl("/favicon-fallback.svg", 64)).toBe("/favicon-fallback.svg?w=64");
  });

  it("is used by the next/image loader, which still rewrites Cloudinary URLs", () => {
    expect(cloudinaryLoader({ src: "/images/banners/blog-banner.webp", width: 750 })).toBe("/images/banners/blog-banner-1080.webp");
    expect(cloudinaryLoader({ src: "https://res.cloudinary.com/x/image/upload/v1/a.jpg", width: 750 })).toBe(
      "https://res.cloudinary.com/x/image/upload/f_auto,q_auto,w_750,c_limit/v1/a.jpg",
    );
  });
});

describe("page banners", () => {
  it.each(KEYS)("%s has every size variant on disk and attribution", (key) => {
    const b = pageBanner(key);
    for (const w of [640, 1080, 4000]) expect(existsSync(publicFile(localImageUrl(b.src, w)))).toBe(true);
    expect(b.alt.length).toBeGreaterThan(10);
    if (b.illustrative) {
      expect(b.credit).toBeUndefined();
    } else {
      expect(b.credit?.author).toBeTruthy();
      expect(b.credit?.licenseUrl).toMatch(/^https:\/\/creativecommons\.org\/licenses\/by\//);
      expect(b.credit?.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
  });
});

describe("editorial image fallbacks", () => {
  it.each(Object.entries(editorialImages))("%s has responsive WebP variants", (_name, image) => {
    for (const width of [640, 1080, 4000]) expect(existsSync(publicFile(localImageUrl(image.url!, width)))).toBe(true);
    expect(image.alt).toContain("AI-generated illustrative");
  });
});
