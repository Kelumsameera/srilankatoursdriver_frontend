import type { HeroSlide } from "@/types/cms";
import { isCloudinaryVideo, videoPoster, videoUrl } from "./cloudinary-loader";

/** Never send an unsafe CMS value to a browser media element. */
export function safeMediaSource(value?: string): string | undefined {
  if (!value || /[\s\\]/.test(value)) return undefined;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return !url.username && !url.password && (url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) ? value : undefined;
  } catch { return undefined; }
}

export function heroMediaSources(slide: HeroSlide) {
  const source = slide.video?.resourceType !== "image" ? safeMediaSource(slide.video?.url) : undefined;
  const desktop = slide.desktopImage?.resourceType !== "video" ? safeMediaSource(slide.desktopImage?.url) : undefined;
  const mobile = slide.mobileImage?.resourceType !== "video" ? safeMediaSource(slide.mobileImage?.url) : undefined;
  const poster = source && isCloudinaryVideo(source) ? videoPoster(source) : source ? "/images/video-placeholder.svg" : undefined;
  return { video: source ? videoUrl(source, 1280) : undefined, desktop: desktop || mobile || poster, mobile: mobile || desktop || poster };
}

export type HeroPlaybackStatus = "idle" | "loading" | "playing" | "paused" | "blocked" | "error";

/** One play attempt per intent. Catches both synchronous throws and rejected promises.
 * Cancellation prevents stale promises updating a replaced slide or unmounted component. */
export function requestHeroPlayback(video: Pick<HTMLVideoElement, "play">, onStatus: (status: HeroPlaybackStatus) => void) {
  let cancelled = false;
  onStatus("loading");
  try {
    Promise.resolve(video.play()).catch((error: unknown) => {
      if (!cancelled) onStatus(error instanceof Error && error.name === "NotAllowedError" ? "blocked" : "error");
    });
  } catch { if (!cancelled) onStatus("error"); }
  return () => { cancelled = true; };
}
