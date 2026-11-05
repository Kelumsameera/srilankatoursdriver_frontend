"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { motionAllowed, subscribeMotion } from "@/lib/hero-media";
import { HeroVideo } from "./HeroVideo";

const INTERVAL = 9000;

const subscribeVisibility = (notify: () => void) => {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
};
const pageVisible = () => !document.hidden;

/**
 * Page-header background videos that take turns like the homepage hero slides: each plays for a few seconds,
 * then the next fades in over it. Dots pick a video; the pause button holds the current one (WCAG 2.2.2).
 * One video is a plain HeroVideo.
 */
export function HeroVideoRotator({ sources, className }: { sources: string[]; className?: string }) {
  const t = useTranslations("common");
  const motion = useSyncExternalStore(subscribeMotion, motionAllowed, () => false);
  const visible = useSyncExternalStore(subscribeVisibility, pageVisible, () => true);
  const [index, setIndex] = useState(0);
  // The video before the current one stays underneath until the new one fades in
  const [previous, setPrevious] = useState<number | null>(null);
  const [stopped, setStopped] = useState(false);
  const count = sources.length;

  const show = (next: number) => {
    setPrevious(index);
    setIndex(((next % count) + count) % count);
  };

  // Once the new video has faded in, the one underneath can go
  useEffect(() => {
    if (previous === null) return;
    const id = window.setTimeout(() => setPrevious(null), 2000);
    return () => window.clearTimeout(id);
  }, [previous, index]);

  useEffect(() => {
    if (count < 2 || stopped || !motion || !visible) return;
    const id = window.setTimeout(() => {
      setPrevious(index);
      setIndex((index + 1) % count);
    }, INTERVAL);
    return () => window.clearTimeout(id);
  }, [index, count, stopped, motion, visible]);

  if (count === 0) return null;
  if (count === 1) return <HeroVideo src={sources[0]} className={className} controls />;

  return (
    <>
      <div aria-hidden className={cn("absolute inset-0", className)}>
        {/* Keyed by position, so the outgoing video keeps playing underneath while the next one fades in */}
        {[previous, index]
          .filter((i, at, list): i is number => i !== null && list.indexOf(i) === at)
          .sort((a, b) => a - b)
          .map((i) => (
            <div key={i} className="absolute inset-0" style={{ zIndex: i === index ? 1 : 0 }}>
              <HeroVideo src={sources[i]} paused={i === index && stopped} />
            </div>
          ))}
      </div>
      {motion && (
        <div className="absolute bottom-6 end-6 z-20 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {sources.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={t("showVideo", { number: i + 1 })}
                aria-current={i === index}
                onClick={() => show(i)}
                className="flex h-6 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span className={cn("block h-1.5 rounded-full transition-all", i === index ? "w-6 bg-gold-400" : "w-1.5 bg-white/60 hover:bg-white")} />
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label={t(stopped ? "playSlideshow" : "pauseSlideshow")}
            onClick={() => setStopped((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-forest-950/60 text-white hover:bg-forest-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {stopped ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      )}
    </>
  );
}
