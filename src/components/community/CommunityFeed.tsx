// "use client": search, the menu filters and "load more while scrolling" all happen in the browser
"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Clapperboard, Images, ImagePlus, Loader2, Newspaper, Search, UserRound, Users, Video, X } from "lucide-react";
import type { Category, FeedItem, PaginationMeta, Story } from "@/types/cms";
import { API_URL } from "@/lib/config";
import { cn } from "@/lib/utils";
import { videoPoster } from "@/lib/cloudinary-loader";
import { useCustomerAuth } from "@/lib/customer/auth";
import { FEED_FILTERS, type FeedFilter } from "@/lib/feed";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { StoryCard } from "./StoryCard";
import { ArticlePostCard } from "./ArticlePostCard";

const PAGE_SIZE = 8;

const FILTER_ICONS = { all: Newspaper, stories: Users, reels: Clapperboard, photos: Images, articles: BookOpen };
const FILTER_LABELS = { all: "filterAll", stories: "filterStories", reels: "filterReels", photos: "filterPhotos", articles: "filterArticles" } as const;

interface Props {
  initialItems: FeedItem[];
  initialMeta: PaginationMeta;
  initialQuery: string;
  initialType: FeedFilter;
  /** Blog category slug from ?category= (shows only articles in it) */
  initialCategory?: string;
  /** Blog categories, listed under "Articles" in the menu */
  categories?: Category[];
  reels: Story[];
}

/**
 * Facebook-style community page: search bar, a menu on the left (feed / stories / reels / photos / articles),
 * a "share a moment" box, a row of reels and the mixed feed, which loads more posts as you scroll down.
 */
export function CommunityFeed({ initialItems, initialMeta, initialQuery, initialType, initialCategory, categories = [], reels }: Props) {
  const t = useTranslations("stories");
  const router = useRouter();
  const pathname = usePathname();
  const { customer } = useCustomerAuth();
  const [items, setItems] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [query, setQuery] = useState(initialQuery);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  // A new search or menu choice reloads the page on the server; start again from its first page
  const [shownFor, setShownFor] = useState({ items: initialItems, meta: initialMeta });
  if (shownFor.items !== initialItems) {
    setShownFor({ items: initialItems, meta: initialMeta });
    setItems(initialItems);
    setMeta(initialMeta);
    setFailed(false);
  }

  const hasMore = meta.page < meta.totalPages;

  // LOAD MORE: the next page from the API, added under the posts already shown
  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: String(meta.page + 1), limit: String(PAGE_SIZE), type: initialType });
      if (initialQuery) params.set("q", initialQuery);
      if (initialCategory) params.set("category", initialCategory);
      const res = await fetch(`${API_URL}/feed?${params}`, { headers: { accept: "application/json" } });
      const json = (await res.json()) as { data?: FeedItem[]; meta?: PaginationMeta };
      if (!res.ok || !json.data || !json.meta) throw new Error("feed");
      // Skip posts already on screen (a new post may have pushed one onto the next page)
      setItems((current) => [...current, ...json.data!.filter((n) => !current.some((c) => c._id === n._id))]);
      setMeta(json.meta);
    } catch {
      setFailed(true);
    } finally {
      setLoadingMore(false);
    }
  }

  // Load the next page automatically when the bottom of the feed comes into view
  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  });
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || failed) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && void loadMoreRef.current(), { rootMargin: "600px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, failed, meta.page]);

  // SEARCH and MENU: kept in the URL (?q=…&type=…) so results can be shared and the back button works
  function go(nextQuery: string, nextType: FeedFilter, nextCategory?: string) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextCategory) params.set("category", nextCategory);
    else if (nextType !== "all") params.set("type", nextType);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }
  function submitSearch(event: FormEvent) {
    event.preventDefault();
    go(query, initialType, initialCategory);
  }

  const searchBox = (
    <form role="search" onSubmit={submitSearch} className="relative">
      <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        maxLength={100}
        placeholder={t("searchPlaceholder")}
        aria-label={t("search")}
        className="h-12 w-full rounded-full border border-sand-200 bg-surface ps-12 pe-12 text-ink shadow-sm focus:border-forest-600 focus:outline-none"
      />
      {initialQuery && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            go("", initialType, initialCategory);
          }}
          aria-label={t("clearSearch")}
          className="absolute end-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-sand-100"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </form>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,40rem)_18rem] xl:justify-center">
      {/* LEFT MENU (a row of chips on phones) */}
      <nav aria-label={t("feedTitle")} className="min-w-0 lg:sticky lg:top-28 lg:self-start">
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
          {FEED_FILTERS.map((filter) => {
            const Icon = FILTER_ICONS[filter];
            const active = filter === initialType && !initialCategory;
            return (
              <li key={filter} className="shrink-0">
                <button
                  type="button"
                  onClick={() => go(initialQuery, filter)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors lg:rounded-2xl lg:py-3",
                    active ? "bg-forest-800 text-white" : "bg-surface text-brand hover:bg-sand-100 lg:bg-transparent",
                  )}
                >
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", active ? "bg-white/15" : "bg-gold-100 text-gold-600")}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  {t(FILTER_LABELS[filter])}
                </button>
              </li>
            );
          })}
          {/* BLOG CATEGORIES (articles only) */}
          {categories.map((category) => {
            const active = category.slug === initialCategory;
            return (
              <li key={category._id} className="shrink-0 lg:ps-11">
                <button
                  type="button"
                  onClick={() => go(initialQuery, "articles", category.slug)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "w-full rounded-full px-4 py-2.5 text-start text-sm transition-colors lg:rounded-xl lg:py-2",
                    active ? "bg-gold-500 font-medium text-forest-950" : "bg-surface text-muted hover:bg-sand-100 hover:text-brand lg:bg-transparent",
                  )}
                >
                  {category.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* MIDDLE: search, share box, reels row, feed */}
      <div className="min-w-0 space-y-6">
        {searchBox}

        {/* SHARE A MOMENT (opens the story form) */}
        <div className="rounded-3xl bg-surface p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-800 font-display text-lg text-gold-400" aria-hidden>
              {customer ? customer.name.charAt(0).toUpperCase() : <UserRound className="h-5 w-5" />}
            </span>
            <Link href="/stories/new" className="flex h-11 flex-1 items-center rounded-full bg-sand-100 px-5 text-sm text-muted transition-colors hover:bg-sand-200">
              {customer ? t("composerPromptNamed", { name: customer.name.split(" ")[0] }) : t("composerPrompt")}
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-3 border-t border-sand-100 pt-3 text-sm font-medium text-brand">
            <Link href="/stories/new" className="flex items-center justify-center gap-2 rounded-xl py-2 hover:bg-sand-50">
              <ImagePlus className="h-5 w-5 text-forest-600" aria-hidden /> {t("composerPhoto")}
            </Link>
            <Link href="/stories/new" className="flex items-center justify-center gap-2 rounded-xl py-2 hover:bg-sand-50">
              <Video className="h-5 w-5 text-rose-500" aria-hidden /> {t("composerVideo")}
            </Link>
            <Link href="/stories/new" className="flex items-center justify-center gap-2 rounded-xl py-2 hover:bg-sand-50">
              <BookOpen className="h-5 w-5 text-gold-600" aria-hidden /> {t("composerStory")}
            </Link>
          </div>
        </div>

        {/* REELS ROW (only on the main feed, when there are reels) */}
        {initialType === "all" && !initialQuery && reels.length > 0 && (
          <section className="rounded-3xl bg-surface p-4 shadow-card" aria-label={t("reelsRow")}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-sans text-base font-semibold text-heading">
                <Clapperboard className="h-5 w-5 text-rose-500" aria-hidden /> {t("reelsRow")}
              </h2>
              <Link href="/reels" className="text-sm font-semibold text-brand-soft hover:underline">
                {t("seeAllReels")}
              </Link>
            </div>
            <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {reels.map((reel) => {
                const video = reel.media.find((m) => m.resourceType === "video" && m.url);
                if (!video?.url) return null;
                return (
                  <li key={reel._id} className="shrink-0">
                    <Link href="/reels" className="group relative block h-48 w-28 overflow-hidden rounded-2xl bg-forest-900 sm:h-56 sm:w-32">
                      {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary video still frame, already resized by the URL */}
                      <img src={videoPoster(video.url, 360)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute inset-0 bg-linear-to-t from-forest-950/80 via-transparent to-transparent" />
                      <span className="absolute inset-x-2 bottom-2 line-clamp-2 text-xs font-semibold text-white">{reel.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* THE FEED */}
        {items.length > 0 ? (
          <div className="space-y-6">
            {items.map((item) => (item.kind === "story" ? <StoryCard key={item._id} story={item} /> : <ArticlePostCard key={item._id} post={item} />))}
          </div>
        ) : (
          <p className="rounded-3xl bg-surface p-10 text-center text-muted shadow-card">{initialQuery ? t("noResults", { q: initialQuery }) : t("feedEmpty")}</p>
        )}

        {/* LOAD MORE (automatic while scrolling; the button is the fallback) */}
        <div ref={sentinel} className="flex justify-center py-4">
          {hasMore ? (
            <button type="button" onClick={() => { setFailed(false); void loadMore(); }} disabled={loadingMore} className="inline-flex items-center gap-2 rounded-full border border-sand-200 bg-surface px-6 py-2.5 text-sm font-medium text-brand hover:border-brand disabled:opacity-60">
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {loadingMore ? t("loading") : t("loadMore")}
            </button>
          ) : (
            items.length > 0 && <p className="text-sm text-muted">{t("endOfFeed")}</p>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN (large screens): about the community + plan a trip */}
      <aside className="hidden space-y-6 xl:sticky xl:top-28 xl:block xl:self-start">
        <div className="rounded-3xl bg-surface p-6 shadow-card">
          <h2 className="font-sans text-base font-semibold text-heading">{t("aboutTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t("aboutText")}</p>
        </div>
        <div className="rounded-3xl bg-forest-800 p-6 text-white shadow-card">
          <h2 className="font-display text-xl">{t("planTrip")}</h2>
          <p className="mt-2 text-sm text-white/75">{t("planTripText")}</p>
          <Link href="/tailor-made-tours" className="mt-4 inline-flex rounded-full bg-gold-500 px-5 py-2.5 text-sm font-medium text-forest-950 hover:bg-gold-400">
            {t("planTripButton")}
          </Link>
        </div>
      </aside>
    </div>
  );
}
