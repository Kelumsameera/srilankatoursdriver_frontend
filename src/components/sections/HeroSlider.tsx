"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSlide } from "@/types/cms";
import { cn } from "@/lib/utils";
import { videoPoster, videoUrl } from "@/lib/cloudinary-loader";
import { CmsLink } from "@/components/ui/CmsLink";
import { buttonClass, type ButtonVariant } from "@/components/ui/Button";

interface Props {
  slides: HeroSlide[];
  whatsapp?: { phone?: string; message?: string };
  labels: { previous: string; next: string };
}

const INTERVAL = 7000;

/** Full-screen cinematic hero. All slides, images, videos, text and buttons come from Admin → Hero Media. */
export function HeroSlider({ slides, whatsapp, labels }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    const id = window.setTimeout(() => go(index + 1), INTERVAL);
    return () => window.clearTimeout(id);
  }, [index, count, paused, go]);

  if (count === 0) return null;

  return (
    <section
      className="relative isolate h-[100svh] min-h-[620px] overflow-hidden bg-forest-950 text-white"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((slide, i) => {
        const active = i === index;
        const desktop = slide.desktopImage?.url;
        const mobile = slide.mobileImage?.url ?? desktop;
        const video = slide.video?.url;
        return (
          <div
            key={slide._id}
            className={cn("absolute inset-0 transition-opacity duration-1000", active ? "opacity-100" : "pointer-events-none opacity-0")}
            aria-hidden={!active}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${count}`}
          >
            <div className="absolute inset-0 -z-10">
              {video ? (
                <video
                  className="h-full w-full object-cover"
                  src={videoUrl(video)}
                  poster={desktop ?? videoPoster(video)}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload={i === 0 ? "auto" : "none"}
                />
              ) : desktop ? (
                <>
                  <Image
                    src={desktop}
                    alt={slide.desktopImage?.alt ?? ""}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className={cn("hidden object-cover sm:block", active && "animate-ken-burns")}
                  />
                  <Image
                    src={mobile!}
                    alt={slide.mobileImage?.alt ?? slide.desktopImage?.alt ?? ""}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className={cn("object-cover sm:hidden", active && "animate-ken-burns")}
                  />
                </>
              ) : (
                <div className="h-full w-full bg-[radial-gradient(ellipse_at_20%_10%,#1f7a4d_0%,#0f3d2e_40%,#04170f_100%)]" />
              )}
              {slide.overlay !== false && (
                <div className="absolute inset-0" style={{ backgroundColor: slide.overlayColor ?? "#06261b", opacity: slide.overlayOpacity ?? 0.45 }} />
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-forest-950/80 to-transparent" />
            </div>

            <div
              className={cn(
                "container-page flex h-full flex-col justify-center pb-16 pt-28",
                slide.textAlign === "center" && "items-center text-center",
              )}
            >
              {active && (
                <>
                  {slide.subtitle && <p className="eyebrow mb-5 animate-fade-up text-gold-400">{slide.subtitle}</p>}
                  <h1 className="max-w-4xl animate-fade-up text-4xl leading-[1.08] [animation-delay:100ms] sm:text-6xl lg:text-7xl">{slide.title}</h1>
                  {slide.description && (
                    <p className="mt-6 max-w-2xl animate-fade-up text-lg leading-relaxed text-white/85 [animation-delay:200ms] sm:text-xl">{slide.description}</p>
                  )}
                  <div className="mt-9 flex animate-fade-up flex-wrap gap-3 [animation-delay:300ms]">
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
                          )}
                        >
                          {b.label}
                        </CmsLink>
                      ) : null,
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-8 z-10">
          <div className="container-page flex items-center justify-between">
            <div className="flex gap-2">
              {slides.map((s, i) => (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`${i + 1}`}
                  aria-current={i === index}
                  className={cn("h-1.5 rounded-full transition-all", i === index ? "w-10 bg-gold-500" : "w-5 bg-white/40 hover:bg-white/70")}
                />
              ))}
            </div>
            <div className="flex gap-2">
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
    </section>
  );
}
