import type { Branding } from "@/types/cms";

/** Match the icon used beside the site name, with uploaded logos as fallbacks. */
export function siteIconUrl(branding: Branding | null): string | undefined {
  return branding?.logoIcon?.url || branding?.primaryLogo?.url || branding?.lightLogo?.url || branding?.darkLogo?.url || branding?.favicon?.url;
}
