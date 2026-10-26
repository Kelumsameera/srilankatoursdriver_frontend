"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { videoUrl } from "@/lib/cloudinary-loader";
import { useTranslations } from "next-intl";
import { Pause, Play } from "lucide-react";
import { HERO_VIDEO_WIDTH, isPhone, motionAllowed, requestHeroPlayback, safeMediaSource, subscribeMotion, subscribePhone, type HeroPlaybackStatus } from "@/lib/hero-media";

/**
 * Muted, looping background video for a page header. The header's photo stays underneath and shows
 * until the video plays, and for visitors who prefer reduced motion or have Data Saver on.
 */
export function HeroVideo({ src, className, controls = false }: { src?: string; className?: string; controls?: boolean }) {
  const t = useTranslations("common");
  const safe = safeMediaSource(src);
  const motion = useSyncExternalStore(subscribeMotion, motionAllowed, () => false);
  const phone = useSyncExternalStore(subscribePhone, isPhone, () => false);
  const [status, setStatus] = useState<HeroPlaybackStatus>("idle");
  const ref = useRef<HTMLVideoElement>(null);
  const url = safe && motion ? videoUrl(safe, phone ? HERO_VIDEO_WIDTH.phone : HERO_VIDEO_WIDTH.desktop) : undefined;

  useEffect(() => {
    const video = ref.current;
    if (!video || !url) return;
    return requestHeroPlayback(video, setStatus);
  }, [url]);

  if (!url) return null;
  return (
    <>
    <video
      ref={ref}
      src={url}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      tabIndex={-1}
      data-playback-status={status}
      className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-700", status === "playing" ? "opacity-100" : "opacity-0", className)}
      onPlaying={() => setStatus("playing")}
      onPause={() => setStatus((current) => current === "playing" ? "paused" : current)}
      onError={() => setStatus("error")}
    />
    {controls && status !== "error" && (
      <button type="button" aria-label={t(status === "playing" ? "pauseVideo" : "playVideo")}
        className="absolute bottom-6 end-6 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-forest-950/60 text-white hover:bg-forest-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        onClick={() => {
          const video = ref.current;
          if (!video) return;
          if (status === "playing") video.pause();
          else requestHeroPlayback(video, setStatus);
        }}>
        {status === "playing" ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
      </button>
    )}
    </>
  );
}
