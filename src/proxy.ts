import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/** Locale detection & prefixing for the public site. The admin and API routes are excluded. */
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|admin|manager|staff|_next|_vercel|sitemap.xml|robots.txt|.*\\..*).*)"],
};
