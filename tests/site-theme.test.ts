import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, PRESETS, THEME_COOKIE, THEME_INIT_SCRIPT, fluidSize, googleFonts, googleFontsUrl, resolveTheme, sanitizeCustomCss, themeToCss } from "@/lib/theme";

describe("site theme defaults", () => {
  it("an empty or missing theme is the original green/gold design", () => {
    expect(resolveTheme(null)).toEqual(DEFAULT_THEME);
    expect(resolveTheme({})).toEqual(DEFAULT_THEME);
    expect(DEFAULT_THEME.colors).toMatchObject({ primary: "#0f3d2e", secondary: "#1f7a4d", accent: "#c99a3b", background: "#faf6ec", text: "#17201b", muted: "#5d6b63" });
  });

  it("the default theme writes only colour variables (no font, size, shape or background overrides)", () => {
    const css = themeToCss(DEFAULT_THEME);
    expect(css).toContain("--brand-primary:#0f3d2e");
    expect(css).not.toMatch(/--font-travel|--text-h|--radius|--spacing|font-size|[{;]background:|border-radius/);
    expect(googleFonts(DEFAULT_THEME, "en")).toEqual([]);
  });

  it("keeps colours saved on the old Branding page until the theme overrides them", () => {
    expect(resolveTheme({ colors: { primary: "#123456" } }).colors.primary).toBe("#123456");
    expect(resolveTheme({ colors: { primary: "#123456" }, theme: { colors: { primary: "#abcdef" } } }).colors.primary).toBe("#abcdef");
  });

  it("every preset has all 11 colours in both palettes", () => {
    for (const p of PRESETS) {
      expect(Object.keys(p.colors)).toHaveLength(11);
      expect(Object.keys(p.darkColors)).toHaveLength(11);
    }
  });
});

describe("site theme safety", () => {
  it("drops invalid stored values instead of writing them into CSS", () => {
    const t = resolveTheme({
      theme: {
        colors: { primary: "red;}body{display:none" },
        typography: { headingFont: "Evil'); @import", baseSize: 999 },
        background: { type: "image", image: { url: 'https://x.test/a.png"),url("http://evil' } },
        buttonStyle: "blob",
      },
    });
    expect(t.colors.primary).toBe(DEFAULT_THEME.colors.primary);
    expect(t.typography.headingFont).toBe(DEFAULT_THEME.typography.headingFont);
    expect(t.typography.baseSize).toBe(22);
    expect(t.background.image.url).toBe("");
    expect(t.buttonStyle).toBe("pill");
  });

  it("custom CSS cannot close the style tag or load anything", () => {
    const css = sanitizeCustomCss(`</style><script>x</script>@import url(https://e.test/a.css); a{background:url(http://e.test/x.png)} b{background:url(https://ok.test/y.png)}`);
    expect(css).not.toContain("<");
    expect(css).not.toMatch(/@import|http:\/\//);
    expect(css).toContain("url(https://ok.test/y.png)");
  });
});

describe("site theme CSS", () => {
  it("writes fonts, sizes, shape, spacing and background when they change", () => {
    const css = themeToCss(
      resolveTheme({
        theme: {
          typography: { headingFont: "Lora", bodyFont: "Inter", sinhalaFont: "Noto Sans Sinhala", headingSizes: { h1: 48, h5: 18 } },
          radiusScale: 0.5,
          buttonStyle: "square",
          spacingScale: 1.2,
          background: { type: "gradient", gradient: { direction: 90, stops: ["#ffffff", "#000000"] } },
        },
      }),
    );
    expect(css).toContain('--font-travel-display:"Lora"');
    expect(css).toContain('--font-travel-sans:"Inter"');
    expect(css).toContain("--text-h1:clamp(");
    expect(css).toMatch(/ h5\{font-size:/);
    expect(css).toContain("--radius-xl:0.375rem");
    expect(css).toContain("calc(clamp(4rem, 3rem + 2.5vw, 5rem) * 1.2)");
    expect(css).toContain("linear-gradient(90deg, #ffffff, #000000)");
    expect(css).toContain('[lang="si"]');
  });

  it("loads Google fonts only for chosen non-bundled fonts, and script fonts only on their own pages", () => {
    const t = resolveTheme({ theme: { typography: { bodyFont: "Inter", sinhalaFont: "Noto Sans Sinhala" } } });
    expect(googleFonts(t, "en")).toEqual(["Inter"]);
    expect(googleFonts(t, "si")).toEqual(["Inter", "Noto Sans Sinhala"]);
    expect(googleFontsUrl(["Noto Sans Sinhala"])).toBe("https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;500;600;700&display=swap");
    expect(googleFontsUrl([])).toBeNull();
  });

  it("fluid heading sizes reach the desktop size at 1440px", () => {
    expect(fluidSize(60, 0.55)).toMatch(/^clamp\(2\.0625rem, .+, 3\.75rem\)$/);
    expect(fluidSize(14, 1)).toBe("0.875rem");
  });
});

describe("dark mode", () => {
  it("the head script applies the saved cookie, else the device setting, to <html data-theme>", () => {
    const html = { setAttribute: (_: string, v: string) => (html.theme = v), theme: "" };
    const run = (cookie: string, prefersDark: boolean) => {
      new Function("document", "window", THEME_INIT_SCRIPT)({ cookie, documentElement: html }, { matchMedia: () => ({ matches: prefersDark }) });
      return html.theme;
    };
    expect(run(`${THEME_COOKIE}=dark`, false)).toBe("dark");
    expect(run(`other=1; ${THEME_COOKIE}=light`, true)).toBe("light");
    expect(run("", true)).toBe("dark");
    expect(run("", false)).toBe("light");
  });

  it("public components use dark-aware colours instead of solid white cards and dark-green text", () => {
    const dirs = ["site", "sections", "cards", "community", "destinations", "forms", "gallery", "account", "ui"].map((d) => path.join("src/components", d));
    dirs.push("src/app/[locale]");
    const files: string[] = [];
    const walk = (dir: string) =>
      readdirSync(dir).forEach((f) => {
        const p = path.join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith(".tsx")) files.push(p);
      });
    dirs.forEach(walk);
    const offenders = files.filter((f) => /(?<![\w:/-])bg-white(?![\w/-])/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
