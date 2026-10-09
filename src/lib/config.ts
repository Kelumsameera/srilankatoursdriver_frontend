/** Public runtime configuration (safe to expose to the browser). */

const DEV_API_URL = "http://localhost:5000/api";
const trimSlash = (v: string) => v.replace(/\/+$/, "");

/**
 * Absolute URL of the Express API: server-side fetches, the CSP and the target of the /api proxy.
 * NEXT_PUBLIC_API_URL is canonical; NEXT_PUBLIC_API_BASE_URL / NEXT_PUBLIC_API_BASE are accepted as
 * aliases so a host configured with either name still works. Empty values fall through (`||`, not `??`),
 * so a blank line in .env never produces an empty base URL. Each variable is referenced literally so
 * Next.js can inline it into the client bundle.
 */
export const BACKEND_API_URL = trimSlash(
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || DEV_API_URL,
);

/**
 * Whether the browser reaches the API through this site's own `/api` path (next.config.ts rewrites it
 * to BACKEND_API_URL). The API's httpOnly session cookies are then first-party: they keep working when
 * the API is on another site (e.g. *.vercel.app → *.onrender.com), where browsers reject SameSite=Lax
 * cookies and increasingly block SameSite=None ones as third-party cookies.
 * Set NEXT_PUBLIC_API_PROXY=false only when the API shares the site's registrable domain
 * (e.g. www.example.com + api.example.com).
 */
export const API_PROXY_ENABLED = process.env.NEXT_PUBLIC_API_PROXY !== "false";

/** Base URL for every browser request to the API. */
export const API_URL = API_PROXY_ENABLED ? "/api" : BACKEND_API_URL;

/** Server-side calls may use a private network URL (e.g. http://backend:5000/api in Docker). Never sent to the browser. */
export const SERVER_API_URL = trimSlash(process.env.API_URL_INTERNAL || BACKEND_API_URL);

export const SITE_URL = trimSlash(process.env.NEXT_PUBLIC_SITE_URL || "https://www.srilankatoursdriver.com");

/** Seconds before cached CMS data is re-fetched in the background (on-demand revalidation makes edits instant). */
export const REVALIDATE_SECONDS = 300;

if (typeof window === "undefined" && process.env.NODE_ENV === "production" && BACKEND_API_URL === DEV_API_URL) {
  console.warn("[config] NEXT_PUBLIC_API_URL is not set – the production build is pointing at http://localhost:5000/api.");
}
