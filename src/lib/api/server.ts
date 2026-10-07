import { cache } from "react";
import { REVALIDATE_SECONDS, SERVER_API_URL } from "@/lib/config";
import type {
  ApiEnvelope,
  BlogPost,
  Branding,
  Category,
  Destination,
  Excursion,
  Faq,
  GalleryItem,
  GuestShort,
  Language,
  NavItem,
  PageResponse,
  PaginationMeta,
  Review,
  SeoMetadata,
  SiteSettings,
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
      headers: { accept: "application/json" },
      ...(opts.noStore
        ? { cache: "no-store" as const }
        : { next: { revalidate: opts.revalidate ?? REVALIDATE_SECONDS, tags: [...(opts.tags ?? []), TAGS.translations] } }),
    });
  } catch (err) {
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
export const getSeo = cache((key: string) =>
  orNull(apiGet<{ global: SeoMetadata | null; route: SeoMetadata | null }>(`/seo/${key}`, { tags: [TAGS.seo] })),
);
export const getTripAdvisor = cache(() => orNull(apiGet<TripAdvisorSummary>("/reviews/tripadvisor", { tags: [TAGS.reviews], revalidate: 21600 })));

/** A CMS page with its sections (and the data each dynamic section needs). Returns null if not found. */
export const getPage = cache((slug: string, locale: string) =>
  orNull(apiGet<PageResponse>(`/pages/${encodeURIComponent(slug)}${qs({ locale })}`, { tags: ALL_CONTENT_TAGS })),
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

export const getDetail = cache(
  async <K extends DetailKey>(key: K, slug: string, locale: string): Promise<{ item: DetailTypes[K]; related: DetailTypes[K][] } | null> =>
    orNull(
      apiGet<{ item: DetailTypes[K]; related: DetailTypes[K][] }>(`/${key}/${encodeURIComponent(slug)}${qs({ locale })}`, {
        tags: [LIST_TAG[key], TAGS.categories, TAGS.destinations, TAGS.vehicles],
      }),
    ),
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
