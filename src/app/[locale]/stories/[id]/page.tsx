import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPin } from "lucide-react";
import { getStory } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import { videoPoster, videoUrl } from "@/lib/cloudinary-loader";
import { CmsImage } from "@/components/ui/CmsImage";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Engagement } from "@/components/community/Engagement";

// /en/stories/6720… -> Next.js gives us the locale and the story id from the URL
type Props = { params: Promise<{ locale: string; id: string }> };

// generateMetadata is Next.js's way to set the <title> and SEO tags. It runs on the server before the page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const story = await getStory(id);
  if (!story) return {};
  const photo = story.media.find((m) => m.resourceType !== "video");
  return buildMetadata({ locale, path: `/stories/${id}`, title: story.title, description: story.text, image: photo, type: "article", publishedTime: story.publishedAt });
}

// Server component: one published guest story with all its photos / video, then likes, sharing and comments
export default async function StoryPage({ params }: Props) {
  const { locale, id } = await params;
  // Tells next-intl which language this page is rendered in
  setRequestLocale(locale);
  const [story, t, tCommon] = await Promise.all([getStory(id), getTranslations("stories"), getTranslations("common")]);
  // Unknown or unpublished story: notFound() shows the site's 404 page with a real 404 status
  if (!story) notFound();

  const media = story.media.filter((m) => m.url);

  return (
    <article className="pb-section pt-32 sm:pt-36">
      <div className="container-page max-w-3xl">
        <Breadcrumbs locale={locale} onLight items={[{ label: tCommon("home"), href: "/" }, { label: t("feedTitle"), href: "/blog" }, { label: story.title }]} />

        {/* WHO, WHEN, WHERE + TITLE */}
        <header className="mt-6 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest-800 font-display text-xl text-gold-400" aria-hidden>
            {story.authorName.charAt(0).toUpperCase()}
          </span>
          <div className="text-sm">
            <p className="font-semibold text-forest-900">{story.authorName}</p>
            <p className="flex flex-wrap items-center gap-x-2 text-muted">
              {story.publishedAt && <time dateTime={story.publishedAt}>{formatDate(story.publishedAt, locale, { dateStyle: "long" })}</time>}
              {story.place && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-gold-600" aria-hidden /> {story.place}
                </span>
              )}
            </p>
          </div>
        </header>
        <h1 className="mt-6 text-4xl leading-tight text-forest-900 sm:text-5xl">{story.title}</h1>

        {/* STORY TEXT (plain text from the guest, line breaks kept) */}
        <p className="mt-6 whitespace-pre-line text-lead leading-relaxed text-ink/90">{story.text}</p>

        {/* PHOTOS AND VIDEO */}
        {media.length > 0 && (
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {media.map((m, i) =>
              m.resourceType === "video" ? (
                <video
                  key={m.publicId ?? m.url}
                  src={videoUrl(m.url!, 1280)}
                  poster={videoPoster(m.url!, 1280)}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full rounded-2xl bg-forest-950 shadow-card sm:col-span-2"
                />
              ) : (
                <CmsImage
                  key={m.publicId ?? m.url}
                  media={m}
                  alt={m.alt || `${story.title} – ${i + 1}`}
                  sizes="(min-width: 768px) 384px, 100vw"
                  wrapperClassName={i === 0 && media.length % 2 === 1 ? "aspect-[4/3] rounded-2xl shadow-card sm:col-span-2" : "aspect-[4/3] rounded-2xl shadow-card"}
                  markIllustrative={false}
                  depth
                />
              ),
            )}
          </div>
        )}

        {/* LIKES, SHARE BUTTONS, COMMENTS */}
        <Engagement type="story" id={story._id} title={story.title} url={`${SITE_URL}/${locale}/stories/${story._id}`} path={`/stories/${story._id}`} />
      </div>
    </article>
  );
}
