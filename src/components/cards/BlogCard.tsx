import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import type { BlogPost } from "@/types/cms";
import { formatDate } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { travelImageFor } from "@/lib/editorial-images";

// Blog card: cover photo, category + date + reading time, title (the whole card is a link), excerpt, "Read more"
export function BlogCard({ post }: { post: BlogPost }) {
  const tCommon = useTranslations("common");
  const locale = useLocale();
  // A video can't be a card picture, so fall back to a matching editorial photo
  const cover = post.coverImage?.url && post.coverImage.resourceType !== "video"
    ? post.coverImage
    : travelImageFor(`${post.slug} ${post.title} ${post.category?.name ?? ""}`);

  return (
    <article className="group relative flex h-full flex-col">
      {/* IMAGE */}
      <CmsImage
        media={cover}
        alt={cover.alt || post.title}
        sizes="(min-width: 1024px) 33vw, 100vw"
        wrapperClassName="aspect-[16/10] rounded-3xl"
        depth
        className="transition-transform duration-700 group-hover:scale-105"
      />

      <div className="flex flex-1 flex-col pt-5">
        {/* CATEGORY · DATE · READING TIME */}
        <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {post.category?.name && <span className="font-semibold uppercase tracking-wider text-gold-600">{post.category.name}</span>}
          {post.publishDate && <time dateTime={post.publishDate}>{formatDate(post.publishDate, locale)}</time>}
          {post.readingMinutes ? <span>· {tCommon("minRead", { count: post.readingMinutes })}</span> : null}
        </p>

        {/* TITLE: stretched link, the whole card opens the post */}
        <h3 className="mt-2 font-display text-xl leading-snug text-forest-900">
          <CmsLink href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </CmsLink>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{post.excerpt}</p>}

        {/* READ MORE */}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 transition-colors group-hover:text-forest-800" aria-hidden>
          {tCommon("readMore")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}
