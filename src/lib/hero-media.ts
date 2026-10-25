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

/** Phones (narrower than Tailwind's sm breakpoint) get a lighter hero video; desktop keeps 1280px. */
export const PHONE_MEDIA_QUERY = "(max-width: 639px)";
export const HERO_VIDEO_WIDTH = { desktop: 1280, phone: 720 } as const;

/**
 * Whether moving media is welcome: false for visitors who prefer reduced motion or have Data Saver on,
 * and during server rendering (the poster image is shown first, which is also the fastest paint).
 */
export function subscribeMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = (navigator as Navigator & { connection?: EventTarget }).connection;
  mq.addEventListener("change", onChange);
  connection?.addEventListener("change", onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    connection?.removeEventListener("change", onChange);
  };
}
export function motionAllowed() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !connection?.saveData && !/^(slow-2g|2g)$/.test(connection?.effectiveType ?? "");
}

/** Phone-width viewport; false during server rendering (the video src is only set client-side anyway). */
export function subscribePhone(onChange: () => void) {
  const mq = window.matchMedia(PHONE_MEDIA_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
export const isPhone = () => window.matchMedia(PHONE_MEDIA_QUERY).matches;

export function heroMediaSources(slide: HeroSlide) {
  const source = slide.video?.resourceType !== "image" ? safeMediaSource(slide.video?.url) : undefined;
  const desktop = slide.desktopImage?.resourceType !== "video" ? safeMediaSource(slide.desktopImage?.url) : undefined;
  const mobile = slide.mobileImage?.resourceType !== "video" ? safeMediaSource(slide.mobileImage?.url) : undefined;
  const poster = source && isCloudinaryVideo(source) ? videoPoster(source) : source ? "/images/video-placeholder.svg" : undefined;
  return {
    video: source ? videoUrl(source, HERO_VIDEO_WIDTH.desktop) : undefined,
    phoneVideo: source ? videoUrl(source, HERO_VIDEO_WIDTH.phone) : undefined,
    desktop: desktop || mobile || poster, mobile: mobile || desktop || poster,
  };
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
