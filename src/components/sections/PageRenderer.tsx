import type { ComponentType } from "react";
import { getTranslations } from "next-intl/server";
import { Check, ExternalLink, MapPin, Phone, Mail, Clock, Star } from "lucide-react";
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
import { Marquee } from "@/components/ui/Marquee";

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
      badge={section.badge}
      light={light}
      align={withAction && section.buttons?.length ? "left" : "center"}
      action={withAction ? <Buttons section={section} ctx={ctx} light={light} /> : undefined}
    />
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

/** Centred call-to-action banner (CTA sections, and tailor-made sections without a photo). */
function CtaBanner({ section, ctx, light }: { section: PageSection; ctx: Ctx; light: boolean }) {
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

    case "tailorMade": {
      if (!section.media?.url) return <CtaBanner section={section} ctx={ctx} light={light} />;
      return (
        <section className={cn("relative overflow-hidden py-20 sm:py-24", light ? "bg-forest-900 text-white" : "bg-sand-100")}>
          <div className="pointer-events-none absolute -end-24 -top-20 h-96 w-96 rounded-full bg-gold-200/40 blur-[100px]" aria-hidden />
          <div className="container-page relative grid items-center gap-14 lg:grid-cols-2 xl:gap-24">
            <div className="relative">
              <div className="pointer-events-none absolute -start-5 -top-5 h-52 w-52 rounded-3xl border border-gold-400/60" aria-hidden />
              <div className="pointer-events-none absolute -bottom-5 -end-5 h-36 w-36 rounded-2xl border border-forest-600/30" aria-hidden />
              <div className="group relative h-[26rem] overflow-hidden rounded-3xl border border-gold-400/70 shadow-card">
                <CmsImage
                  media={section.media}
                  alt={section.media.alt || section.title || ""}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  wrapperClassName="absolute inset-0"
                  className="transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-forest-950/15 to-transparent" aria-hidden />
                <div className="absolute inset-x-0 bottom-0 p-8 sm:p-10">
                  {section.eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">{section.eyebrow}</p>}
                  {section.items?.length ? (
                    <ul className="flex flex-wrap gap-2">
                      {section.items.slice(0, 4).map((it, i) => (
                        <li key={`${it.title}-${i}`} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-sm">
                          {it.title}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
              {section.badge && (
                <p className="absolute -end-4 top-1/2 max-w-[9rem] -translate-y-1/2 rounded-2xl bg-gold-500 px-5 py-4 text-sm font-semibold leading-tight text-forest-950 shadow-card">
                  {section.badge}
                </p>
              )}
            </div>
            <div>
              {section.eyebrow && (
                <div className="mb-6 flex items-center gap-3">
                  <span className="h-px w-10 bg-gold-500" aria-hidden />
                  <span className={cn("eyebrow", light && "text-gold-400")}>{section.eyebrow}</span>
                </div>
              )}
              {section.title && <h2 className={cn("mb-6 text-3xl leading-tight sm:text-5xl", light ? "text-white" : "text-forest-900")}>{section.title}</h2>}
              {section.subtitle && <p className={cn("mb-6 text-lg leading-relaxed", light ? "text-white/80" : "text-muted")}>{section.subtitle}</p>}
              {section.content && <Markdown content={section.content} className={cn("mb-8", light && "[&_*]:text-white/85")} />}
              <Buttons section={section} ctx={ctx} light={light} />
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
          <article className="mx-auto grid max-w-5xl items-center gap-8 overflow-hidden rounded-[2rem] bg-white shadow-card md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" data-testid="team-lead">
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
              <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
