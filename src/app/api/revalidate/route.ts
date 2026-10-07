import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

const ALLOWED = new Set([
  "settings",
  "branding",
  "navigation",
  "pages",
  "hero",
  "tours",
  "destinations",
  "excursions",
  "vehicles",
  "categories",
  "gallery",
  "blog",
  "guest-shorts",
  "reviews",
  "faqs",
  "seo",
  "translations",
  "languages",
]);

function secretMatches(given: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Called by the Express API after any admin change so the public site updates immediately.
 * POST { tags: string[] } with header x-revalidate-secret.
 */
export async function POST(req: NextRequest) {
  if (!secretMatches(req.headers.get("x-revalidate-secret"))) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags.filter((t): t is string => typeof t === "string" && ALLOWED.has(t)) : [];
  // Translations and settings affect nearly every page, so they are always refreshed along with the change.
  for (const tag of new Set(tags)) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ success: true, revalidated: tags, now: Date.now() });
}
