import type { ReactNode } from "react";
import { Camera, Compass, Star } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/types/cms";
import { bannerMedia, pageBanner, type PageBannerKey } from "@/lib/page-banners";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { HeroVideo } from "@/components/site/HeroVideo";
import { CmsImage } from "./CmsImage";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  badge,
  align = "center",
  light,
  action,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** Short highlighted line under the title, e.g. a season "(November to April)". */
  badge?: string;
  align?: "center" | "left";
  light?: boolean;
  action?: ReactNode;
}) {
  if (!title && !eyebrow && !subtitle) return null;
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-4 md:mb-14",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className={cn("eyebrow mb-3", light && "text-gold-400")}>{eyebrow}</p>}
        {title && (
          <h2 className={cn("text-3xl leading-tight sm:text-4xl lg:text-[2.75rem]", light ? "text-white" : "text-heading")}>{title}</h2>
        )}
        {badge && <p className={cn("mt-3 font-display text-xl italic sm:text-2xl", light ? "text-gold-400" : "text-gold-600")}>{badge}</p>}
        {subtitle && <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", light ? "text-white/75" : "text-muted")}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} role="img" aria-label={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-4 w-4", i <= Math.round(rating) ? "fill-gold-500 text-gold-500" : "text-sand-200")} aria-hidden />
      ))}
    </div>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-forest-50 px-3 py-1 text-xs font-medium text-brand-soft", className)}>
      {children}
    </span>
  );
}

// "Nothing here yet" box: a compass in a gold circle above the message
export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-gold-200 bg-surface/70 p-8 text-center shadow-soft sm:p-12">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-100 text-gold-600" aria-hidden>
        <Compass className="h-7 w-7" strokeWidth={1.5} />
      </span>
      <p className="max-w-md text-muted">{text}</p>
    </div>
  );
}

/**
 * Inner-page header: CMS page title / subtitle / image. Until the admin uploads a hero image, the
 * bundled photo for `banner` is shown instead (with its Creative Commons credit).
 */
export async function PageHero({
  title,
  subtitle,
  image,
  banner = "default",
  eyebrow,
  video,
  children,
}: {
  title: string;
  subtitle?: string;
  image?: MediaAsset | null;
  banner?: PageBannerKey;
  eyebrow?: string;
  /** Optional background video, played over the photo once it can start. */
  video?: MediaAsset | null;
  children?: ReactNode;
}) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("common")]);
  const fallback = image?.url && image.resourceType !== "video" ? null : pageBanner(banner);
  return (
    <section className="page-banner relative isolate flex min-h-[20rem] items-end overflow-hidden bg-forest-900 text-white sm:min-h-[23rem] lg:min-h-[25rem]" data-scroll-reveal>
      <CmsImage
        media={fallback ? bannerMedia(fallback) : image}
        alt={fallback?.alt ?? image?.alt ?? ""}
        preload
        wrapperClassName="absolute inset-0 -z-10"
        depth
        className="animate-ken-burns object-center"
        objectPosition={fallback?.focus}
        markIllustrative={false}
      />
      {video?.url && video.resourceType === "video" && (
        <div className="absolute inset-0 -z-10" data-testid="page-hero-video">
          <HeroVideo src={video.url} />
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-950/85 via-forest-950/55 to-forest-950/20 rtl:bg-gradient-to-l" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-950/60 via-transparent to-forest-950/15" />
      <div className="container-page w-full pb-10 pt-28 sm:pb-12 sm:pt-32 lg:pb-14 lg:pt-36">
        <Breadcrumbs locale={locale} items={[{ label: t("home"), href: "/" }, { label: title }]} />
        {eyebrow && <p className="eyebrow mb-4 text-gold-400">{eyebrow}</p>}
        <h1 className="max-w-3xl text-balance text-4xl leading-tight sm:text-5xl lg:text-6xl">{title}</h1>
        {subtitle && <p className="mt-5 max-w-2xl text-pretty text-lg text-white/80 sm:text-xl">{subtitle}</p>}
        {children}
      </div>
      {fallback?.illustrative ? (
        <p className="absolute bottom-2 end-3 flex items-center gap-1 text-[0.7rem] leading-none text-white/70">
          <Camera className="h-3 w-3" aria-hidden />
          {t("illustrativeImage")}
        </p>
      ) : fallback?.credit ? (
        <p className="absolute bottom-2 end-3 flex items-center gap-1 text-[0.7rem] leading-none text-white/55">
          <Camera className="h-3 w-3" aria-hidden />
          <a href={fallback.credit.source} target="_blank" rel="noopener noreferrer" className="hover:text-white">
            {fallback.credit.author}
          </a>
          <span aria-hidden>·</span>
          <a href={fallback.credit.licenseUrl} target="_blank" rel="noopener noreferrer license" className="hover:text-white">
            {fallback.credit.license}
          </a>
        </p>
      ) : null}
    </section>
  );
}

export function Section({ children, theme = "light", className, id }: { children: ReactNode; theme?: string; className?: string; id?: string }) {
  const themes: Record<string, string> = {
    light: "bg-sand-50",
    sand: "bg-sand-100",
    forest: "bg-forest-800 text-white",
    dark: "bg-forest-950 text-white",
  };
  return (
    <section id={id} className={cn("section-shell py-14 sm:py-16 lg:py-20", themes[theme] ?? themes.light, className)}>
      <div className="container-page">{children}</div>
    </section>
  );
}
