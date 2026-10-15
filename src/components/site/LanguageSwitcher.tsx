"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { isLocale, localeNames, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// Header language button (44px tap target) with the list of the site's enabled languages
export function LanguageSwitcher({ enabled, tone = "dark", align = "end" }: { enabled: string[]; tone?: "light" | "dark"; align?: "start" | "end" }) {
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const options = enabled.filter(isLocale);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: Locale) => {
    setOpen(false);
    startTransition(() => router.replace(pathname, { locale: next }));
  };

  if (options.length <= 1) return null;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={tCommon("language")}
        data-testid="language-switcher"
        className={cn(
          "flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full px-2 text-sm font-medium transition-colors sm:gap-1.5 sm:px-3",
          tone === "light" ? "text-white hover:bg-white/10" : "text-forest-900 hover:bg-forest-50",
          pending && "opacity-60",
        )}
      >
        <Globe className="h-4 w-4" aria-hidden />
        <span className="uppercase">{locale}</span>
        <ChevronDown className="hidden h-3.5 w-3.5 sm:block" aria-hidden />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={tCommon("language")}
          className={cn(
            "absolute top-full z-50 mt-2 max-h-80 w-48 overflow-auto rounded-2xl border border-sand-200 bg-white p-1.5 text-forest-900 shadow-soft",
            align === "end" ? "inset-e-0" : "inset-s-0",
          )}
        >
          {options.map((code) => (
            <li key={code}>
              <button
                type="button"
                role="option"
                aria-selected={code === locale}
                onClick={() => choose(code)}
                lang={code}
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-start text-sm hover:bg-sand-100"
              >
                <span>{localeNames[code]}</span>
                {code === locale && <Check className="h-4 w-4 text-forest-600" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
