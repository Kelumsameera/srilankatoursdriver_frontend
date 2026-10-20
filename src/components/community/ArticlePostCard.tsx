import { useLocale, useTranslations } from "next-intl";
import { BookOpen, Heart, MessageCircle } from "lucide-react";
import type { BlogPost } from "@/types/cms";
import { formatDate } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";

/** A blog article shown in the community feed, laid out like a page's post on social media. */
export function ArticlePostCard({ post }: { post: BlogPost & { likeCount?: number; commentCount?: number } }) {
  const t = useTranslations("stories");
  const locale = useLocale();
  const href = `/blog/${post.slug}`;

  return (
    <article className="dest-card overflow-hidden rounded-3xl bg-surface shadow-card">
      {/* WHO (the company), WHEN, WHAT KIND */}
      <header className="flex items-center gap-3 p-5 pb-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-500 text-forest-950" aria-hidden>
          <BookOpen className="h-5 w-5" />
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-heading">{post.author || t("teamName")}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-muted">
            {post.publishDate && <time dateTime={post.publishDate}>{formatDate(post.publishDate, locale, { dateStyle: "medium" })}</time>}
            <span>· {post.category?.name || t("article")}</span>
          </p>
        </div>
      </header>

      {/* TITLE + EXCERPT */}
      <div className="px-5 pb-4">
        <h2 className="font-display text-2xl leading-snug text-heading">
          <CmsLink href={href} className="hover:underline">
            {post.title}
          </CmsLink>
        </h2>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-ink/85">{post.excerpt}</p>}
      </div>

      {/* COVER PHOTO */}
      {post.coverImage?.url && post.coverImage.resourceType !== "video" && (
        <CmsLink href={href} className="block" ariaLabel={t("readArticle")}>
          <CmsImage media={post.coverImage} alt={post.coverImage.alt || post.title} sizes="(min-width: 768px) 640px, 100vw" wrapperClassName="aspect-[16/9]" depth />
        </CmsLink>
      )}

      {/* LIKES, COMMENTS, READ MORE */}
      <footer className="flex items-center justify-between gap-3 px-5 py-4 text-sm text-muted">
        <span className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-rose-500" aria-hidden /> {t("likeCount", { count: post.likeCount ?? 0 })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4 text-gold-600" aria-hidden /> {t("commentCount", { count: post.commentCount ?? 0 })}
          </span>
        </span>
        <CmsLink href={href} className="font-semibold text-brand underline-offset-4 hover:underline">
          {t("readArticle")}
        </CmsLink>
      </footer>
    </article>
  );
}
