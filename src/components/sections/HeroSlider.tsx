"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Star } from "lucide-react";
import type { HeroSlide } from "@/types/cms";
import { cn } from "@/lib/utils";
import { cloudinaryUrl, videoPoster, videoUrl } from "@/lib/cloudinary-loader";
import { CmsLink } from "@/components/ui/CmsLink";
import { buttonClass, type ButtonVariant } from "@/components/ui/Button";
import { editorialImages } from "@/lib/editorial-images";
import { GoldText, PaperEdge, stripGold } from "./home/Decor";

interface Props {
  slides: HeroSlide[];
  /** Real guest rating (TripAdvisor), shown under the buttons only when the site has one. */
  rating?: { value: number; label: string; source: string };
  whatsapp?: { phone?: string; message?: string };
  labels: { previous: string; next: string; pause: string; play: string };
}

const INTERVAL = 7000;

/**
 * Whether moving media is welcome: false for visitors who prefer reduced motion or have Data Saver on,
 * and during server rendering (the poster image is shown first, which is also the fastest paint).
 */
function subscribeMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function motionAllowed() {
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !saveData;
}

function subscribeVideo(onChange: () => void) {
  const mq = window.matchMedia("(min-width: 1024px)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function videoAllowed() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return window.matchMedia("(min-width: 1024px)").matches && !connection?.saveData && !/^(slow-2g|2g|3g)$/.test(connection?.effectiveType ?? "");
}

const thumbOf = (s: HeroSlide) => s.desktopImage?.url ?? (s.video?.url ? videoPoster(s.video.url, 480) : undefined);

/**
 * Full-screen cinematic hero. All slides, images, videos, text and buttons come from Admin → Hero Media;
 * words wrapped in *asterisks* in a slide title are shown in gold.
 */
export function HeroSlider({ slides, rating, whatsapp, labels }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false); // hover / focus
  const [stopped, setStopped] = useState(false); // pause button (WCAG 2.2.2)
  const motion = useSyncExternalStore(subscribeMotion, motionAllowed, () => false);
  const allowVideo = useSyncExternalStore(subscribeVideo, videoAllowed, () => false);
  const [videoReady, setVideoReady] = useState(false);
  const count = slides.length;
  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const playing = motion && !stopped;

  useEffect(() => {
    if (!allowVideo) return;
    // Give the poster, fonts and primary content a head start before decorative video competes for bandwidth.
    const timer = window.setTimeout(() => setVideoReady(true), 5000);
    return () => window.clearTimeout(timer);
  }, [allowVideo]);

  useEffect(() => {
    if (count < 2 || paused || !playing || !allowVideo) return;
    const id = window.setTimeout(() => go(index + 1), INTERVAL);
    return () => window.clearTimeout(id);
  }, [index, count, paused, playing, allowVideo, go]);

  if (count === 0) return null;
  const slide = slides[index];

  return (
    <section
      className="homepage-hero relative isolate min-h-[100svh] overflow-hidden bg-forest-950 text-white"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Backgrounds (cross-fade). */}
      {slides.map((s, i) => {
        const active = i === index;
        // Hidden slides are not lazy-load candidates: opacity alone still lets browsers fetch their images.
        if (!active) return null;
        const mobile = s.mobileImage?.url ?? s.desktopImage?.url;
        const desktop = s.desktopImage?.url ?? mobile;
        const video = s.video?.url;
        return (
          <div
            key={s._id}
            className={cn("absolute inset-0 -z-10 transition-opacity duration-1000", active ? "opacity-100" : "pointer-events-none opacity-0")}
            aria-hidden
            // No uploaded media → AI-generated fallback, labelled near the top (the bottom holds the slide controls).
            data-illustrative={!video && !desktop ? "top" : undefined}
          >
            {video && active && playing && allowVideo && videoReady ? (
              // Only the visible slide gets a <video>: `autoPlay` would otherwise download every slide's video at once.
              <video className="h-full w-full object-cover" src={videoUrl(video, 1280)} poster={desktop ?? videoPoster(video)} autoPlay muted loop playsInline preload="none" />
            ) : video ? (
              <Image src={desktop ?? videoPoster(video)} alt="" fill loading="eager" fetchPriority={i === 0 ? "high" : undefined} sizes="100vw" className="object-cover" />
            ) : desktop ? (
              <picture>
                {mobile !== desktop && <source media="(max-width: 639px)" sizes="100vw" srcSet={[640, 1080, 1920].map(width => `${cloudinaryUrl(mobile!, { width })} ${width}w`).join(", ")} />}
                <Image src={desktop} alt="" fill loading="eager" fetchPriority={i === 0 ? "high" : undefined} sizes="100vw" className={cn("object-cover", active && playing && "animate-ken-burns")} />
              </picture>
            ) : (
              <Image src={editorialImages.hero.url} alt="" fill loading="eager" fetchPriority={i === 0 ? "high" : undefined} sizes="100vw" className="object-cover" />
            )}
            {s.overlay !== false && <div className="absolute inset-0" style={{ backgroundColor: s.overlayColor ?? "#06261b", opacity: Math.min(s.overlayOpacity ?? 0.45, 0.35) }} />}
            {/* Readability: darker on the text side, lighter on the photo side. */}
            <div className="absolute inset-0 bg-gradient-to-r from-forest-950/85 via-forest-950/45 to-transparent rtl:bg-gradient-to-l" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-forest-950/70 to-transparent" />
          </div>
        );
      })}

      <div className="container-page relative flex min-h-[100svh] items-center pb-36 pt-24 sm:pb-40 sm:pt-24">
        {/* Text of the visible slide. */}
        <div
          key={slide._id}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} / ${count}`}
          className={cn("max-w-2xl lg:max-w-3xl", slide.textAlign === "center" && "mx-auto text-center")}
        >
          {slide.subtitle && <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/85">{slide.subtitle}</p>}
          <h1 className="font-display text-4xl leading-[1.02] tracking-tight [overflow-wrap:normal] hyphens-none sm:text-6xl lg:text-[4.5rem]">
            <GoldText text={slide.title} />
          </h1>
          {slide.description && <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">{slide.description}</p>}
          <div className={cn("mt-7 flex flex-wrap gap-3", slide.textAlign === "center" && "justify-center")}>
            {[slide.button1, slide.button2].map((b, bi) =>
              b?.label && b.url ? (
                <CmsLink
                  key={bi}
                  href={b.url}
                  newTab={b.openInNewTab}
                  whatsapp={whatsapp}
                  className={buttonClass(
                    (b.variant === "outline" ? "outline-light" : b.variant === "secondary" ? "ghost-light" : b.variant ?? (bi === 0 ? "primary" : "outline-light")) as ButtonVariant,
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
            <p className={cn("mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85", slide.textAlign === "center" && "justify-center")}>
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
          <ul className="absolute bottom-32 end-8 hidden items-center gap-2 xl:flex">
            {slides.slice(0, 4).map((s, i) => {
              const src = thumbOf(s);
              return (
                <li key={s._id}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-label={stripGold(s.title)}
                    aria-current={i === index}
                    className="block h-12 w-[4.5rem] overflow-hidden rounded-lg border border-white/35 bg-white/10 opacity-70 shadow-lg transition hover:scale-105 hover:opacity-100 aria-[current=true]:border-gold-400 aria-[current=true]:opacity-100"
                  >
                    <span className="relative block h-full w-full bg-forest-800">
                      {src && <Image src={src} alt="" fill sizes="160px" className="object-cover" />}
                    </span>
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
                // 24px tall hit area (WCAG 2.5.8) around the thin visual bar.
                <button key={s._id} type="button" onClick={() => go(i)} aria-label={`${i + 1} / ${count}`} aria-current={i === index} className="group flex h-6 items-center px-0.5">
                  <span className={cn("block h-1.5 rounded-full transition-all", i === index ? "w-10 bg-gold-500" : "w-5 bg-white/40 group-hover:bg-white/70")} />
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
                  className="rounded-full border border-white/30 p-2.5 hover:bg-white/10"
                >
                  {stopped ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                </button>
              )}
              <button type="button" onClick={() => go(index - 1)} aria-label={labels.previous} className="rounded-full border border-white/30 p-2.5 hover:bg-white/10">
                <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
              </button>
              <button type="button" onClick={() => go(index + 1)} aria-label={labels.next} className="rounded-full border border-white/30 p-2.5 hover:bg-white/10">
                <ChevronRight className="h-5 w-5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      <PaperEdge className="text-sand-50" />
    </section>
  );
}
