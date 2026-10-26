import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { REVALIDATE_SECONDS, SERVER_API_URL } from "@/lib/config";
import type {
  ApiEnvelope,
  BlogPost,
  Branding,
  Category,
  Destination,
  Excursion,
  Faq,
  FeedItem,
  GalleryItem,
  GuestShort,
  Language,
  NavItem,
  PageResponse,
  PaginationMeta,
  Review,
  SeoMetadata,
  SiteSettings,
  Story,
  Tour,
  TripAdvisorSummary,
  Vehicle,
} from "@/types/cms";

/** Cache tags – must match backend/src/services/revalidate.service.ts */
export const TAGS = {
  settings: "settings",
  branding: "branding",
  navigation: "navigation",
  pages: "pages",
  hero: "hero",
  tours: "tours",
  destinations: "destinations",
  excursions: "excursions",
  vehicles: "vehicles",
  categories: "categories",
  gallery: "gallery",
  blog: "blog",
  stories: "stories",
  guestShorts: "guest-shorts",
  reviews: "reviews",
  faqs: "faqs",
  seo: "seo",
  translations: "translations",
  languages: "languages",
} as const;

/** Every content tag – pages that embed many content types (homepage) depend on all of them. */
const ALL_CONTENT_TAGS = Object.values(TAGS);

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface FetchOptions {
  tags?: string[];
  revalidate?: number | false;
  noStore?: boolean;
}

async function apiGet<T>(path: string, opts: FetchOptions = {}): Promise<{ data: T; meta?: PaginationMeta }> {
  const url = `${SERVER_API_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        accept: "application/json",
        ...(process.env.REVALIDATE_SECRET ? { "x-revalidate-secret": process.env.REVALIDATE_SECRET } : {}),
      },
      ...(opts.noStore
        ? { cache: "no-store" as const }
        : { next: { revalidate: opts.revalidate ?? REVALIDATE_SECONDS, tags: [...(opts.tags ?? []), TAGS.translations] } }),
    });
  } catch (err) {
    unstable_rethrow(err);
    throw new ApiRequestError(503, `API unreachable at ${SERVER_API_URL}: ${(err as Error).message}`);
  }
  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !body?.success) throw new ApiRequestError(res.status, body?.message ?? `Request failed: ${res.status}`);
  return { data: body.data, meta: body.meta };
}

/** Returns null instead of throwing (used where the page can still render without the data). */
async function orNull<T>(p: Promise<{ data: T }>): Promise<T | null> {
  try {
    return (await p).data;
  } catch (err) {
    unstable_rethrow(err);
    if (process.env.NODE_ENV !== "production" || !(err instanceof ApiRequestError) || err.status >= 500) {
      console.warn("[api]", (err as Error).message);
    }
    return null;
  }
}

const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : "";
};

// React `cache` de-duplicates identical calls within one render (layout + page + metadata).
export const getSiteSettings = cache((locale: string) =>
  orNull(apiGet<SiteSettings>(`/site-settings${qs({ locale })}`, { tags: [TAGS.settings] })),
);
export const getBranding = cache(() => orNull(apiGet<Branding>("/branding", { tags: [TAGS.branding] })));
export const getNavigation = cache((locale: string) => orNull(apiGet<NavItem[]>(`/navigation${qs({ locale })}`, { tags: [TAGS.navigation] })));
export const getLanguages = cache(() => orNull(apiGet<Language[]>("/languages", { tags: [TAGS.languages] })));
/** Admin overrides of website UI texts for one language ({ "nav.tours": "…" }). */
export const getUiMessages = cache((locale: string) => orNull(apiGet<Record<string, string>>(`/ui-messages/${locale}`, { tags: [TAGS.translations] })));
export const getSeo = cache((key: string) =>
  orNull(apiGet<{ global: SeoMetadata | null; route: SeoMetadata | null }>(`/seo/${key}`, { tags: [TAGS.seo] })),
);
export const getTripAdvisor = cache(() => orNull(apiGet<TripAdvisorSummary>("/reviews/tripadvisor", { tags: [TAGS.reviews], revalidate: 21600 })));

/**
 * A page with its sections and their embedded data (tours, reviews, …), so it depends on every content tag.
 * Cached like everything else – a no-store fetch here made every page (the layout calls it too) render
 * dynamically and wait on the API. The backend webhook refreshes it instantly; without the webhook,
 * admin edits still show within PAGE_REVALIDATE_SECONDS.
 */
const PAGE_REVALIDATE_SECONDS = 60;
export const getPage = cache((slug: string, locale: string) =>
  orNull(apiGet<PageResponse>(`/pages/${encodeURIComponent(slug)}${qs({ locale })}`, { tags: ALL_CONTENT_TAGS, revalidate: PAGE_REVALIDATE_SECONDS })),
);

export async function getPreviewPage(slug: string, locale: string, token: string) {
  return orNull(apiGet<PageResponse>(`/preview/pages/${encodeURIComponent(slug)}${qs({ locale, token })}`, { noStore: true }));
}

type ListKey = "tours" | "destinations" | "excursions" | "vehicles" | "blog" | "gallery" | "guest-shorts" | "reviews" | "faqs";
interface ListTypes {
  tours: Tour;
  destinations: Destination;
  excursions: Excursion;
  vehicles: Vehicle;
  blog: BlogPost;
  gallery: GalleryItem;
  "guest-shorts": GuestShort;
  reviews: Review;
  faqs: Faq;
}
const LIST_TAG: Record<ListKey, string> = {
  tours: TAGS.tours,
  destinations: TAGS.destinations,
  excursions: TAGS.excursions,
  vehicles: TAGS.vehicles,
  blog: TAGS.blog,
  gallery: TAGS.gallery,
  "guest-shorts": TAGS.guestShorts,
  reviews: TAGS.reviews,
  faqs: TAGS.faqs,
};

export interface ListParams {
  locale: string;
  page?: number;
  limit?: number;
  category?: string;
  featured?: boolean;
  destination?: string;
  search?: string;
}

export async function getList<K extends ListKey>(key: K, params: ListParams): Promise<{ items: ListTypes[K][]; meta: PaginationMeta } | null> {
  try {
    const { data, meta } = await apiGet<ListTypes[K][]>(
      `/${key}${qs({ ...params, featured: params.featured ? "true" : undefined })}`,
      { tags: [LIST_TAG[key], TAGS.categories] },
    );
    return { items: data, meta: meta ?? { page: 1, limit: data.length, total: data.length, totalPages: 1 } };
  } catch (err) {
    unstable_rethrow(err);
    console.warn("[api]", (err as Error).message);
    return null;
  }
}

type DetailKey = "tours" | "destinations" | "excursions" | "vehicles" | "blog";
interface DetailTypes {
  tours: Tour;
  destinations: Destination;
  excursions: Excursion;
  vehicles: Vehicle;
  blog: BlogPost;
}

/**
 * A published item and related items. Returns null only when the API says it doesn't exist (404/400);
 * outages throw, so the page shows the error boundary instead of a 404 that search engines would de-index.
 */
export const getDetail = cache(
  async <K extends DetailKey>(key: K, slug: string, locale: string): Promise<{ item: DetailTypes[K]; related: DetailTypes[K][] } | null> => {
    try {
      const { data } = await apiGet<{ item: DetailTypes[K]; related: DetailTypes[K][] }>(`/${key}/${encodeURIComponent(slug)}${qs({ locale })}`, {
        tags: [LIST_TAG[key], TAGS.categories, TAGS.destinations, TAGS.vehicles],
      });
      return data?.item ? { item: data.item, related: data.related ?? [] } : null;
    } catch (err) {
      unstable_rethrow(err);
      if (err instanceof ApiRequestError && (err.status === 404 || err.status === 400)) return null;
      console.error("[api]", (err as Error).message);
      throw new Error("Content is temporarily unavailable");
    }
  },
);

/** First page of the community feed (later pages are loaded in the browser) */
export async function getFeed(params: { page?: number; limit?: number; q?: string; type?: string; category?: string } = {}): Promise<{ items: FeedItem[]; meta: PaginationMeta } | null> {
  try {
    const { data, meta } = await apiGet<FeedItem[]>(`/feed${qs(params)}`, { tags: [TAGS.stories, TAGS.blog] });
    return { items: data, meta: meta ?? { page: 1, limit: data.length, total: data.length, totalPages: 1 } };
  } catch (err) {
    unstable_rethrow(err);
    console.warn("[api]", (err as Error).message);
    return null;
  }
}

/* GUEST STORIES (published only) */

/** One page of the stories feed, newest first. `video: true` = only stories with a video (the reels page). */
export async function getStories(params: { page?: number; limit?: number; video?: boolean } = {}): Promise<{ items: Story[]; meta: PaginationMeta } | null> {
  try {
    const { data, meta } = await apiGet<Story[]>(`/stories${qs({ page: params.page, limit: params.limit, video: params.video ? "true" : undefined })}`, { tags: [TAGS.stories] });
    return { items: data, meta: meta ?? { page: 1, limit: data.length, total: data.length, totalPages: 1 } };
  } catch (err) {
    unstable_rethrow(err);
    console.warn("[api]", (err as Error).message);
    return null;
  }
}

/** One published story; null when it does not exist (or is not published) */
export const getStory = cache(async (id: string): Promise<Story | null> => {
  try {
    return (await apiGet<Story>(`/stories/${encodeURIComponent(id)}`, { tags: [TAGS.stories] })).data;
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof ApiRequestError && (err.status === 404 || err.status === 400)) return null;
    console.error("[api]", (err as Error).message);
    throw new Error("Content is temporarily unavailable");
  }
});

/** Closest published destinations (by distance; same category when coordinates are missing). */
export const getNearbyDestinations = cache((slug: string, locale: string, limit = 6) =>
  orNull(apiGet<Destination[]>(`/destinations/${encodeURIComponent(slug)}/nearby${qs({ locale, limit })}`, { tags: [TAGS.destinations, TAGS.categories] })),
);

export const getCategories = cache((kind: string, locale: string) =>
  orNull(apiGet<Category[]>(`/categories${qs({ kind, locale })}`, { tags: [TAGS.categories] })),
);

export async function getSitemapData() {
  return orNull(
    apiGet<Record<"tours" | "destinations" | "excursions" | "vehicles" | "blog" | "pages", { slug: string; updatedAt?: string }[]>>(
      "/sitemap-data",
      { tags: ALL_CONTENT_TAGS, revalidate: 3600 },
    ),
  );
}
