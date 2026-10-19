import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PenLine } from "lucide-react";
import { getStories } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/config";
import { EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/Button";
import { ReelsPlayer } from "@/components/community/ReelsPlayer";

type Props = { params: Promise<{ locale: string }> };

// generateMetadata is Next.js's way to set the <title> and SEO tags. It runs on the server before the page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "stories" });
  return buildMetadata({ locale, path: "/reels", routeKey: "reels", title: t("reelsTitle"), description: t("reelsSubtitle") });
}

// Reels: published guest stories that have a video, newest first, one per screen
export default async function ReelsPage({ params }: Props) {
  const { locale } = await params;
  // Tells next-intl which language this page is rendered in
  setRequestLocale(locale);
  const [list, t] = await Promise.all([getStories({ video: true, limit: 30 }), getTranslations("stories")]);

  // Room for the fixed header (64px, 80px from xl). Keep in sync with components/site/SiteHeader.tsx
  return (
    <div className="bg-forest-950 pt-16 xl:pt-20">
      <h1 className="sr-only">{t("reelsTitle")}</h1>
      {list?.items.length ? (
        <ReelsPlayer stories={list.items} shareBase={`${SITE_URL}/${locale}`} />
      ) : (
        <div className="container-page max-w-2xl py-section">
          <EmptyState text={t("reelsEmpty")} />
          <div className="mt-6 flex justify-center">
            <ButtonLink href="/stories/new">
              <PenLine className="h-4 w-4" aria-hidden /> {t("shareYourStory")}
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
