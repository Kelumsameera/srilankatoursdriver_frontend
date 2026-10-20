import type { MediaAsset } from "@/types/cms";

/*
 * Site Appearance ("theme") settings: defaults, presets, the Google Fonts allow-list and the CSS generator.
 * The admin saves these in BrandSetting.theme (backend validations/theme.ts); the public layout turns them into a
 * <style> block of CSS variables. Pure functions only, so the layout, the admin live preview and the tests share them.
 * The defaults are exactly today's green/gold/ivory design, so an empty theme changes nothing.
 */

export const COLOR_KEYS = ["primary", "secondary", "accent", "background", "surface", "text", "muted", "border", "success", "warning", "error"] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];
export type ThemeColors = Record<ColorKey, string>;

export const COLOR_LABELS: Record<ColorKey, { label: string; hint: string }> = {
  primary: { label: "Primary", hint: "Deep bands, header after scrolling, main buttons" },
  secondary: { label: "Secondary", hint: "Links, hover states, secondary bands" },
  accent: { label: "Accent", hint: "Gold highlights, eyebrows, focus ring" },
  background: { label: "Background", hint: "Page background" },
  surface: { label: "Surface", hint: "Cards and panels" },
  text: { label: "Text", hint: "Body text" },
  muted: { label: "Muted text", hint: "Secondary text, captions" },
  border: { label: "Border", hint: "Lines and dividers" },
  success: { label: "Success", hint: "Confirmations" },
  warning: { label: "Warning", hint: "Warnings" },
  error: { label: "Error", hint: "Errors and destructive actions" },
};

export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type BackgroundType = "default" | "solid" | "gradient" | "image";
export type ButtonStyle = "pill" | "rounded" | "square";
export type ThemeMode = "light" | "dark" | "visitor";

export interface ThemeSettings {
  /** The preset or custom theme last applied (informational: the colours below are what counts). */
  preset: string;
  /** light / dark = fixed for everyone; visitor = header toggle (cookie), first visit follows the device. */
  mode: ThemeMode;
  colors: ThemeColors;
  darkColors: ThemeColors;
  customThemes: { name: string; colors: ThemeColors; darkColors: ThemeColors }[];
  typography: {
    headingFont: string;
    bodyFont: string;
    /** Font for Sinhala pages ("" = the visitor's system font). */
    sinhalaFont: string;
    /** Font for Tamil pages ("" = the visitor's system font). */
    tamilFont: string;
    /** Root font size in px (scales every rem-based size). */
    baseSize: number;
    lineHeight: number;
    headingWeight: number;
    bodyWeight: number;
    /** Desktop heading sizes in px. */
    headingSizes: Record<HeadingLevel, number>;
    /** Shrink headings smoothly on phones. */
    responsive: boolean;
  };
  background: {
    type: BackgroundType;
    color: string;
    gradient: { direction: number; stops: string[] };
    image: {
      asset: MediaAsset | null;
      url: string;
      position: "center" | "top" | "bottom" | "left" | "right";
      size: "cover" | "contain" | "auto";
      repeat: boolean;
      fixed: boolean;
      overlayColor: string;
      overlayOpacity: number;
    };
  };
  /** Multiplies every corner radius (1 = today). */
  radiusScale: number;
  buttonStyle: ButtonStyle;
  /** Multiplies the space between and inside page sections (1 = today). */
  spacingScale: number;
  customCss: string;
}

/** Light palette builder: status colours rarely change between presets. */
const light = (primary: string, secondary: string, accent: string, background: string, text: string, muted: string, border: string, surface = "#ffffff"): ThemeColors => ({
  primary,
  secondary,
  accent,
  background,
  surface,
  text,
  muted,
  border,
  success: "#15803d",
  warning: "#b45309",
  error: "#b91c1c",
});

/** Dark palette builder with brighter status colours that stay readable on dark surfaces. */
const dark = (primary: string, secondary: string, accent: string, background: string, surface: string, text: string, muted: string, border: string): ThemeColors => ({
  primary,
  secondary,
  accent,
  background,
  surface,
  text,
  muted,
  border,
  success: "#4ade80",
  warning: "#fbbf24",
  error: "#f87171",
});

export const PRESETS: { id: string; name: string; colors: ThemeColors; darkColors: ThemeColors }[] = [
  {
    id: "default",
    name: "Default (green & gold)",
    colors: light("#0f3d2e", "#1f7a4d", "#c99a3b", "#faf6ec", "#17201b", "#5d6b63", "#ece2cf"),
    darkColors: dark("#0f3d2e", "#2b9563", "#dcb76a", "#0b1611", "#12211a", "#ece7da", "#9fb0a6", "#24372d"),
  },
  {
    id: "ocean",
    name: "Ocean",
    colors: light("#0b3954", "#087e8b", "#f2a541", "#f4f9fb", "#10222e", "#557080", "#d6e6ee"),
    darkColors: dark("#0b3954", "#13a3b3", "#f6b85e", "#07141c", "#0e212d", "#e3eef4", "#8fa9b8", "#1d3846"),
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: light("#7a2e1f", "#c8553d", "#f28f3b", "#fdf6ef", "#2a1a14", "#7b6358", "#f0dccd"),
    darkColors: dark("#7a2e1f", "#e07a5f", "#f6a65c", "#160d09", "#24150f", "#f5e8df", "#b39a8e", "#3a261d"),
  },
  {
    id: "forest",
    name: "Forest",
    colors: light("#1b4332", "#2d6a4f", "#d4a373", "#f3f6f1", "#18241d", "#5b6b60", "#dce5d8"),
    darkColors: dark("#1b4332", "#52b788", "#e0b98f", "#0a120d", "#132019", "#e4ece6", "#9bb0a2", "#22362a"),
  },
  {
    id: "midnight",
    name: "Midnight",
    colors: light("#1e1b4b", "#4338ca", "#f59e0b", "#f5f5fa", "#1a1a2e", "#5f6077", "#e0e0ec"),
    darkColors: dark("#1e1b4b", "#818cf8", "#fbbf24", "#0b0b17", "#151528", "#e6e6f2", "#a0a1b8", "#2a2a44"),
  },
];

/** Google Fonts the admin may choose (only these are ever requested). Poppins and Playfair are self-hosted. */
export const FONT_OPTIONS: { name: string; category: "sans" | "serif" | "display"; script?: "sinhala" | "tamil"; weights: number[] }[] = [
  { name: "Poppins", category: "sans", weights: [300, 400, 500, 600, 700] },
  { name: "Playfair Display", category: "serif", weights: [400, 500, 600, 700] },
  { name: "Inter", category: "sans", weights: [300, 400, 500, 600, 700] },
  { name: "DM Sans", category: "sans", weights: [400, 500, 600, 700] },
  { name: "Montserrat", category: "sans", weights: [300, 400, 500, 600, 700] },
  { name: "Open Sans", category: "sans", weights: [300, 400, 500, 600, 700] },
  { name: "Lato", category: "sans", weights: [300, 400, 700] },
  { name: "Raleway", category: "sans", weights: [300, 400, 500, 600, 700] },
  { name: "Noto Sans", category: "sans", weights: [300, 400, 500, 600, 700] },
  { name: "Lora", category: "serif", weights: [400, 500, 600, 700] },
  { name: "Merriweather", category: "serif", weights: [300, 400, 700] },
  { name: "Cormorant Garamond", category: "serif", weights: [400, 500, 600, 700] },
  { name: "Noto Serif", category: "serif", weights: [400, 500, 600, 700] },
  { name: "DM Serif Display", category: "display", weights: [400] },
  { name: "Noto Sans Sinhala", category: "sans", script: "sinhala", weights: [400, 500, 600, 700] },
  { name: "Noto Serif Sinhala", category: "serif", script: "sinhala", weights: [400, 500, 600, 700] },
  { name: "Abhaya Libre", category: "serif", script: "sinhala", weights: [400, 500, 600, 700] },
  { name: "Yaldevi", category: "sans", script: "sinhala", weights: [300, 400, 500, 600, 700] },
  { name: "Noto Sans Tamil", category: "sans", script: "tamil", weights: [400, 500, 600, 700] },
  { name: "Noto Serif Tamil", category: "serif", script: "tamil", weights: [400, 500, 600, 700] },
  { name: "Catamaran", category: "sans", script: "tamil", weights: [300, 400, 500, 600, 700] },
  { name: "Mukta Malar", category: "sans", script: "tamil", weights: [300, 400, 500, 600, 700] },
];

/** Fonts already bundled with the site (next/font/local), never fetched from Google. */
const SELF_HOSTED = new Set(["Poppins", "Playfair Display"]);

export const DEFAULT_THEME: ThemeSettings = {
  preset: "default",
  mode: "light",
  colors: PRESETS[0].colors,
  darkColors: PRESETS[0].darkColors,
  customThemes: [],
  typography: {
    headingFont: "Playfair Display",
    bodyFont: "Poppins",
    sinhalaFont: "",
    tamilFont: "",
    baseSize: 16,
    lineHeight: 1.5,
    headingWeight: 400,
    bodyWeight: 400,
    headingSizes: { h1: 60, h2: 30, h3: 20, h4: 18, h5: 16, h6: 14 },
    responsive: true,
  },
  background: {
    type: "default",
    color: "#faf6ec",
    gradient: { direction: 180, stops: ["#faf6ec", "#e3efe8"] },
    image: { asset: null, url: "", position: "center", size: "cover", repeat: false, fixed: false, overlayColor: "#000000", overlayOpacity: 0 },
  },
  radiusScale: 1,
  buttonStyle: "pill",
  spacingScale: 1,
  customCss: "",
};

/* ───────────── Light / dark mode ───────────── */

/** Cookie that remembers the visitor's light/dark choice. */
export const THEME_COOKIE = "sltd_theme";

/**
 * Tiny script for <head> when visitors may choose: applies the saved choice, or the device setting, to
 * <html data-theme> before the first paint, so pages never flash light before turning dark.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(light|dark)/);var t=m?m[1]:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;

/* ───────────── Reading saved settings safely ───────────── */

const HEX = /^#[0-9a-f]{6}$/i;
const SAFE_URL = /^https:\/\/[^\s"'()\\<>]+$/;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const hex = (v: unknown, fallback: string) => (typeof v === "string" && HEX.test(v) ? v.toLowerCase() : fallback);
const num = (v: unknown, fallback: number, min: number, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback);
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T => (options.includes(v as T) ? (v as T) : fallback);
const font = (v: unknown, fallback: string, allowEmpty = false) =>
  typeof v === "string" && ((allowEmpty && v === "") || FONT_OPTIONS.some((f) => f.name === v)) ? v : fallback;

function palette(stored: unknown, fallback: ThemeColors): ThemeColors {
  const s = isObj(stored) ? stored : {};
  return Object.fromEntries(COLOR_KEYS.map((k) => [k, hex(s[k], fallback[k])])) as ThemeColors;
}

/** Same rules as the backend sanitiser: nothing can close the <style> tag, import or run anything. */
export function sanitizeCustomCss(input: string): string {
  return input
    .replace(/</g, "")
    .replace(/@import[^;]*;?/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/(java|vb)script\s*:/gi, "")
    .replace(/behavior\s*:/gi, "")
    .replace(/-moz-binding/gi, "")
    .replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, _q: string, url: string) => (/^(https:\/\/|data:image\/(png|jpeg|gif|webp);)/i.test(url.trim()) ? match : "none"))
    .slice(0, 20_000)
    .trim();
}

/**
 * The complete, validated theme: defaults ← the old Branding colours ← the saved theme.
 * Every value is checked again here, so even a hand-edited database document cannot inject CSS.
 */
export function resolveTheme(branding?: { colors?: Partial<Record<string, string>>; theme?: unknown } | null): ThemeSettings {
  const d = DEFAULT_THEME;
  const t = isObj(branding?.theme) ? branding.theme : {};
  const legacy = palette(branding?.colors, d.colors);
  const ty = isObj(t.typography) ? t.typography : {};
  const sizes = isObj(ty.headingSizes) ? ty.headingSizes : {};
  const bg = isObj(t.background) ? t.background : {};
  const grad = isObj(bg.gradient) ? bg.gradient : {};
  const img = isObj(bg.image) ? bg.image : {};
  const stops = Array.isArray(grad.stops) ? grad.stops.filter((s): s is string => typeof s === "string" && HEX.test(s)).slice(0, 3) : [];
  const asset = isObj(img.asset) && typeof img.asset.url === "string" && SAFE_URL.test(img.asset.url) ? (img.asset as unknown as MediaAsset) : null;
  return {
    preset: typeof t.preset === "string" ? t.preset.slice(0, 60) : d.preset,
    mode: oneOf(t.mode, ["light", "dark", "visitor"] as const, d.mode),
    colors: palette(t.colors, legacy),
    darkColors: palette(t.darkColors, d.darkColors),
    customThemes: (Array.isArray(t.customThemes) ? t.customThemes : [])
      .filter(isObj)
      .filter((c) => typeof c.name === "string" && c.name.trim())
      .slice(0, 20)
      .map((c) => ({ name: String(c.name).slice(0, 60), colors: palette(c.colors, d.colors), darkColors: palette(c.darkColors, d.darkColors) })),
    typography: {
      headingFont: font(ty.headingFont, d.typography.headingFont),
      bodyFont: font(ty.bodyFont, d.typography.bodyFont),
      sinhalaFont: font(ty.sinhalaFont, d.typography.sinhalaFont, true),
      tamilFont: font(ty.tamilFont, d.typography.tamilFont, true),
      baseSize: num(ty.baseSize, d.typography.baseSize, 12, 22),
      lineHeight: num(ty.lineHeight, d.typography.lineHeight, 1, 2.4),
      headingWeight: Math.round(num(ty.headingWeight, d.typography.headingWeight, 100, 900)),
      bodyWeight: Math.round(num(ty.bodyWeight, d.typography.bodyWeight, 100, 900)),
      headingSizes: {
        h1: num(sizes.h1, d.typography.headingSizes.h1, 16, 120),
        h2: num(sizes.h2, d.typography.headingSizes.h2, 14, 96),
        h3: num(sizes.h3, d.typography.headingSizes.h3, 12, 72),
        h4: num(sizes.h4, d.typography.headingSizes.h4, 12, 60),
        h5: num(sizes.h5, d.typography.headingSizes.h5, 10, 48),
        h6: num(sizes.h6, d.typography.headingSizes.h6, 10, 40),
      },
      responsive: typeof ty.responsive === "boolean" ? ty.responsive : d.typography.responsive,
    },
    background: {
      type: oneOf(bg.type, ["default", "solid", "gradient", "image"] as const, d.background.type),
      color: hex(bg.color, d.background.color),
      gradient: { direction: Math.round(num(grad.direction, d.background.gradient.direction, 0, 360)), stops: stops.length >= 2 ? stops : d.background.gradient.stops },
      image: {
        asset,
        url: typeof img.url === "string" && SAFE_URL.test(img.url) ? img.url : "",
        position: oneOf(img.position, ["center", "top", "bottom", "left", "right"] as const, d.background.image.position),
        size: oneOf(img.size, ["cover", "contain", "auto"] as const, d.background.image.size),
        repeat: img.repeat === true,
        fixed: img.fixed === true,
        overlayColor: hex(img.overlayColor, d.background.image.overlayColor),
        overlayOpacity: num(img.overlayOpacity, d.background.image.overlayOpacity, 0, 1),
      },
    },
    radiusScale: num(t.radiusScale, d.radiusScale, 0, 2),
    buttonStyle: oneOf(t.buttonStyle, ["pill", "rounded", "square"] as const, d.buttonStyle),
    spacingScale: num(t.spacingScale, d.spacingScale, 0.75, 1.5),
    customCss: typeof t.customCss === "string" ? sanitizeCustomCss(t.customCss) : "",
  };
}

/* ───────────── Fonts ───────────── */

/** Fonts that must be fetched from Google for this theme (self-hosted defaults are skipped). */
export function googleFonts(theme: ThemeSettings, locale?: string): string[] {
  const { headingFont, bodyFont, sinhalaFont, tamilFont } = theme.typography;
  const wanted = [headingFont, bodyFont];
  // Script fonts only on their own pages (or everywhere when no locale is given, e.g. the admin preview).
  if (sinhalaFont && (!locale || locale === "si")) wanted.push(sinhalaFont);
  if (tamilFont && (!locale || locale === "ta")) wanted.push(tamilFont);
  return [...new Set(wanted)].filter((f) => f && !SELF_HOSTED.has(f) && FONT_OPTIONS.some((o) => o.name === f));
}

/** One fonts.googleapis.com stylesheet URL for the given families, or null when none are needed. */
export function googleFontsUrl(families: string[]): string | null {
  if (families.length === 0) return null;
  const params = families
    .map((name) => {
      const weights = FONT_OPTIONS.find((f) => f.name === name)?.weights ?? [400];
      return `family=${name.replace(/ /g, "+")}:wght@${weights.join(";")}`;
    })
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/** The family name only: Tailwind's --font-sans / --font-display already add the generic fallbacks after it. */
function fontStack(name: string) {
  return `"${name}"`;
}

/* ───────────── CSS ───────────── */

/** Where the CSS applies: the public <html> or the admin preview box. */
export interface ThemeScope {
  /** Element that carries the variables (html, or the preview container). */
  root: string;
  /** Element whose background is the page background. */
  body: string;
}

// ":root" raises specificity above the matching rules in globals.css, whatever order the stylesheets load in.
export const PUBLIC_SCOPE: ThemeScope = { root: 'html[data-site="public"]:root', body: 'html[data-site="public"]:root body' };

const rem = (px: number) => `${+(px / 16).toFixed(4)}rem`;

/** Fluid heading size: the desktop size at 1440px, shrinking linearly to `ratio` of it at 375px. */
export function fluidSize(maxPx: number, ratio: number): string {
  const minPx = Math.max(12, Math.round(maxPx * ratio));
  if (minPx >= maxPx) return rem(maxPx);
  const slope = (maxPx - minPx) / (1440 - 375);
  const intercept = minPx - slope * 375;
  return `clamp(${rem(minPx)}, ${rem(intercept)} + ${+(slope * 100).toFixed(4)}vw, ${rem(maxPx)})`;
}

/** How much each heading shrinks on phones (matches the current fluid tokens for h1–h3). */
const PHONE_RATIO: Record<HeadingLevel, number> = { h1: 0.55, h2: 0.8, h3: 0.9, h4: 0.92, h5: 0.95, h6: 1 };

function colorVars(c: ThemeColors) {
  return [
    `--brand-primary:${c.primary}`,
    `--brand-secondary:${c.secondary}`,
    `--brand-accent:${c.accent}`,
    `--theme-background:${c.background}`,
    `--theme-surface:${c.surface}`,
    `--theme-text:${c.text}`,
    `--theme-muted:${c.muted}`,
    `--theme-border:${c.border}`,
    `--theme-success:${c.success}`,
    `--theme-warning:${c.warning}`,
    `--theme-error:${c.error}`,
  ].join(";");
}

/** "#rrggbb" + opacity → "rgb(r g b / a)". */
function withAlpha(color: string, alpha: number) {
  const n = parseInt(color.slice(1), 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${+alpha.toFixed(2)})`;
}

/**
 * CSS for a theme. Colours are always written; everything else only when it differs from the default,
 * so the default theme reproduces today's site exactly.
 */
export function themeToCss(theme: ThemeSettings, scope: ThemeScope = PUBLIC_SCOPE): string {
  const d = DEFAULT_THEME;
  const { root, body } = scope;
  const ty = theme.typography;
  const vars: string[] = [colorVars(theme.colors)];
  const rules: string[] = [];

  // Fonts
  if (ty.bodyFont !== d.typography.bodyFont) vars.push(`--font-travel-sans:${fontStack(ty.bodyFont)}`);
  if (ty.headingFont !== d.typography.headingFont) vars.push(`--font-travel-display:${fontStack(ty.headingFont)}`);
  if (ty.baseSize !== d.typography.baseSize) vars.push(`font-size:${+((ty.baseSize / 16) * 100).toFixed(3)}%`);

  // Heading sizes: h1–h3 drive the existing text-h1…h3 tokens, h4–h6 style the elements.
  (["h1", "h2", "h3"] as const).forEach((h) => {
    if (ty.headingSizes[h] !== d.typography.headingSizes[h] || ty.responsive !== d.typography.responsive) {
      vars.push(`--text-${h}:${ty.responsive ? fluidSize(ty.headingSizes[h], PHONE_RATIO[h]) : rem(ty.headingSizes[h])}`);
    }
  });
  (["h4", "h5", "h6"] as const).forEach((h) => {
    if (ty.headingSizes[h] !== d.typography.headingSizes[h]) rules.push(`${root} ${h}{font-size:${ty.responsive ? fluidSize(ty.headingSizes[h], PHONE_RATIO[h]) : rem(ty.headingSizes[h])}}`);
  });

  // Shape and spacing (Tailwind reads these variables in rounded-* / py-section / gap-grid …)
  if (theme.radiusScale !== d.radiusScale) {
    const radii: Record<string, number> = { sm: 0.25, md: 0.375, lg: 0.5, xl: 0.75, "2xl": 1, "3xl": 1.5 };
    for (const [k, v] of Object.entries(radii)) vars.push(`--radius-${k}:${+(v * theme.radiusScale).toFixed(4)}rem`);
  }
  if (theme.spacingScale !== d.spacingScale) {
    const s = theme.spacingScale;
    vars.push(
      `--spacing-section:calc(clamp(4rem, 3rem + 2.5vw, 5rem) * ${s})`,
      `--spacing-section-sm:calc(clamp(3rem, 2.25rem + 2vw, 4rem) * ${s})`,
      `--spacing-stack:calc(clamp(1.5rem, 1rem + 2vw, 2.5rem) * ${s})`,
      `--spacing-grid:calc(clamp(1.25rem, 1rem + 1vw, 1.75rem) * ${s})`,
    );
  }

  // Dark bands, overlays and the footer use darker shades of the primary green. They are written as fixed colours in
  // globals.css; once the admin changes the primary or secondary colour (light or dark palette) they are mixed from
  // the current palette instead, so the whole site follows the new colours. var() resolves per mode automatically.
  const greensChanged = (["primary", "secondary"] as const).some((k) => theme.colors[k] !== d.colors[k] || theme.darkColors[k] !== d.darkColors[k]);
  if (greensChanged) {
    vars.push(
      "--brand-darkest:color-mix(in oklab, var(--brand-primary) 35%, black)",
      "--brand-dark:color-mix(in oklab, var(--brand-primary) 62%, black)",
      "--brand-deep:color-mix(in oklab, var(--brand-primary) 65%, var(--brand-secondary))",
      "--brand-bright:color-mix(in oklab, var(--brand-secondary) 85%, white)",
    );
    // Pale green tints (light mode only; dark mode has its own tones in globals.css)
    rules.push(`${root}:not([data-theme="dark"]){--tone-forest-50:color-mix(in oklab, var(--brand-secondary) 7%, white);--tone-forest-100:color-mix(in oklab, var(--brand-secondary) 14%, white)}`);
  }

  // The alternate light band colour (sand-100) sits between the page background and the border colour.
  if (theme.colors.background !== d.colors.background || theme.colors.border !== d.colors.border) {
    rules.push(`${root}:not([data-theme="dark"]){--tone-sand-100:color-mix(in oklab, var(--theme-background) 50%, var(--theme-border))}`);
  }

  rules.unshift(`${root}{${vars.join(";")}}`);
  rules.push(`${root}[data-theme="dark"]{${colorVars(theme.darkColors)}}`);

  // Body text
  const bodyRules: string[] = [];
  if (ty.lineHeight !== d.typography.lineHeight) bodyRules.push(`line-height:${ty.lineHeight}`);
  if (ty.bodyWeight !== d.typography.bodyWeight) bodyRules.push(`font-weight:${ty.bodyWeight}`);
  if (bodyRules.length) rules.push(`${body}{${bodyRules.join(";")}}`);
  if (ty.headingWeight !== d.typography.headingWeight) rules.push(`${root} :is(h1,h2,h3,h4,h5,h6){font-weight:${ty.headingWeight}}`);

  // Sinhala / Tamil fonts: on <html lang> for the public site, and on any [lang] element (the preview).
  for (const [lang, name] of [["si", ty.sinhalaFont], ["ta", ty.tamilFont]] as const) {
    if (!name) continue;
    const stack = `"${name}", var(--font-sans, sans-serif)`;
    rules.push(`${root}[lang="${lang}"],${root} [lang="${lang}"]{--font-travel-sans:${stack};--font-travel-display:${stack}}`, `${root} [lang="${lang}"]{font-family:${stack}}`);
  }

  // Buttons: most site buttons are rounded-full pills.
  if (theme.buttonStyle !== d.buttonStyle) {
    const r = theme.buttonStyle === "square" ? rem(4 * theme.radiusScale) : rem(12 * theme.radiusScale);
    rules.push(`${root} :is(a,button)[class*="rounded-full"]{border-radius:${r}}`);
  }

  // Page background (the default keeps the ivory paper texture and palm fronds from globals.css).
  const bg = theme.background;
  let background = "";
  if (bg.type === "solid") background = `background:${bg.color}`;
  if (bg.type === "gradient") background = `background:linear-gradient(${bg.gradient.direction}deg, ${bg.gradient.stops.join(", ")})`;
  if (bg.type === "image") {
    const url = bg.image.asset?.url || bg.image.url;
    if (url) {
      const overlay = withAlpha(bg.image.overlayColor, bg.image.overlayOpacity);
      background = [
        `background:linear-gradient(${overlay}, ${overlay}), url("${url}") ${bg.image.position} / ${bg.image.size} ${bg.image.repeat ? "repeat" : "no-repeat"}`,
        `background-attachment:${bg.image.fixed ? "fixed" : "scroll"}`,
        `background-color:${theme.colors.background}`,
      ].join(";");
    }
  }
  if (background) {
    rules.push(`${body}{${background}}`, `${root} main section:is(.bg-sand-50,.bg-sand-100){background:transparent}`);
  }

  // Nothing in a generated value can contain "<", but make sure the <style> tag can never be closed.
  return rules.join("\n").replace(/</g, "\\3C ");
}
