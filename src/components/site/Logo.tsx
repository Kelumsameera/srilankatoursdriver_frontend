import Image from "next/image";
import type { Branding } from "@/types/cms";
import { cn } from "@/lib/utils";

interface Props {
  branding: Branding | null;
  siteName: string;
  /** "light" = rendered on a dark background (uses the light logo variant if uploaded). */
  tone?: "light" | "dark";
  mobile?: boolean;
  className?: string;
  priority?: boolean;
}

/** The logo always comes from Admin → Branding (Cloudinary). Falls back to the site name. */
export function Logo({ branding, siteName, tone = "dark", mobile, className, priority }: Props) {
  const logo =
    (mobile && tone === "dark" && branding?.mobileLogo?.url ? branding.mobileLogo : null) ??
    (tone === "light" ? branding?.lightLogo ?? branding?.primaryLogo : branding?.primaryLogo ?? branding?.darkLogo);
  const width = branding?.logoWidth ?? 180;
  const height = branding?.logoHeight ?? 56;
  const alt = branding?.logoAlt || siteName;

  if (logo?.url) {
    return (
      <Image
        src={logo.url}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes={`${width}px`}
        className={cn("h-auto max-h-14 w-auto object-contain", className)}
        style={{ maxWidth: width }}
      />
    );
  }
  return (
    <span className={cn("whitespace-nowrap font-display text-lg font-semibold tracking-tight sm:text-2xl", tone === "light" ? "text-white" : "text-forest-900", className)}>
      {siteName}
    </span>
  );
}

