import Image from "next/image";
import type { Branding, MediaAsset } from "@/types/cms";
import { cn } from "@/lib/utils";

interface Props {
  branding: Branding | null;
  siteName: string;
  /** "light" = rendered on a dark background (uses the light logo variant if uploaded). */
  tone?: "light" | "dark";
  mobile?: boolean;
  className?: string;
  preload?: boolean;
}

/**
 * The icon + text logo from Admin → Branding, or null when neither the icon nor line 1 is set (the logo images
 * are used then). Only an icon → the site name is the text.
 */
export function textLogo(branding: Branding | null, siteName: string): { icon: MediaAsset | null; lines: string[] } | null {
  const icon = branding?.logoIcon?.url ? branding.logoIcon : null;
  const line1 = branding?.logoTextLine1?.trim() ?? "";
  const line2 = branding?.logoTextLine2?.trim() ?? "";
  if (!icon && !line1) return null;
  return { icon, lines: line1 ? [line1, line2].filter(Boolean) : [siteName] };
}

/** The logo always comes from Admin → Branding (Cloudinary). Falls back to the site name. */
export function Logo({ branding, siteName, tone = "dark", mobile, className, preload }: Props) {
  const text = textLogo(branding, siteName);

  if (text) {
    const iconHeight = mobile ? 36 : 48;
    const { width: w, height: h } = text.icon ?? {};
    const iconWidth = w && h ? Math.round((iconHeight * w) / h) : iconHeight;
    return (
      <span className={cn("flex items-center gap-2 sm:gap-2.5", className)}>
        {text.icon?.url && (
          <Image
            src={text.icon.url}
            alt=""
            width={iconWidth}
            height={iconHeight}
            preload={preload}
            sizes={`${iconWidth}px`}
            className="shrink-0 object-contain"
            style={{ width: iconWidth, height: iconHeight }}
          />
        )}
        <span className="flex flex-col whitespace-nowrap font-display font-bold uppercase leading-none tracking-wide">
          <span className={cn(mobile ? "text-base" : "text-lg sm:text-xl", tone === "light" ? "text-white" : "text-heading")}>{text.lines[0]}</span>
          {text.lines[1] && (
            <span className={cn("mt-0.5", mobile ? "text-xs" : "text-sm sm:text-base", tone === "light" ? "text-gold-400" : "text-gold-600")}>{text.lines[1]}</span>
          )}
        </span>
      </span>
    );
  }

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
        preload={preload}
        sizes={`${width}px`}
        className={cn("h-auto max-h-14 w-auto object-contain", className)}
        style={{ maxWidth: `min(${width}px, 100%)` }}
      />
    );
  }
  return (
    <span className={cn("whitespace-nowrap font-display text-lg font-semibold tracking-tight sm:text-2xl", tone === "light" ? "text-white" : "text-heading", className)}>
      {siteName}
    </span>
  );
}
