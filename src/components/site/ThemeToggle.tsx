"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { THEME_COOKIE } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** The page's current mode lives on <html data-theme>; the head script (layout) sets it before first paint. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const isDark = () => document.documentElement.dataset.theme === "dark";

// Header button that switches the website between light and dark and remembers the choice for a year (cookie)
export function ThemeToggle({ tone = "dark" }: { tone?: "light" | "dark" }) {
  const t = useTranslations("common");
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? t("lightMode") : t("darkMode")}
      title={dark ? t("lightMode") : t("darkMode")}
      data-testid="theme-toggle"
      className={cn("inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors", tone === "light" ? "text-white hover:bg-white/10" : "text-heading hover:bg-forest-50")}
    >
      {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}
