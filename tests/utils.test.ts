import { describe, expect, it } from "vitest";
import { embedUrl, formatPrice, interpolate, isExternal, phoneDigits, stripMarkdown, whatsappLink } from "@/lib/utils";
import { cloudinaryUrl, videoPoster } from "@/lib/cloudinary-loader";

describe("contact helpers", () => {
  it("builds WhatsApp links from any phone format", () => {
    expect(phoneDigits("+94 76 930 0334")).toBe("94769300334");
    expect(whatsappLink("+94769300334", "Hi there")).toBe("https://wa.me/94769300334?text=Hi%20there");
    expect(whatsappLink("")).toBe("#");
  });
  it("interpolates the year in CMS strings", () => {
    expect(interpolate("© {year} SLTD")).toBe(`© ${new Date().getFullYear()} SLTD`);
  });
  it("detects external links", () => {
    expect(isExternal("https://x.com")).toBe(true);
    expect(isExternal("mailto:a@b.c")).toBe(true);
    expect(isExternal("/tours")).toBe(false);
  });
});

describe("formatting", () => {
  it("formats prices per locale and handles missing values", () => {
    expect(formatPrice(1200, "USD", "en")).toBe("$1,200");
    expect(formatPrice(null)).toBeNull();
    expect(formatPrice(5, "XXXX", "en")).toBe("XXXX 5");
  });
  it("strips markdown for meta descriptions", () => {
    expect(stripMarkdown("## Hello **world** [link](https://x)")).toBe("Hello world link");
    expect(stripMarkdown("a".repeat(300), 10)).toHaveLength(10);
  });
});

describe("guest short embeds", () => {
  it("supports YouTube shorts, Instagram reels and TikTok", () => {
    expect(embedUrl("youtube", "https://youtube.com/shorts/abc123")).toBe("https://www.youtube-nocookie.com/embed/abc123");
    expect(embedUrl("youtube", "https://www.youtube.com/watch?v=xyz")).toBe("https://www.youtube-nocookie.com/embed/xyz");
    expect(embedUrl("instagram", "https://www.instagram.com/reels/C1/")).toBe("https://www.instagram.com/reel/C1/embed");
    expect(embedUrl("tiktok", "https://www.tiktok.com/@u/video/123")).toBe("https://www.tiktok.com/embed/v2/123");
    expect(embedUrl("youtube", "not a url")).toBeNull();
  });
});

describe("cloudinary transformations", () => {
  const src = "https://res.cloudinary.com/demo/image/upload/v1/srilankatoursdriver/tours/a.jpg";
  it("adds width, format and quality", () => {
    expect(cloudinaryUrl(src, { width: 800 })).toBe("https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/v1/srilankatoursdriver/tours/a.jpg");
  });
  it("crops OpenGraph images", () => {
    expect(cloudinaryUrl(src, { width: 1200, height: 630, crop: "fill" })).toContain("w_1200,h_630,c_fill,g_auto");
  });
  it("leaves non-Cloudinary URLs alone", () => {
    expect(cloudinaryUrl("https://example.com/a.jpg", { width: 100 })).toBe("https://example.com/a.jpg");
  });
  it("creates video posters", () => {
    expect(videoPoster("https://res.cloudinary.com/demo/video/upload/v1/x.mp4")).toBe("https://res.cloudinary.com/demo/video/upload/so_1,w_1280,c_limit,q_auto,f_jpg/v1/x.jpg");
  });
});
