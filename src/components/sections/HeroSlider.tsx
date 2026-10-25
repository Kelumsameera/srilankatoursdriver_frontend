"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Star } from "lucide-react";
import type { HeroSlide } from "@/types/cms";
import { cn } from "@/lib/utils";
import { cloudinaryUrl, isOptimizable } from "@/lib/cloudinary-loader";
import { heroMediaSources, isPhone, motionAllowed, requestHeroPlayback, subscribeMotion, subscribePhone, type HeroPlaybackStatus } from "@/lib/hero-media";
import { CmsLink } from "@/components/ui/CmsLink";
import { buttonClass, type ButtonVariant } from "@/components/ui/Button";
import { editorialImages } from "@/lib/editorial-images";
import { GoldText, PaperEdge, stripGold } from "./home/Decor";

interface Props {
  slides: HeroSlide[];
  pageTitle?: string;
  /** Real guest rating (TripAdvisor), shown under the buttons only when the site has one. */
  rating?: { value: number; label: string; source: string };
  whatsapp?: { phone?: string; message?: string };
  labels: { previous: string; next: string; pause: string; play: string; playVideo: string; pauseVideo: string };
}

const INTERVAL = 7000;

const thumbOf = (s: HeroSlide) => heroMediaSources(s).desktop;
const subscribeVisibility = (notify: () => void) => {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
};
const pageVisible = () => !document.hidden;

/** Active slide only; pausing retains the element and its downloaded media. */
function HeroBackground({ slide, allowAutoPlay, stopped, labels, onUserPlay }: { slide: HeroSlide; allowAutoPlay: boolean; stopped: boolean; labels: Props["labels"]; onUserPlay: () => void }) {
  const sources = heroMediaSources(slide);
  const phone = useSyncExternalStore(subscribePhone, isPhone, () => false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const blocked = useRef(false);
  const failed = useRef(false);
  const [status, setStatus] = useState<HeroPlaybackStatus>("idle");
  const [requested, setRequested] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [posterFailed, setPosterFailed] = useState(false);
  const intent = !stopped && !manualPaused && (allowAutoPlay || requested);
  const src = allowAutoPlay || requested ? (phone ? sources.phoneVideo : sources.video) : undefined;
  const desktop = posterFailed ? "/images/video-placeholder.svg" : sources.desktop || editorialImages.hero.url;
  const mobile = posterFailed ? desktop : sources.mobile || desktop;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    let resumeOnVisible = false;
    let cancelAttempt = () => {};
    const play = () => {
      if (!intent || blocked.current || failed.current) return;
      cancelAttempt();
      video.muted = true;
      cancelAttempt = requestHeroPlayback(video, (next) => {
        if (next === "blocked") blocked.current = true;
        if (next === "error") failed.current = true;
        setStatus(next);
      });
    };
    const visibility = () => {
      if (document.hidden) {
        resumeOnVisible = !video.paused;
        cancelAttempt();
        video.pause();
      } else if (resumeOnVisible) {
        resumeOnVisible = false;
        play();
      }
    };
    if (intent && !document.hidden) play();
    else video.pause();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAttempt();
      document.removeEventListener("visibilitychange", visibility);
      video.pause();
    };
  }, [src, intent, attempt]);

  return (
    <>
      <div className="absolute inset-0 -z-10 bg-forest-950" aria-hidden data-illustrative={!sources.desktop && !posterFailed ? "top" : undefined}>
        <picture className="absolute inset-0">
          {mobile !== desktop && <source media="(max-width: 639px)" sizes="100vw" srcSet={[640, 1080, 1920].map((width) => `${cloudinaryUrl(mobile, { width })} ${width}w`).join(", ")} />}
          <Image
            src={desktop}
            alt=""
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            unoptimized={!isOptimizable(desktop)}
            onError={() => setPosterFailed(true)}
            className={cn("object-cover", !sources.video && allowAutoPlay && "animate-ken-burns")}
          />
        </picture>
        {sources.video && (
          <video
            ref={videoRef}
            src={src}
            // No poster: the <img> above already shows this frame, and a poster would download a second,
            // full-size copy at high priority while the video is still invisible (opacity-0 until it plays).
            muted
            loop
            playsInline
            preload="none"
            data-playback-status={status}
            // Autoplay is requested once by the effect so its play() promise is observed.
            autoPlay={false}
            className={cn("absolute inset-0 h-full w-full object-cover", status === "playing" ? "opacity-100" : "opacity-0")}
            onPlaying={() => setStatus("playing")}
            onPause={() => setStatus((current) => (current === "playing" ? "paused" : current))}
            onWaiting={() => {
              if (!failed.current && !blocked.current) setStatus("loading");
            }}
            onError={() => {
              failed.current = true;
              setStatus("error");
            }}
          />
        )}
        {slide.overlay !== false && <div className="absolute inset-0" style={{ backgroundColor: slide.overlayColor ?? "#06261b", opacity: Math.min(slide.overlayOpacity ?? 0.45, 0.35) }} />}
        <div className="absolute inset-0 bg-linear-to-r from-forest-950/85 via-forest-950/45 to-transparent rtl:bg-linear-to-l" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-forest-950/70 to-transparent" />
      </div>
      {sources.video && status !== "error" && (
        <button
          type="button"
          aria-label={status === "playing" ? labels.pauseVideo : labels.playVideo}
          className="absolute bottom-32 inset-s-6 z-20 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/50 bg-forest-950/75 px-4 py-2 text-small text-white hover:bg-forest-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:inset-s-8"
          onClick={() => {
            if (status === "playing") setManualPaused(true);
            else {
              blocked.current = false;
              setManualPaused(false);
              setRequested(true);
              setAttempt((value) => value + 1);
              onUserPlay();
            }
          }}
        >
          {status === "playing" ? <Pause aria-hidden className="h-4 w-4" /> : <Play aria-hidden className="h-4 w-4" />}
          {status === "playing" ? labels.pauseVideo : labels.playVideo}
        </button>
      )}
    </>
  );
}

/**
 * Full-screen cinematic hero. All slides, images, videos, text and buttons come from Admin → Hero Media;
 * words wrapped in *asterisks* in a slide title are shown in gold.
 */
export function HeroSlider({ slides, pageTitle, rating, whatsapp, labels }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false); // hover / focus
  const [stopped, setStopped] = useState(false); // pause button (WCAG 2.2.2)
  const motion = useSyncExternalStore(subscribeMotion, motionAllowed, () => false);
  const visible = useSyncExternalStore(subscribeVisibility, pageVisible, () => true);
  const count = slides.length;
  const go = useCallback(
    (i: number) => {
      if (count) setIndex(((i % count) + count) % count);
    },
    [count],
  );
  const playing = motion && !stopped && visible;

  useEffect(() => {
    if (count < 2 || paused || !playing) return;
    const id = window.setTimeout(() => go(index + 1), INTERVAL);
    return () => window.clearTimeout(id);
  }, [index, count, paused, playing, go]);

  if (count === 0) return null;
  const slide = slides[index] || slides[0];

  return (
    <section
      className="homepage-hero relative isolate min-h-svh overflow-hidden bg-forest-950 text-white"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <HeroBackground
        key={`${slide._id}-${slide.video?.url ?? ""}-${slide.desktopImage?.url ?? ""}-${slide.mobileImage?.url ?? ""}`}
        slide={slide}
        allowAutoPlay={motion}
        stopped={stopped || !visible}
        labels={labels}
        onUserPlay={() => setStopped(false)}
      />

      <div className="container-page relative flex min-h-svh items-center pb-36 pt-24 sm:pb-40 sm:pt-24">
        {/* Text of the visible slide. */}
        <div
          key={slide._id}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} / ${count}`}
          className={cn("max-w-2xl lg:max-w-3xl", slide.textAlign === "center" && "mx-auto text-center")}
        >
          {slide.subtitle && <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/85">{slide.subtitle}</p>}
          <h1 className="font-display text-display leading-[1.02] tracking-tight wrap-anywhere hyphens-none">
            {pageTitle && <><span className="mb-4 block font-sans text-sm font-semibold leading-6 tracking-wide text-gold-400">{pageTitle}</span>{" "}</>}
            <GoldText text={slide.title} />
          </h1>
          {slide.description && <p className="mt-5 max-w-xl text-lead leading-relaxed text-white/85">{slide.description}</p>}
          <div className={cn("mt-7 flex flex-wrap gap-3", slide.textAlign === "center" && "justify-center")}>
            {[slide.button1, slide.button2].map((b, bi) =>
              b?.label && b.url ? (
                <CmsLink
                  key={bi}
                  href={b.url}
                  newTab={b.openInNewTab}
                  whatsapp={whatsapp}
                  className={buttonClass(
                    (b.variant === "outline" ? "outline-light" : b.variant === "secondary" ? "ghost-light" : (b.variant ?? (bi === 0 ? "primary" : "outline-light"))) as ButtonVariant,
                    "lg",
                    "rounded-md",
                  )}
                >
                  {b.label}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
                </CmsLink>
              ) : null,
            )}
          </div>

          {rating && (
            <p className={cn("mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-white/85", slide.textAlign === "center" && "justify-center")}>
              <span className="flex text-gold-400" aria-hidden>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={cn("h-4 w-4", n <= Math.round(rating.value) ? "fill-current" : "opacity-40")} />
                ))}
              </span>
              <span>
                <strong className="font-semibold text-white">{rating.value.toFixed(1)}/5</strong> · {rating.label} · {rating.source}
              </span>
            </p>
          )}
        </div>

        {/* Quiet, compact slide picker on wide screens; the dot and arrow controls remain available at all sizes. */}
        {count > 1 && slide.textAlign !== "center" && (
          <ul className="absolute bottom-32 inset-e-8 hidden items-center gap-2 xl:flex">
            {slides.slice(0, 4).map((s, i) => {
              const src = thumbOf(s);
              return (
                <li key={s._id}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-label={stripGold(s.title)}
                    aria-current={i === index}
                    className="block h-12 w-18 overflow-hidden rounded-lg border border-white/35 bg-white/10 opacity-70 shadow-lg transition hover:scale-105 hover:opacity-100 aria-current:border-gold-400 aria-current:opacity-100"
                  >
                    <span className="relative block h-full w-full bg-forest-800">{src && <Image src={src} alt="" fill sizes="160px" className="object-cover" />}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-20 z-10 sm:bottom-24">
          {/* Centred, so the foliage in the bottom corners never covers the controls. */}
          <div className="container-page flex items-center justify-center gap-6">
            <div className="flex gap-1">
              {slides.map((s, i) => (
                // 44 × 44px tap area around the thin visual bar.
                <button key={s._id} type="button" onClick={() => go(i)} aria-label={`${i + 1} / ${count}`} aria-current={i === index} className="group flex h-11 min-w-11 items-center justify-center px-1">
                  <span className={cn("block h-1.5 rounded-full transition-all", i === index ? "w-10 bg-gold-500" : "w-5 bg-white/40 group-hover:bg-surface/70")} />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {motion && (
                <button
                  type="button"
                  onClick={() => setStopped((v) => !v)}
                  aria-label={stopped ? labels.play : labels.pause}
                  aria-pressed={stopped}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 hover:bg-white/10"
                >
                  {stopped ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                </button>
              )}
              <button type="button" onClick={() => go(index - 1)} aria-label={labels.previous} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 hover:bg-white/10">
                <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
              </button>
              <button type="button" onClick={() => go(index + 1)} aria-label={labels.next} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 hover:bg-white/10">
                <ChevronRight className="h-5 w-5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      <PaperEdge className="text-cream" />
    </section>
  );
}
