"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { videoUrl } from "@/lib/cloudinary-loader";
import { HERO_VIDEO_WIDTH, isPhone, motionAllowed, requestHeroPlayback, safeMediaSource, subscribeMotion, subscribePhone, type HeroPlaybackStatus } from "@/lib/hero-media";

/**
 * Muted, looping background video for a page header. The header's photo stays underneath and shows
 * until the video plays, and for visitors who prefer reduced motion or have Data Saver on.
 */
export function HeroVideo({ src, className }: { src?: string; className?: string }) {
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
      onError={() => setStatus("error")}
    />
  );
}
