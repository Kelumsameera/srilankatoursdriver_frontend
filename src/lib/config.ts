/** Public runtime configuration (safe to expose to the browser). */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/$/, "");
/** Server-side calls may use a private network URL (e.g. http://backend:5000/api in Docker). */
export const SERVER_API_URL = (process.env.API_URL_INTERNAL ?? API_URL).replace(/\/$/, "");
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.srilankatoursdriver.com").replace(/\/$/, "");
/** Seconds before cached CMS data is re-fetched in the background (on-demand revalidation makes edits instant). */
export const REVALIDATE_SECONDS = 300;
