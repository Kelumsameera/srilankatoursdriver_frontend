import { useLocale, useTranslations } from "next-intl";
import { Heart, MapPin, MessageCircle, Play } from "lucide-react";
import type { MediaAsset, Story } from "@/types/cms";
import { cn, formatDate } from "@/lib/utils";
import { videoPoster } from "@/lib/cloudinary-loader";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";

// One photo (or a video's still frame with a play button) in the card's photo grid
function StoryMediaTile({ media, alt, className }: { media: MediaAsset; alt: string; className?: string }) {
  if (media.resourceType === "video" && media.url) {
    return (
      <div className={cn("relative overflow-hidden bg-forest-900", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary video still frame, already resized by the URL */}
        <img src={videoPoster(media.url, 800)} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-forest-900 shadow-lg">
            <Play className="h-6 w-6 fill-current" />
          </span>
        </span>
      </div>
    );
  }
  return <CmsImage media={media} alt={alt} sizes="(min-width: 768px) 640px, 100vw" wrapperClassName={className} markIllustrative={false} />;
}

/** A guest story in the feed, laid out like a social media post: who, where, text, photos, likes and comments. */
export function StoryCard({ story }: { story: Story }) {
  const t = useTranslations("stories");
  const locale = useLocale();
  const media = story.media.filter((m) => m.url);
  const shown = media.slice(0, 3);
  const extra = media.length - shown.length;
  const href = `/stories/${story._id}`;

  return (
    <article className="dest-card overflow-hidden rounded-3xl bg-surface shadow-card">
      {/* WHO, WHEN, WHERE */}
      <header className="flex items-center gap-3 p-5 pb-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-800 font-display text-lg text-gold-400" aria-hidden>
          {story.authorName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-heading">{story.authorName}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-muted">
            {story.publishedAt && <time dateTime={story.publishedAt}>{formatDate(story.publishedAt, locale, { dateStyle: "medium" })}</time>}
            {story.place && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gold-600" aria-hidden /> {story.place}
              </span>
            )}
          </p>
        </div>
      </header>

      {/* TITLE + TEXT */}
      <div className="px-5 pb-4">
        <h2 className="font-display text-2xl leading-snug text-heading">
          <CmsLink href={href} className="hover:underline">
            {story.title}
          </CmsLink>
        </h2>
        <p className="mt-2 line-clamp-4 whitespace-pre-line text-ink/85">{story.text}</p>
      </div>

      {/* PHOTOS: one big, or one big + two small (the last one says how many more there are) */}
      {shown.length > 0 && (
        <CmsLink href={href} className={cn("grid gap-1", shown.length > 1 && "grid-cols-2")} ariaLabel={t("readStory")}>
          {shown.map((m, i) => (
            <div key={m.publicId ?? m.url} className={cn("relative", shown.length === 3 && i === 0 && "row-span-2")}>
              <StoryMediaTile
                media={m}
                alt={m.alt || story.title}
                className={cn("h-full", shown.length === 1 ? "aspect-[4/3]" : shown.length === 2 ? "aspect-square" : i === 0 ? "min-h-full" : "aspect-[4/3]")}
              />
              {extra > 0 && i === shown.length - 1 && (
                <span className="absolute inset-0 flex items-center justify-center bg-forest-950/55 font-display text-2xl text-white">{t("morePhotos", { count: extra })}</span>
              )}
            </div>
          ))}
        </CmsLink>
      )}

      {/* LIKES, COMMENTS, READ MORE */}
      <footer className="flex items-center justify-between gap-3 px-5 py-4 text-sm text-muted">
        <span className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-rose-500" aria-hidden /> {t("likeCount", { count: story.likeCount ?? 0 })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4 text-gold-600" aria-hidden /> {t("commentCount", { count: story.commentCount ?? 0 })}
          </span>
        </span>
        <CmsLink href={href} className="font-semibold text-brand underline-offset-4 hover:underline">
          {t("readStory")}
        </CmsLink>
      </footer>
    </article>
  );
}
