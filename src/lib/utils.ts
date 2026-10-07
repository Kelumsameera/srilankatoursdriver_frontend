import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Digits-only phone for wa.me / tel: links. */
export function phoneDigits(phone?: string): string {
  return (phone ?? "").replace(/[^\d+]/g, "").replace(/^\+/, "");
}

export function whatsappLink(phone?: string, message?: string): string {
  const digits = phoneDigits(phone);
  if (!digits) return "#";
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function telLink(phone?: string): string {
  return `tel:+${phoneDigits(phone)}`;
}

export function formatPrice(amount: number | null | undefined, currency = "USD", locale = "en"): string | null {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return null;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function formatDate(value: string | Date | undefined, locale = "en", opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(locale, opts).format(d);
  } catch {
    return d.toDateString();
  }
}

/** Replaces {year} in CMS strings such as the footer copyright. */
export function interpolate(text: string | undefined): string {
  return (text ?? "").replace(/\{year\}/g, String(new Date().getFullYear()));
}

/** Internal CMS links are stored locale-less ("/tours"); external links are left untouched. */
export function isExternal(url?: string): boolean {
  return !!url && /^(https?:|mailto:|tel:)/i.test(url);
}

export function stripMarkdown(md?: string, max = 160): string {
  const text = (md ?? "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** YouTube / Instagram / TikTok embed URL for guest shorts. */
export function embedUrl(platform: string, url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (platform === "youtube") {
      const id = u.hostname.includes("youtu.be")
        ? u.pathname.slice(1)
        : u.pathname.startsWith("/shorts/")
          ? u.pathname.split("/")[2]
          : u.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (platform === "instagram") {
      const m = u.pathname.match(/\/(p|reel|reels)\/([^/]+)/);
      return m ? `https://www.instagram.com/${m[1] === "reels" ? "reel" : m[1]}/${m[2]}/embed` : null;
    }
    if (platform === "tiktok") {
      const m = u.pathname.match(/\/video\/(\d+)/);
      return m ? `https://www.tiktok.com/embed/v2/${m[1]}` : null;
    }
  } catch {
    return null;
  }
  return null;
}
