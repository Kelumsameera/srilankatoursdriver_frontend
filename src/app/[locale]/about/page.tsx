import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpRight, Award, CheckCircle2, Heart, Shield, Star, Users } from "lucide-react";
import { getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { Markdown } from "@/components/ui/Markdown";
import { PageRenderer } from "@/components/sections/PageRenderer";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const [data, t] = await Promise.all([getPage("about", locale), getTranslations({ locale, namespace: "about" })]);
  return buildMetadata({
    locale,
    path: "/about",
    routeKey: "about",
    seo: data?.page.seo,
    title: data?.page.title || t("title"),
    description: data?.page.subtitle || data?.page.content || t("desc1"),
    image: data?.page.heroImage,
  });
}

const REASONS = [
  { key: "licensed", icon: Shield },
  { key: "rated", icon: Star },
  { key: "private", icon: Users },
  { key: "passionate", icon: Heart },
  { key: "pata", icon: Award },
  { key: "transparent", icon: CheckCircle2 },
] as const;

const STATS = [
  { value: "10+", key: "experience" },
  { value: "5000+", key: "travelers" },
  { value: "24/7", key: "support" },
  { value: "100%", key: "certified" },
] as const;

/**
 * About us. Title, subtitle, photo, story text, SEO and extra sections come from an optional
 * "about" page in Admin → Pages; the story, checklist, stats and reasons fall back to the
 * translated texts carried over from the original site.
 */
export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [data, settings, t] = await Promise.all([getPage("about", locale), getSiteSettings(locale), getTranslations("about")]);
  const page = data?.page;

  return (
    <>
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(-45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "16px 16px" }}
          aria-hidden
        />
        <div className="container-page pb-16 pt-36 text-center sm:pb-20 sm:pt-44">
          <h1 className="mx-auto max-w-4xl animate-fade-up text-4xl leading-tight sm:text-5xl lg:text-6xl">{page?.title || t("title")}</h1>
          {page?.subtitle && <p className="mx-auto mt-5 max-w-2xl animate-fade-up text-lg text-white/80 [animation-delay:120ms]">{page.subtitle}</p>}
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="container-page grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
            <CmsImage media={page?.heroImage} alt={page?.heroImage?.alt || page?.title || t("title")} sizes="(min-width: 1024px) 50vw, 100vw" wrapperClassName="aspect-[4/5] rounded-[2.5rem] shadow-card" />
            <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-white/90 p-6 shadow-card backdrop-blur sm:inset-x-8 sm:bottom-8">
              <p className="font-display text-xl italic text-forest-700">{t("heading")}</p>
              <p className="font-display text-3xl font-semibold uppercase tracking-tight text-gold-600">{t("headingHighlight")}</p>
            </div>
          </div>

          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-0.5 w-10 bg-gold-500" aria-hidden />
              <span className="eyebrow">{t("label")}</span>
            </div>
            <h2 className="mb-8 text-4xl leading-[1.1] text-forest-900 lg:text-5xl">
              {t("heading")}{" "}
              <span className="text-forest-600 underline decoration-gold-400 decoration-2 underline-offset-8">{t("headingHighlight")}</span> {t("headingEnd")}
            </h2>
            {page?.content ? (
              <Markdown content={page.content} className="mb-10 text-lg" />
            ) : (
              <div className="mb-10 space-y-5 text-lg leading-relaxed text-muted">
                <p>{t("desc1")}</p>
                <p>{t("desc2")}</p>
              </div>
            )}
            <ul className="mb-12 grid gap-4 sm:grid-cols-2">
              {(["item1", "item2", "item3", "item4"] as const).map((k) => (
                <li key={k} className="flex items-center gap-3">
                  <span className="rounded-full bg-forest-50 p-1">
                    <CheckCircle2 className="h-4 w-4 text-forest-600" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-ink">{t(`checklist.${k}`)}</span>
                </li>
              ))}
            </ul>
            <CmsLink
              href="/contact"
              className="group inline-flex items-center gap-3 rounded-full bg-forest-900 px-9 py-4 font-semibold text-white shadow-card transition-colors hover:bg-gold-500 hover:text-forest-950"
            >
              {t("cta")}
              <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100" />
            </CmsLink>
          </div>
        </div>
      </section>

      <section className="bg-white pb-20 sm:pb-28">
        <dl className="container-page grid grid-cols-2 gap-5 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.key} className="flex flex-col-reverse rounded-[2rem] border border-sand-200 bg-sand-50 p-8 text-center sm:p-10">
              <dt className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold-600">{t(`stats.${s.key}`)}</dt>
              <dd className="font-display text-4xl text-forest-900 sm:text-5xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-sand-100 py-20 sm:py-28">
        <ul className="container-page grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {REASONS.map(({ key, icon: Icon }) => (
            <li key={key} className="group rounded-[2.5rem] bg-white p-9 shadow-sm transition-shadow hover:shadow-card">
              <span className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-50 transition-colors group-hover:bg-forest-800">
                <Icon className="h-7 w-7 text-forest-600 transition-colors group-hover:text-gold-400" aria-hidden />
              </span>
              <h3 className="mb-3 text-xl text-forest-900">{t(`reasons.${key}.title`)}</h3>
              <p className="text-sm leading-relaxed text-muted">{t(`reasons.${key}.desc`)}</p>
            </li>
          ))}
        </ul>
      </section>

      {data && data.sections.length > 0 && <PageRenderer sections={data.sections.filter((s) => s.type !== "hero")} settings={settings} />}
    </>
  );
}
