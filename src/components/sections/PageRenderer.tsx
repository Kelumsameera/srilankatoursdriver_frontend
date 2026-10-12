import type { ComponentType, CSSProperties } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Calendar, Check, ExternalLink, Landmark, MapPin, Mountain, PawPrint, Phone, Mail, Clock, Snowflake, Star, TreePalm } from "lucide-react";
import type {
  BlogPost,
  Destination,
  Excursion,
  Faq,
  GalleryItem,
  GuestShort,
  HeroSlide,
  MediaAsset,
  PageSection,
  Review,
  SiteSettings,
  Tour,
  TripAdvisorSummary,
  Vehicle,
} from "@/types/cms";
import { cn, formatPrice, telLink, whatsappLink } from "@/lib/utils";
import { ButtonLink, type ButtonVariant } from "@/components/ui/Button";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { Markdown } from "@/components/ui/Markdown";
import { Section, SectionHeading, Stars } from "@/components/ui/misc";
import { FeatureIcon, SocialIcons } from "@/components/ui/icons";
import { BlogCard, DestinationCard, ExcursionCard, ReviewCard, VehicleCard } from "@/components/cards/cards";
import { TourCard, sharedDescriptions } from "@/components/cards/TourCard";
import { HeroSlider } from "./HeroSlider";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { GuestShortsGrid } from "./GuestShorts";
import { FaqList } from "./FaqList";
import { Marquee } from "@/components/ui/Marquee";
import { Botanical, GoldText, PaperEdge } from "./home/Decor";
import { FernBranch, FoliageCluster } from "./home/Foliage";
import { editorialImages } from "@/lib/editorial-images";

interface Ctx {
  settings: SiteSettings | null;
  preview?: boolean;
  /** Ids of tours shown by category-filtered tour sections on this page. */
  categorisedTours?: Set<string>;
  /** The page's "Why travel with us" items – also shown as the hero's selling points. */
  highlights?: NonNullable<PageSection["items"]>;
  /** Real CMS photos from this page (destinations, tours) for decorative collages. */
  photos?: MediaAsset[];
  /** The page opens with a hero, so the highlights are shown in the trust row under it. */
  hasHero?: boolean;
  /** A real coastal/landscape photo from this page for the closing call to action. */
  ctaPhoto?: MediaAsset;
  /** Real TripAdvisor rating of the business (only when the TripAdvisor section returned one). */
  rating?: { value: number; count: number };
}

const isDark = (theme?: string) => theme === "forest" || theme === "dark";

/** Interest tiles of the tailor-made section (keys of `tailorMade.interests`). */
const INTEREST_TILES = [
  { key: "culture", icon: Landmark },
  { key: "beach", icon: TreePalm },
  { key: "wildlife", icon: PawPrint },
  { key: "adventure", icon: Mountain },
] as const;

function Buttons({ section, ctx, light }: { section: PageSection; ctx: Ctx; light?: boolean }) {
  if (!section.buttons?.length) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {section.buttons
        .filter((b) => b.label && b.url)
        .map((b, i) => {
          let variant = (b.variant ?? "primary") as ButtonVariant;
          if (light && variant === "outline") variant = "outline-light";
          return (
            <ButtonLink
              key={`${b.label}-${i}`}
              href={b.url}
              variant={variant}
              newTab={b.openInNewTab}
              whatsapp={{ phone: ctx.settings?.whatsapp, message: ctx.settings?.whatsappMessage }}
            >
              {b.label}
            </ButtonLink>
          );
        })}
    </div>
  );
}

function Heading({ section, light, withAction = true, ctx }: { section: PageSection; light?: boolean; withAction?: boolean; ctx: Ctx }) {
  return (
    <SectionHeading
      eyebrow={section.eyebrow}
      title={section.title}
      subtitle={section.subtitle}
      badge={section.badge}
      light={light}
      align={withAction && section.buttons?.length ? "left" : "center"}
      action={withAction ? <HeadingLinks section={section} ctx={ctx} light={light} /> : undefined}
    />
  );
}

/** Section-heading actions as quiet text links ("View all destinations →"), as in the design. */
function HeadingLinks({ section, ctx, light }: { section: PageSection; ctx: Ctx; light?: boolean }) {
  const links = (section.buttons ?? []).filter((b) => b.label && b.url);
  if (!links.length) return null;
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {links.map((b, i) => (
        <CmsLink
          key={`${b.label}-${i}`}
          href={b.url}
          newTab={b.openInNewTab}
          whatsapp={{ phone: ctx.settings?.whatsapp, message: ctx.settings?.whatsappMessage }}
          className={cn(
            "group/link inline-flex items-center gap-2 border-b pb-0.5 text-sm font-semibold transition-colors",
            light ? "border-gold-400/60 text-white hover:text-gold-400" : "border-forest-800/30 text-forest-800 hover:border-gold-500 hover:text-gold-600",
          )}
        >
          {b.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1 rtl:rotate-180" aria-hidden />
        </CmsLink>
      ))}
    </div>
  );
}

type SectionItem = NonNullable<PageSection["items"]>[number];

/** Team member photo, or their initials when no photo has been uploaded yet. */
function TeamPhoto({ person, className, sizes }: { person: SectionItem; className: string; sizes: string }) {
  if (person.image?.url) {
    return <CmsImage media={person.image} alt={person.image.alt || person.title || ""} sizes={sizes} wrapperClassName={className} />;
  }
  const initials = (person.title ?? "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
  return (
    <div className={cn(className, "flex items-center justify-center bg-forest-800 font-display text-4xl text-gold-400")} aria-hidden>
      {initials}
    </div>
  );
}

/** Trust row under the hero: the page's "Why travel with us" items as gold line icons (design: below the hero). */
function TrustHighlights({ items }: { items: SectionItem[] }) {
  return (
    <div className="relative z-10 bg-sand-50">
      <ul className="container-page grid grid-cols-2 gap-y-4 py-5 sm:py-6 lg:grid-cols-4 lg:divide-x lg:divide-sand-200 rtl:lg:divide-x-reverse">
        {items.map((item, i) => (
          <li key={`${item.title}-${i}`} className="flex min-w-0 items-center gap-3 px-2 lg:justify-center lg:px-5">
            <FeatureIcon name={item.icon} className="h-7 w-7 shrink-0 text-gold-600 sm:h-8 sm:w-8" />
            <span className="min-w-0 text-sm font-semibold leading-tight text-forest-900 [overflow-wrap:anywhere] hyphens-auto">{item.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Three overlapping photos (design: one large photo with two smaller cards laid over it at different angles). */
function OverlapGallery({ photos }: { photos: MediaAsset[] }) {
  const [a, b, c] = photos;
  return (
    <div className="relative mx-auto w-full max-w-[28rem] pb-12 pt-4 sm:pb-16 sm:pt-6 xl:max-w-xl" aria-hidden>
      <div className="relative z-0 w-[74%] -rotate-2 rounded-2xl bg-white p-2 shadow-card sm:p-2.5">
        <CmsImage media={a} alt="" sizes="(min-width: 1280px) 420px, (min-width: 768px) 33vw, 74vw" wrapperClassName="aspect-[5/6] rounded-xl" />
      </div>
      {b && (
        <div className="absolute end-0 top-0 z-10 w-[48%] rotate-3 rounded-2xl bg-white p-2 shadow-card sm:p-2.5">
          <CmsImage media={b} alt="" sizes="(min-width: 1024px) 20vw, 46vw" wrapperClassName="aspect-[4/3] rounded-xl" />
        </div>
      )}
      {c && (
        <div className="absolute bottom-0 end-[3%] z-20 w-[52%] -rotate-[4deg] rounded-2xl bg-white p-2 shadow-card sm:p-2.5">
          <CmsImage media={c} alt="" sizes="(min-width: 1024px) 22vw, 50vw" wrapperClassName="aspect-[4/3] rounded-xl" />
        </div>
      )}
    </div>
  );
}

/** Wavy vertical edge between a full-bleed photo and the content beside it (colour = the section background). */
function OrganicEdge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 800" preserveAspectRatio="none" aria-hidden className={cn("pointer-events-none absolute inset-y-0 h-full w-10 xl:w-16", className)}>
      <path fill="currentColor" d="M64 0H38C22 70 46 130 30 200s-30 120-8 200 28 130 8 200-18 140 8 200h26Z" />
    </svg>
  );
}

/** Distinct photos (by URL), in order. */
const distinctPhotos = (list: (MediaAsset | null | undefined)[], max: number) => {
  const seen = new Set<string>();
  return list
    .filter((m): m is MediaAsset => Boolean(m?.url && m.resourceType !== "video" && !seen.has(m.url) && seen.add(m.url)))
    .slice(0, max);
};

/** Dark-green "featured tour" band: one tour presented large (popular-tours sections with the Split layout). */
async function FeaturedTourBand({ section, tour }: { section: PageSection; tour: Tour }) {
  const [t, tt, locale] = await Promise.all([getTranslations("common"), getTranslations("tour"), getLocale()]);
  const price = formatPrice(tour.price, tour.currency, locale);
  const stops = Array.from(new Set((tour.itinerary ?? []).map((d) => d.location?.trim()).filter((x): x is string => Boolean(x)))).slice(0, 4);
  return (
    <section className="relative overflow-hidden bg-forest-900 py-24 text-white sm:py-28" data-testid="featured-tour">
      <PaperEdge flip className="text-sand-50" />
      <Botanical className="text-white opacity-[0.05]" />
      <div className="container-page relative grid items-center gap-14 lg:grid-cols-2">
        <div className="relative">
          <CmsImage media={tour.heroMedia} alt={tour.heroMedia?.alt || tour.title} sizes="(min-width: 1024px) 50vw, 100vw" wrapperClassName="aspect-[4/3] rounded-[2rem] shadow-2xl" />
          <div className="absolute -end-4 -top-6 h-32 w-32 overflow-hidden rounded-full border-4 border-gold-500 shadow-xl sm:h-40 sm:w-40" aria-hidden>
            <CmsImage media={tour.heroMedia} alt="" sizes="160px" wrapperClassName="absolute inset-0" className="scale-150" />
          </div>
        </div>
        <div>
          {section.eyebrow && <p className="eyebrow mb-4 text-gold-400">{section.eyebrow}</p>}
          {section.title && <p className="mb-2 font-display text-xl text-white/70">{section.title}{section.badge ? ` ${section.badge}` : ""}</p>}
          <h2 className="text-4xl leading-tight sm:text-5xl">{tour.title}</h2>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/80">
            {tour.durationDays ? (
              <li className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gold-400" aria-hidden /> {t("days", { count: tour.durationDays })}
              </li>
            ) : null}
            {stops.map((s) => (
              <li key={s} className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gold-400" aria-hidden /> {s}
              </li>
            ))}
          </ul>
          {section.subtitle && <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">{section.subtitle}</p>}
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <ButtonLink href={`/tours/${tour.slug}`} variant="outline-light" className="rounded-md border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-forest-950">
              {tt("itinerary")} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </ButtonLink>
            {price && (
              <p className="text-sm text-white/70">
                {t("from")} <span className="font-display text-2xl text-gold-400">{price}</span>
              </p>
            )}
          </div>
        </div>
      </div>
      <PaperEdge className="text-sand-50" />
    </section>
  );
}

/** Centred call-to-action banner (CTA sections, and tailor-made sections without a photo). */
function CtaBanner({ section, ctx, light }: { section: PageSection; ctx: Ctx; light: boolean }) {
  // Design: a wide landscape photo behind the call to action. Without an uploaded one, a real photo from this page.
  const media = section.media?.url ? section.media : ctx.hasHero ? ctx.ctaPhoto : undefined;
  const hasMedia = Boolean(media?.url);
  return (
    <section className={cn("relative isolate overflow-hidden py-24 sm:py-28", light ? "bg-forest-900 text-white" : "bg-sand-100")}>
      {hasMedia && (
        <>
          <CmsImage media={media} alt="" wrapperClassName="absolute inset-0 -z-20" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-forest-950/55 via-forest-950/65 to-forest-950/80" />
          <PaperEdge flip className="text-sand-50" />
        </>
      )}
      {!hasMedia && light && (
        <div className="absolute -start-40 -top-40 -z-10 h-[30rem] w-[30rem] rounded-full bg-forest-600/30 blur-3xl" aria-hidden />
      )}
      <div className="container-page">
        <div className={cn("mx-auto max-w-3xl text-center", hasMedia && "text-white")}>
          {section.eyebrow && <p className={cn("eyebrow mb-4", (light || hasMedia) && "text-gold-400")}>{section.eyebrow}</p>}
          {section.title && <h2 className="text-3xl leading-tight sm:text-5xl">{section.title}</h2>}
          {section.subtitle && <p className={cn("mx-auto mt-5 max-w-2xl text-lg", light || hasMedia ? "text-white/80" : "text-muted")}>{section.subtitle}</p>}
          {section.content && <Markdown content={section.content} className="mt-6 text-start" />}
          {section.items?.length ? (
            <ul className="mx-auto mt-8 grid max-w-xl gap-3 text-start sm:grid-cols-2">
              {section.items.map((it, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-gold-500" aria-hidden />
                  <span>{it.title}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-10 flex justify-center">
            <Buttons section={section} ctx={ctx} light={light || hasMedia} />
          </div>
        </div>
      </div>
    </section>
  );
}

async function SectionView({ section, ctx }: { section: PageSection; ctx: Ctx }) {
  const theme = section.settings?.theme ?? "light";
  const light = isDark(theme);
  const list = <T,>() => (Array.isArray(section.data) ? (section.data as T[]) : []);
  const t = await getTranslations("common");

  switch (section.type) {
    case "hero": {
      const slides = list<HeroSlide>();
      if (!slides.length) return null;
      const tr = await getTranslations("reviews");
      const points = (ctx.highlights ?? []).filter((h) => h.title).slice(0, 4);
      return (
        // z-10 + isolate: the foliage (behind the hero and trust row) reaches over the edge into the next section.
        <div className="relative isolate z-10 overflow-x-clip">
          <div className="relative">
          <HeroSlider
            slides={slides}
            rating={ctx.rating ? { value: ctx.rating.value, label: tr("basedOn", { count: ctx.rating.count }), source: "TripAdvisor" } : undefined}
            whatsapp={{ phone: ctx.settings?.whatsapp, message: ctx.settings?.whatsappMessage }}
            labels={{ previous: t("previous"), next: t("next"), pause: t("pauseSlideshow"), play: t("playSlideshow"), playVideo: t("playVideo"), pauseVideo: t("pauseVideo") }}
          />
            <FoliageCluster front side="start" className="bottom-0 translate-y-[18%]" />
            <FoliageCluster front side="end" className="bottom-0 translate-y-[18%]" />
          </div>
          {points.length > 0 && <TrustHighlights items={points} />}
        </div>
      );
    }

    case "whyChooseUs": {
      const items = (section.items ?? []).filter((it) => it.title);
      const gallery = distinctPhotos([section.media, ...(section.items ?? []).map((it) => it.image), ...(ctx.photos ?? [])], 3);
      // With a hero on the page the items' titles and icons are already in the trust row, so here the benefits are
      // listed by their descriptions (design: a short check list).
      const asChecklist = ctx.hasHero && items.some((it) => it.description);
      return (
        <section className={cn("relative overflow-x-clip pb-14 pt-16 sm:pb-16 sm:pt-20 lg:pb-20 lg:pt-24", light ? "bg-forest-900 text-white" : "bg-sand-50")}>
          <FernBranch className={cn("absolute -bottom-10 -start-10 hidden w-44 md:block lg:w-52", light ? "text-white/10" : "text-forest-700/20")} />
          <div className={cn("container-page relative grid items-center gap-10 lg:gap-12", gallery.length && "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]")}>
            <div>
              {section.eyebrow && <p className={cn("eyebrow mb-4", light && "text-gold-400")}>{section.eyebrow}</p>}
              {section.title && (
                <h2 className={cn("max-w-xl text-4xl leading-[1.08] sm:text-5xl", light ? "text-white" : "text-forest-900")}>
                  <GoldText text={section.title} goldClass="font-display italic text-gold-600" />
                </h2>
              )}
              {section.subtitle && <p className={cn("mt-5 max-w-xl text-lg leading-relaxed", light ? "text-white/75" : "text-muted")}>{section.subtitle}</p>}
              {section.content && <Markdown content={section.content} className="mt-5 max-w-xl" />}
              {asChecklist ? (
                <ul className="mt-8 max-w-xl space-y-3">
                  {items
                    .filter((it) => it.description)
                    .map((item, i) => (
                      <li key={`${item.title}-${i}`} className={cn("flex items-start gap-3 text-[0.95rem] leading-snug", light ? "text-white/85" : "text-ink/85")}>
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500 text-white" aria-hidden>
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        {item.description}
                      </li>
                    ))}
                </ul>
              ) : items.length > 0 ? (
                <ul className={cn("mt-10 grid gap-x-6 gap-y-7 sm:grid-cols-2", !gallery.length && "lg:grid-cols-4")}>
                  {items.map((item, i) => (
                    <li key={`${item.title}-${i}`} className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-500/50 bg-white/60 text-gold-600">
                        <FeatureIcon name={item.icon} className="h-6 w-6" />
                      </span>
                      <span>
                        <span className={cn("block font-semibold leading-tight", light ? "text-white" : "text-forest-900")}>{item.title}</span>
                        {item.description && <span className={cn("mt-1 block text-sm leading-snug", light ? "text-white/70" : "text-muted")}>{item.description}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-10">
                <Buttons section={section} ctx={ctx} light={light} />
              </div>
            </div>
            {gallery.length > 0 && <OverlapGallery photos={gallery} />}
          </div>
        </section>
      );
    }

    case "features": {
      const items = section.items ?? [];
      return (
        <Section theme={theme}>
          <Heading section={section} light={light} ctx={ctx} />
          {section.content && <Markdown content={section.content} className="mx-auto mb-12 max-w-3xl text-center" />}
          <ul className={cn("grid gap-6 sm:grid-cols-2", items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
            {items.map((item, i) => (
              <li
                key={`${item.title}-${i}`}
                className={cn("rounded-3xl p-7 transition-colors", light ? "bg-white/5 hover:bg-white/10" : "bg-white shadow-card")}
              >
                <span className={cn("mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl", light ? "bg-gold-500/15" : "bg-forest-50")}>
                  <FeatureIcon name={item.icon} className={cn("h-7 w-7", light ? "text-gold-400" : "text-forest-600")} />
                </span>
                {item.title && <h3 className={cn("text-xl", light ? "text-white" : "text-forest-900")}>{item.title}</h3>}
                {item.description && <p className={cn("mt-2 text-sm leading-relaxed", light ? "text-white/70" : "text-muted")}>{item.description}</p>}
              </li>
            ))}
          </ul>
        </Section>
      );
    }

    case "popularTours": {
      // A general (uncategorised) tour section skips tours that a category section on the same page already shows.
      const tours = list<Tour>().filter((t) => section.settings?.category || !ctx.categorisedTours?.has(t._id));
      if (!tours.length) return null;
      const shared = sharedDescriptions(tours);
      if (section.settings?.layout === "split") {
        const [lead, ...more] = tours;
        return (
          <>
            <FeaturedTourBand section={section} tour={lead} />
            {more.length > 0 && (
              <Section theme={theme}>
                <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
                  {more.map((tour) => (
                    <TourCard key={tour._id} tour={tour} hideDescription={shared.has(tour.shortDescription?.trim() ?? "")} />
                  ))}
                </div>
              </Section>
            )}
          </>
        );
      }
      return (
        <Section theme={theme} className="relative overflow-hidden">
          {!light && <Botanical />}
          <Heading section={section} light={light} ctx={ctx} />
          <div className="relative grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour) => (
              <TourCard key={tour._id} tour={tour} hideDescription={shared.has(tour.shortDescription?.trim() ?? "")} />
            ))}
          </div>
        </Section>
      );
    }

    case "destinations": {
      const items = list<Destination>();
      if (!items.length) return null;
      // Design: "Popular Destinations" is a forest-green band between torn-paper edges.
      return (
        // Keep decorative foliage inside the green band and clear of neighbouring content.
        <Section theme={light ? theme : "forest"} className="relative isolate overflow-hidden pb-28 md:pb-20 md:[&>.container-page]:px-[clamp(6rem,10vw,9rem)]">
          <PaperEdge flip className="text-sand-50" />
          <FoliageCluster inset side="start" className="bottom-8 md:bottom-auto md:top-[38%]" />
          <FoliageCluster inset side="end" className="bottom-8 md:bottom-[15%]" />
          <Heading section={section} light ctx={ctx} />
          <div className="relative z-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((d) => (
              <DestinationCard key={d._id} destination={d} framed />
            ))}
          </div>
          <PaperEdge className="text-sand-50" />
        </Section>
      );
    }

    case "excursions": {
      const items = list<Excursion>();
      if (!items.length) return null;
      return (
        <Section theme={theme}>
          <Heading section={section} light={light} ctx={ctx} />
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((e) => (
              <ExcursionCard key={e._id} excursion={e} />
            ))}
          </div>
        </Section>
      );
    }

    case "vehicles": {
      const items = list<Vehicle>();
      if (!items.length) return null;
      // Design: text and button beside a row of real vehicle photos, then a few facts taken from the fleet data.
      const shown = items.filter((v) => v.images?.[0]?.url).slice(0, 3);
      // Only facts true for every vehicle shown (the section may list just part of the fleet, so no "up to" claims).
      const facts = items.every((v) => v.airConditioning) ? [{ icon: Snowflake, label: t("airConditioned") }] : [];
      return (
        <section className={cn("relative overflow-x-clip py-20 sm:py-24", light ? "bg-forest-900 text-white" : "bg-sand-100")}>
          <div className="container-page grid items-center gap-12 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]">
            <div>
              {section.eyebrow && <p className={cn("eyebrow mb-4", light && "text-gold-400")}>{section.eyebrow}</p>}
              {section.title && <h2 className={cn("text-4xl leading-tight sm:text-5xl", light ? "text-white" : "text-forest-900")}>{section.title}</h2>}
              {section.subtitle && <p className={cn("mt-5 max-w-md text-lg leading-relaxed", light ? "text-white/75" : "text-muted")}>{section.subtitle}</p>}
              <div className="mt-8">
                <Buttons section={section} ctx={ctx} light={light} />
              </div>
            </div>
            {shown.length > 0 ? (
              <ul className="flex items-end justify-center">
                {shown.map((v, i) => (
                  <li
                    key={v._id}
                    className={cn(
                      "relative min-w-0 flex-1",
                      i > 0 && "-ms-6 sm:-ms-10",
                      shown.length === 3 && i === 1 ? "z-10 -translate-y-3" : "z-0",
                    )}
                  >
                    <CmsLink href={`/vehicles/${v.slug}`} className="group block">
                      <CmsImage
                        media={v.images![0]}
                        alt={v.images![0].alt || v.name}
                        sizes="(min-width: 1024px) 22vw, 33vw"
                        wrapperClassName="aspect-[5/4] rounded-2xl border-4 border-white shadow-card"
                        className="transition-transform duration-700 group-hover:scale-105"
                      />
                      <span className={cn("mt-3 block truncate text-center text-sm font-semibold", light ? "text-white" : "text-forest-900")}>{v.name}</span>
                    </CmsLink>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
                {items.slice(0, 2).map((v) => (
                  <VehicleCard key={v._id} vehicle={v} />
                ))}
              </div>
            )}
          </div>
          {facts.length > 0 && (
            <ul className={cn("container-page mt-12 flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm lg:justify-end", light ? "text-white/80" : "text-forest-800")}>
              {facts.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon className={cn("h-5 w-5", light ? "text-gold-400" : "text-gold-600")} aria-hidden /> {label}
                </li>
              ))}
            </ul>
          )}
        </section>
      );
    }

    case "tailorMade": {
      const tm = await getTranslations("tailorMade");
      // Design: an ivory content panel beside a full-bleed photo, whatever theme is stored for the section.
      const light = false;
      const photo = section.media?.url ? section.media : ctx.photos?.[2] ?? ctx.photos?.[0] ?? editorialImages.road;
      return (
        <section className={cn("relative overflow-x-clip", light ? "bg-forest-900 text-white" : "bg-sand-50")}>
          <div className="grid lg:grid-cols-2">
            {/* Full-bleed photo with a wavy edge towards the content (design). */}
            <div className="relative min-h-[18rem] sm:min-h-[24rem] lg:min-h-[36rem]">
              <CmsImage media={photo} alt={photo.alt || section.title || ""} sizes="(min-width: 1024px) 50vw, 100vw" wrapperClassName="absolute inset-0" />
              <OrganicEdge className={cn("end-0 hidden lg:block rtl:-scale-x-100", light ? "text-forest-900" : "text-sand-50")} />
              <PaperEdge className={cn("lg:hidden", light ? "text-forest-900" : "text-sand-50")} />
              {section.badge && (
                <p className="absolute start-5 top-5 max-w-[11rem] rounded-2xl bg-gold-500 px-4 py-3 text-sm font-semibold leading-tight text-forest-950 shadow-card">
                  {section.badge}
                </p>
              )}
            </div>
            <div className="px-5 py-14 sm:px-10 sm:py-16 lg:px-14 lg:py-20 xl:px-20">
              <div className="max-w-xl">
                {section.eyebrow && <p className={cn("eyebrow mb-4", light && "text-gold-400")}>{section.eyebrow}</p>}
                {section.title && (
                  <h2 className={cn("mb-5 text-3xl leading-tight sm:text-5xl", light ? "text-white" : "text-forest-900")}>
                    <GoldText text={section.title} goldClass="font-display italic text-gold-500" />
                  </h2>
                )}
                {section.subtitle && <p className={cn("mb-6 text-lg leading-relaxed", light ? "text-white/80" : "text-muted")}>{section.subtitle}</p>}
                {section.content && <Markdown content={section.content} className={cn("mb-8", light && "[&_*]:text-white/85")} />}
                {section.items?.length ? (
                  <ul className="mb-8 flex flex-wrap gap-2">
                    {section.items.slice(0, 6).map((it, i) => (
                      <li key={`${it.title}-${i}`} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", light ? "border-white/20 text-white/85" : "border-forest-950/10 text-forest-800")}>
                        {it.title}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <Buttons section={section} ctx={ctx} light={light} />
                <ul className={cn("mt-10 grid grid-cols-2 border-t pt-8 sm:grid-cols-4", light ? "border-white/15" : "border-forest-950/10")}>
                  {INTEREST_TILES.map(({ key, icon: Icon }, i) => (
                    <li key={key} className={cn(i > 0 && "sm:border-s", light ? "border-white/15" : "border-forest-950/10")}>
                      <CmsLink
                        href="/tailor-made-tours"
                        className={cn(
                          "flex h-full flex-col items-center gap-2 px-2 py-3 text-center text-xs font-medium transition-colors",
                          light ? "text-white/85 hover:text-gold-400" : "text-forest-800 hover:text-gold-600",
                        )}
                      >
                        <Icon className={cn("h-8 w-8", light ? "text-gold-400" : "text-gold-600")} strokeWidth={1.4} aria-hidden />
                        {tm(`interests.${key}`)}
                      </CmsLink>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      );
    }

    case "cta":
      return <CtaBanner section={section} ctx={ctx} light={light} />;

    case "team": {
      // Owner first (large card), then managers and the rest of the team.
      const people = (section.items ?? []).filter((p) => p.title);
      if (!people.length) return null;
      const [lead, ...rest] = people;
      return (
        <Section theme={theme}>
          <Heading section={section} light={light} withAction={false} ctx={ctx} />
          <article className="mx-auto grid grid-cols-1 max-w-5xl items-center gap-8 overflow-hidden rounded-[2rem] bg-white shadow-card md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" data-testid="team-lead">
            <TeamPhoto person={lead} sizes="(min-width: 768px) 40vw, 100vw" className="relative aspect-[4/5] w-full md:h-full md:min-h-[24rem]" />
            <div className="p-8 md:p-10 md:ps-2">
              {lead.role && <p className="eyebrow mb-3">{lead.role}</p>}
              <h3 className="text-3xl text-forest-900 sm:text-4xl">{lead.title}</h3>
              {lead.description && <p className="mt-5 whitespace-pre-line text-lg leading-relaxed text-muted">{lead.description}</p>}
              {lead.url && (
                <a href={lead.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-forest-700 hover:text-gold-600">
                  <ExternalLink className="h-4 w-4" aria-hidden /> {lead.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </a>
              )}
            </div>
          </article>
          {rest.length > 0 && (
            <ul className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p, i) => (
                <li key={`${p.title}-${i}`} className="group overflow-hidden rounded-3xl bg-white text-center shadow-card">
                  <TeamPhoto
                    person={p}
                    sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
                    className="relative aspect-square w-full overflow-hidden [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-105"
                  />
                  <div className="p-6">
                    <h3 className="text-xl text-forest-900">{p.title}</h3>
                    {p.role && <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">{p.role}</p>}
                    {p.description && <p className="mt-3 text-sm leading-relaxed text-muted">{p.description}</p>}
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-forest-600 hover:text-gold-600" aria-label={`${p.title} – profile`}>
                        <ExternalLink className="h-4 w-4" aria-hidden />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      );
    }

    case "offer": {
      const to = await getTranslations("offer");
      const items = (section.items ?? []).filter((it) => it.title);
      const included = items.filter((it) => it.icon !== "star");
      const bonuses = items.filter((it) => it.icon === "star");
      return (
        <section className="bg-gradient-to-b from-sand-50 to-sand-100 px-4 py-16 sm:py-20" data-testid="offer-section">
          <div className="container-page max-w-6xl">
            {section.eyebrow && <h2 className="mb-10 text-center text-3xl text-forest-900 lg:text-5xl">{section.eyebrow}</h2>}
            <div className="relative overflow-hidden rounded-[2.25rem] border border-white/60 bg-white/85 px-8 pb-12 pt-24 shadow-card backdrop-blur lg:p-16 lg:pt-24">
              <div className="pointer-events-none absolute -end-20 -top-20 h-72 w-72 rounded-full bg-gold-200/40 blur-[120px]" aria-hidden />
              {section.badge && (
                <p className="absolute start-1/2 top-6 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-forest-700 to-forest-900 px-6 py-3 text-sm font-semibold text-gold-400 shadow-card rtl:translate-x-1/2">
                  {section.badge}
                </p>
              )}
              {section.title && <h3 className="mb-6 text-center text-3xl text-forest-900 lg:text-start lg:text-5xl">{section.title}</h3>}
              {section.subtitle && <p className="mb-12 max-w-2xl text-center text-lg leading-relaxed text-muted lg:text-start">{section.subtitle}</p>}
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
                {included.length > 0 && (
                  <div>
                    <h4 className="mb-6 font-sans text-xl font-semibold text-forest-900">{to("included")}</h4>
                    <ul className="space-y-4">
                      {included.map((it, i) => (
                        <li key={`${it.title}-${i}`} className="flex items-center gap-3 text-ink">
                          <Check className="h-5 w-5 shrink-0 text-forest-600" aria-hidden /> {it.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  {bonuses.length > 0 && (
                    <>
                      <h4 className="mb-6 font-sans text-xl font-semibold text-forest-900">{to("bonuses")}</h4>
                      <ul className="space-y-4">
                        {bonuses.map((it, i) => (
                          <li key={`${it.title}-${i}`} className="flex items-center gap-3 text-ink">
                            <Star className="h-5 w-5 shrink-0 fill-gold-500 text-gold-500" aria-hidden /> {it.title}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {section.price && (
                    <div className="mt-10 text-center lg:text-start">
                      <p className="text-muted">{to("priceLabel")}</p>
                      <p className="font-display text-5xl text-forest-800 lg:text-6xl">{section.price}</p>
                      {section.priceNote && <p className="mb-6 text-muted">{section.priceNote}</p>}
                    </div>
                  )}
                  <div className={cn("flex justify-center lg:justify-start", !section.price && "mt-10")}>
                    <Buttons section={section} ctx={ctx} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    case "gallery": {
      const items = list<GalleryItem>();
      if (!items.length) return null;
      const tg = await getTranslations("gallery");
      return (
        <Section theme={theme}>
          <Heading section={section} light={light} ctx={ctx} />
          <GalleryGrid
            items={items}
            variant={section.settings?.layout === "carousel" ? "marquee" : "strip"}
            labels={{ close: t("close"), previous: t("previous"), next: t("next"), all: t("all"), photos: tg("photos"), videos: tg("videos") }}
          />
        </Section>
      );
    }

    case "guestShorts": {
      const items = list<GuestShort>();
      if (!items.length) return null;
      return (
        <Section theme={theme}>
          <Heading section={section} light={light} ctx={ctx} />
          <GuestShortsGrid shorts={items} />
        </Section>
      );
    }

    case "reviews": {
      const items = list<Review>();
      if (!items.length) return null;
      return (
        <Section theme={theme}>
          <Heading section={section} light={light} ctx={ctx} />
          {section.settings?.layout === "carousel" ? (
            <Marquee
              items={items}
              getKey={(r) => r._id}
              label={section.title}
              itemClassName="w-[20rem] whitespace-normal sm:w-[26rem]"
              render={(r) => <ReviewCard review={r} />}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((r) => (
                <ReviewCard key={r._id} review={r} />
              ))}
            </div>
          )}
        </Section>
      );
    }

    case "tripadvisor": {
      const ta = section.data as TripAdvisorSummary | null;
      const profile = ta?.webUrl || ctx.settings?.tripadvisor?.profileUrl || ctx.settings?.social?.tripadvisor;
      const enabled = ctx.settings?.tripadvisor?.enabled !== false;
      if (!enabled || (!profile && !ta?.reviews?.length)) return null;
      const tr = await getTranslations("reviews");
      return (
        <Section theme={theme}>
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 rounded-[2rem] border border-sand-200 bg-white p-8 text-center shadow-card sm:p-12">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#34e0a1]/15 text-[#00aa6c]">
              <SocialIcons.tripadvisor className="h-9 w-9" />
            </span>
            <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} />
            {ta?.rating ? (
              <div className="-mt-6 flex flex-col items-center gap-2">
                <Stars rating={ta.rating} className="[&_svg]:h-6 [&_svg]:w-6" />
                <p className="text-sm text-muted">
                  {ta.rating.toFixed(1)} / 5 · {tr("basedOn", { count: ta.numReviews ?? 0 })}
                </p>
              </div>
            ) : ctx.settings?.tripadvisor?.ratingText ? (
              <p className="-mt-6 text-sm text-muted">{ctx.settings.tripadvisor.ratingText}</p>
            ) : null}
            {ta?.reviews?.length ? (
              <ul className="grid w-full gap-4 text-start md:grid-cols-3">
                {ta.reviews.slice(0, 3).map((r) => (
                  <li key={r.id} className="rounded-2xl bg-sand-50 p-5">
                    <Stars rating={r.rating} />
                    <p className="mt-2 font-medium text-forest-900">{r.title}</p>
                    <p className="mt-1 line-clamp-4 text-sm text-muted">{r.text}</p>
                    {r.user?.username && <p className="mt-3 text-xs text-muted">— {r.user.username}</p>}
                  </li>
                ))}
              </ul>
            ) : null}
            {profile && (
              <a href={profile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium text-forest-700 underline-offset-4 hover:underline">
                {tr("readOnTripadvisor")} <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            )}
          </div>
        </Section>
      );
    }

    case "blog": {
      const items = list<BlogPost>();
      if (!items.length) return null;
      return (
        <Section theme={theme}>
          <Heading section={section} light={light} ctx={ctx} />
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {items.map((p) => (
              <BlogCard key={p._id} post={p} />
            ))}
          </div>
        </Section>
      );
    }

    case "faqs": {
      const items = list<Faq>();
      if (!items.length) return null;
      return (
        <Section theme={theme}>
          <Heading section={section} light={light} withAction={false} ctx={ctx} />
          <div className="mx-auto max-w-3xl">
            <FaqList items={items} />
          </div>
        </Section>
      );
    }

    case "richText":
      return (
        <Section theme={theme}>
          <div className="mx-auto max-w-3xl">
            <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} light={light} align="left" />
            <Markdown content={section.content} className={light ? "[&_*]:text-white/85" : ""} />
            <div className="mt-8">
              <Buttons section={section} ctx={ctx} light={light} />
            </div>
          </div>
        </Section>
      );

    case "contact": {
      const s = ctx.settings;
      if (!s) return null;
      return (
        <Section theme={theme}>
          <Heading section={section} light={light} withAction={false} ctx={ctx} />
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              s.phone && { icon: Phone, label: s.phone, href: telLink(s.phone) },
              s.whatsapp && { icon: SocialIcons.whatsapp, label: s.whatsapp, href: whatsappLink(s.whatsapp, s.whatsappMessage) },
              s.email && { icon: Mail, label: s.email, href: `mailto:${s.email}` },
              s.businessHours && { icon: Clock, label: s.businessHours },
              s.address && { icon: MapPin, label: s.address, href: s.googleMapsUrl },
            ]
              .filter(Boolean)
              .map((row, i) => {
                const r = row as { icon: ComponentType<{ className?: string }>; label: string; href?: string };
                const Icon = r.icon;
                const inner = (
                  <>
                    <Icon className="h-5 w-5 shrink-0 text-gold-600" />
                    <span className="min-w-0 break-words [overflow-wrap:anywhere]">{r.label}</span>
                  </>
                );
                return (
                  <li key={i} className="rounded-2xl bg-white p-5 shadow-card">
                    {r.href ? (
                      <a href={r.href} className="flex items-start gap-3 text-forest-900 hover:text-forest-600" target={r.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                        {inner}
                      </a>
                    ) : (
                      <p className="flex items-start gap-3 text-forest-900">{inner}</p>
                    )}
                  </li>
                );
              })}
          </ul>
        </Section>
      );
    }

    default:
      return null;
  }
}

/** Renders CMS page sections in the order configured in Admin → Pages. */
function sectionSurface(section?: PageSection) {
  if (!section) return "var(--color-sand-50)";
  const theme = section.settings?.theme ?? "light";
  if (section.type === "hero" || section.type === "tailorMade") return "var(--color-sand-50)";
  if (section.type === "destinations") return isDark(theme) ? surfaceForTheme(theme) : "var(--color-forest-800)";
  if (section.type === "vehicles" || section.type === "cta") return isDark(theme) ? "var(--color-forest-900)" : "var(--color-sand-100)";
  if (section.type === "whyChooseUs") return isDark(theme) ? "var(--color-forest-900)" : "var(--color-sand-50)";
  if (section.type === "popularTours" && section.settings?.layout === "split") return "var(--color-forest-900)";
  return surfaceForTheme(theme);
}

function surfaceForTheme(theme: string) {
  return ({ light: "var(--color-sand-50)", sand: "var(--color-sand-100)", forest: "var(--color-forest-800)", dark: "var(--color-forest-950)" } as Record<string, string>)[theme] ?? "var(--color-sand-50)";
}

export async function PageRenderer({ sections, settings, preview }: { sections: PageSection[]; settings: SiteSettings | null; preview?: boolean }) {
  const visibleSections = sections.filter((section) => preview || section.enabled !== false);
  const categorisedTours = new Set(
    sections
      .filter((s) => s.type === "popularTours" && s.settings?.category && s.enabled !== false && Array.isArray(s.data))
      .flatMap((s) => (s.data as Tour[]).map((t) => t._id)),
  );
  const highlights = sections.find((s) => s.type === "whyChooseUs" && s.enabled !== false)?.items ?? [];
  const photos = sections
    .filter((s) => (s.type === "destinations" || s.type === "popularTours") && Array.isArray(s.data))
    .flatMap((s) => (s.data as (Destination | Tour)[]).map((d) => d.heroMedia))
    .filter((m): m is MediaAsset => Boolean(m?.url && m.resourceType !== "video"));
  const hasHero = sections.some((s) => s.type === "hero" && s.enabled !== false && Array.isArray(s.data) && s.data.length > 0);
  const ta = sections.find((s) => s.type === "tripadvisor" && s.enabled !== false)?.data as TripAdvisorSummary | null | undefined;
  const rating = ta?.configured && ta.rating && ta.numReviews ? { value: ta.rating, count: ta.numReviews } : undefined;
  // Closing CTA (design: a sunset beach): prefer a coastal destination's photo, else the first tour/destination photo.
  const coastal = sections
    .filter((s) => s.type === "destinations" && Array.isArray(s.data))
    .flatMap((s) => s.data as Destination[])
    .find((d) => d.heroMedia?.url && d.heroMedia.resourceType !== "video" && /beach|coast|bay|mirissa|bentota|unawatuna|trincomalee|arugam|hikkaduwa|galle|pasikudah/i.test(`${d.name} ${d.slug} ${d.category?.name ?? ""}`));
  const ctx: Ctx = { settings, preview, categorisedTours, highlights, photos: distinctPhotos(photos, 12), hasHero, rating, ctaPhoto: coastal?.heroMedia ?? photos[0] };
  // Empty CMS sections do not form a visual boundary. Resolve them before choosing neighbouring colours.
  const renderedSections = (await Promise.all(visibleSections.map(async (section) => ({
    section,
    content: await SectionView({ section, ctx }),
  })))).filter(({ content }) => content !== null);
  return (
    <>
      {renderedSections.map(({ section, content }, index) => (
        <div
          key={section._id}
          style={{
            "--previous-section-color": sectionSurface(renderedSections[index - 1]?.section),
            "--next-section-color": sectionSurface(renderedSections[index + 1]?.section),
          } as CSSProperties}
          data-section={section.type}
          // The hero contains the LCP text and image. It must paint at full opacity immediately instead of
          // waiting for the below-the-fold reveal observer to mark it visible.
          data-scroll-reveal={section.type === "hero" ? undefined : true}
          className={cn(preview && section.enabled === false && "relative opacity-60 outline-2 outline-dashed outline-gold-500")}
        >
          {content}
        </div>
      ))}
    </>
  );
}
