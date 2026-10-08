/** Public runtime configuration (safe to expose to the browser). */

const DEV_API_URL = "http://localhost:5000/api";
const trimSlash = (v: string) => v.replace(/\/+$/, "");

/**
 * The single source of truth for the API base URL (browser + server, also used by next.config.ts).
 * NEXT_PUBLIC_API_URL is canonical; NEXT_PUBLIC_API_BASE_URL / NEXT_PUBLIC_API_BASE are accepted as
 * aliases so a host configured with either name still works. Empty values fall through (`||`, not `??`),
 * so a blank line in .env never produces an empty base URL. Each variable is referenced literally so
 * Next.js can inline it into the client bundle.
 */
export const API_URL = trimSlash(
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || DEV_API_URL,
);

/** Server-side calls may use a private network URL (e.g. http://backend:5000/api in Docker). Never sent to the browser. */
export const SERVER_API_URL = trimSlash(process.env.API_URL_INTERNAL || API_URL);

export const SITE_URL = trimSlash(process.env.NEXT_PUBLIC_SITE_URL || "https://www.srilankatoursdriver.com");

/** Seconds before cached CMS data is re-fetched in the background (on-demand revalidation makes edits instant). */
export const REVALIDATE_SECONDS = 300;

if (typeof window === "undefined" && process.env.NODE_ENV === "production" && API_URL === DEV_API_URL) {
  console.warn("[config] NEXT_PUBLIC_API_URL is not set – the production build is pointing at http://localhost:5000/api.");
}
