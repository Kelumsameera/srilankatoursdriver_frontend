import { describe, expect, it, vi } from "vitest";
import { cloudinaryUrl, isCloudinaryVideo, isOptimizable, videoPoster, videoUrl } from "@/lib/cloudinary-loader";
import { heroMediaSources, PHONE_MEDIA_QUERY, requestHeroPlayback, safeMediaSource } from "@/lib/hero-media";

const mov = "https://res.cloudinary.com/demo/video/upload/v123/folder/hero.mov";
describe("hero video delivery and fallback", () => {
  it("delivers MOV as explicit H.264 MP4 with a bounded width and preserved version/id/query", () => {
    expect(videoUrl(mov + "?test=1", 1280)).toBe("https://res.cloudinary.com/demo/video/upload/q_auto,vc_h264,f_mp4,w_1280,c_limit/v123/folder/hero.mp4?test=1");
    expect(videoUrl(mov, 100000)).toContain("w_1920");
    expect(videoPoster(mov)).toContain("so_1,w_1280,c_limit,q_auto,f_jpg/v123/folder/hero.jpg");
  });
  it("never mistakes an untrusted hostname for Cloudinary", () => {
    const spoof = "https://res.cloudinary.com.evil.invalid/demo/video/upload/hero.mp4";
    expect(isCloudinaryVideo(spoof)).toBe(false);
    expect(isOptimizable(spoof)).toBe(false);
    expect(videoUrl(spoof)).toBe(spoof);
    expect(videoPoster(spoof)).toBe("/images/video-placeholder.svg");
  });
  it("uses one responsive width for generated Cloudinary posters", () => {
    const url = cloudinaryUrl(videoPoster(mov, 1280), { width: 640 });
    expect(url).toContain("w_640");
    expect(url).not.toContain("w_1280");
  });
  it("gives phones a narrower H.264 MP4 while desktop keeps 1280px", () => {
    const { video, phoneVideo } = heroMediaSources({ _id: "p", title: "P", video: { url: mov, resourceType: "video" } });
    expect(video).toBe("https://res.cloudinary.com/demo/video/upload/q_auto,vc_h264,f_mp4,w_1280,c_limit/v123/folder/hero.mp4");
    expect(phoneVideo).toBe("https://res.cloudinary.com/demo/video/upload/q_auto,vc_h264,f_mp4,w_720,c_limit/v123/folder/hero.mp4");
    expect(PHONE_MEDIA_QUERY).toBe("(max-width: 639px)");
    expect(heroMediaSources({ _id: "q", title: "Q", video: { url: "https://example.com/video.webm" } }).phoneVideo).toBe("https://example.com/video.webm");
    expect(heroMediaSources({ _id: "r", title: "R", desktopImage: { url: "/photo.jpg" } }).phoneVideo).toBeUndefined();
  });
  it("handles image-only, video-only, external video and missing/invalid sources", () => {
    expect(heroMediaSources({ _id: "a", title: "A", desktopImage: { url: "/photo.jpg" } })).toMatchObject({ video: undefined, desktop: "/photo.jpg", mobile: "/photo.jpg" });
    expect(heroMediaSources({ _id: "b", title: "B", video: { url: mov, resourceType: "video" } }).desktop).toContain(".jpg");
    expect(heroMediaSources({ _id: "c", title: "C", video: { url: "https://example.com/video.webm" } }).desktop).toBe("/images/video-placeholder.svg");
    expect(heroMediaSources({ _id: "d", title: "D", video: { url: "javascript:alert(1)" } }).video).toBeUndefined();
    expect(heroMediaSources({ _id: "e", title: "E", video: { url: mov, resourceType: "image" } }).video).toBeUndefined();
    for (const url of ["//evil.invalid/media", "data:video/mp4;base64,abc", "/\\evil.invalid", "https://user:password@example.com/video", "http://example.com/video"]) expect(safeMediaSource(url)).toBeUndefined();
  });
});

describe("playback rejection handling", () => {
  it("reports blocked autoplay without retrying", async () => {
    const play = vi.fn().mockRejectedValue(new DOMException("Blocked", "NotAllowedError"));
    const status = vi.fn();
    requestHeroPlayback({ play }, status);
    await Promise.resolve();
    expect(play).toHaveBeenCalledTimes(1);
    expect(status.mock.calls.map(([state]) => state)).toEqual(["loading", "blocked"]);
  });
  it("ignores a stale rejected promise after cleanup", async () => {
    const status = vi.fn();
    const cancel = requestHeroPlayback({ play: () => Promise.reject(new Error("interrupted")) }, status);
    cancel();
    await Promise.resolve();
    expect(status.mock.calls.map(([state]) => state)).toEqual(["loading"]);
  });
  it("handles synchronous media errors and unsupported playback", async () => {
    const status = vi.fn();
    requestHeroPlayback({ play: () => { throw new Error("unsupported"); } }, status);
    expect(status).toHaveBeenLastCalledWith("error");
    requestHeroPlayback({ play: () => Promise.reject(new DOMException("unsupported", "NotSupportedError")) }, status);
    await Promise.resolve();
    expect(status).toHaveBeenLastCalledWith("error");
  });
});
