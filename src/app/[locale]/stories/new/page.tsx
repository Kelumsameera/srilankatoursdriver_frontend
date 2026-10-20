import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { StoryForm } from "@/components/community/StoryForm";

type Props = { params: Promise<{ locale: string }> };

// A personal form page: not useful in search results
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "stories" });
  return { title: t("formTitle"), robots: { index: false, follow: false } };
}

// "Share your story" page: the form itself is a client component (uploads, previews)
export default async function NewStoryPage({ params }: Props) {
  const { locale } = await params;
  // Tells next-intl which language this page is rendered in
  setRequestLocale(locale);
  const [t, tCommon] = await Promise.all([getTranslations("stories"), getTranslations("common")]);

  return (
    <section className="pb-section pt-32 sm:pt-36">
      <div className="container-page max-w-2xl">
        <Breadcrumbs locale={locale} onLight items={[{ label: tCommon("home"), href: "/" }, { label: t("feedTitle"), href: "/blog" }, { label: t("shareYourStory") }]} />
        <h1 className="mt-6 text-4xl leading-tight text-heading sm:text-5xl">{t("formTitle")}</h1>
        <p className="mb-8 mt-4 text-lead text-muted">{t("formIntro")}</p>
        <StoryForm />
      </div>
    </section>
  );
}
