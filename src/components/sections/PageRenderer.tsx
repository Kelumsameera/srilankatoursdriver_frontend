import type { ComponentType } from "react";
import { getTranslations } from "next-intl/server";
import { Check, ExternalLink, MapPin, Phone, Mail, Clock } from "lucide-react";
import type {
  BlogPost,
  Destination,
  Excursion,
  Faq,
  GalleryItem,
  GuestShort,
  HeroSlide,
  PageSection,
  Review,
  SiteSettings,
  Tour,
  TripAdvisorSummary,
  Vehicle,
} from "@/types/cms";
import { cn, telLink, whatsappLink } from "@/lib/utils";
import { ButtonLink, type ButtonVariant } from "@/components/ui/Button";
import { CmsImage } from "@/components/ui/CmsImage";
import { Markdown } from "@/components/ui/Markdown";
import { Section, SectionHeading, Stars } from "@/components/ui/misc";
import { FeatureIcon, SocialIcons } from "@/components/ui/icons";
import { BlogCard, DestinationCard, ExcursionCard, ReviewCard, TourCard, VehicleCard } from "@/components/cards/cards";
import { HeroSlider } from "./HeroSlider";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { GuestShortsGrid } from "./GuestShorts";
import { FaqList } from "./FaqList";

interface Ctx {
  settings: SiteSettings | null;
  preview?: boolean;
}

const isDark = (theme?: string) => theme === "forest" || theme === "dark";

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
      light={light}
      align={withAction && section.buttons?.length ? "left" : "center"}
      action={withAction ? <Buttons section={section} ctx={ctx} light={light} /> : undefined}
    />
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
      return (
        <HeroSlider
          slides={slides}
          whatsapp={{ phone: ctx.settings?.whatsapp, message: ctx.settings?.whatsappMessage }}
          labels={{ previous: t("previous"), next: t("next") }}
        />
      );
    }

    case "whyChooseUs":
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
      const tours = list<Tour>();
      if (!tours.length) return null;
      return (
        <Section theme={theme}>
          <Heading section={section} light={light} ctx={ctx} />
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour) => (
              <TourCard key={tour._id} tour={tour} />
            ))}
          </div>
        </Section>
      );
    }

    case "destinations": {
      const items = list<Destination>();
      if (!items.length) return null;
      return (
        <Section theme={theme}>
          <Heading section={section} light={light} ctx={ctx} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((d, i) => (
              <div key={d._id} className={cn(i % 4 === 1 || i % 4 === 3 ? "lg:translate-y-8" : "")}>
                <DestinationCard destination={d} />
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "excursions": {
      const items = list<Excursion>();
      if (!items.length) return null;
      return (
        <Section theme={theme}>
          <Heading section={section} light={light} ctx={ctx} />
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
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
      return (
        <Section theme={theme}>
          <Heading section={section} light={light} ctx={ctx} />
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((v) => (
              <VehicleCard key={v._id} vehicle={v} />
            ))}
          </div>
        </Section>
      );
    }

    case "tailorMade":
    case "cta": {
      const hasMedia = Boolean(section.media?.url);
      return (
        <section className={cn("relative isolate overflow-hidden py-24 sm:py-28", light ? "bg-forest-900 text-white" : "bg-sand-100")}>
          {hasMedia && (
            <>
              <CmsImage media={section.media} alt="" wrapperClassName="absolute inset-0 -z-20" />
              <div className="absolute inset-0 -z-10 bg-forest-950/70" />
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

    case "gallery": {
      const items = list<GalleryItem>();
      if (!items.length) return null;
      const tg = await getTranslations("gallery");
      return (
        <Section theme={theme}>
          <Heading section={section} light={light} ctx={ctx} />
          <GalleryGrid
            items={items}
            variant="strip"
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <ReviewCard key={r._id} review={r} />
            ))}
          </div>
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
                    <p className="mt-3 text-xs text-muted">— {r.user.username}</p>
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
          <div className="grid gap-10 md:grid-cols-3">
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
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                    <span className="break-words">{r.label}</span>
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
export async function PageRenderer({ sections, settings, preview }: { sections: PageSection[]; settings: SiteSettings | null; preview?: boolean }) {
  const ctx: Ctx = { settings, preview };
  return (
    <>
      {sections.map((section) => (
        <div
          key={section._id}
          data-section={section.type}
          className={cn(preview && section.enabled === false && "relative opacity-60 outline-2 outline-dashed outline-gold-500")}
        >
          <SectionView section={section} ctx={ctx} />
        </div>
      ))}
    </>
  );
}
