"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import type { NavItem } from "@/types/cms";
import { cn, telLink } from "@/lib/utils";
import { CmsLink } from "@/components/ui/CmsLink";
import { buttonClass } from "@/components/ui/Button";
import { AccountMenu, MobileAccountLink } from "@/components/account/AccountMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface Props {
  nav: NavItem[];
  logoLight: ReactNode;
  logoDark: ReactNode;
  logoMobile: ReactNode;
  /** Mobile logo variant for the transparent (dark hero) state. */
  logoMobileLight: ReactNode;
  languages: string[];
  phone?: string;
  whatsapp?: { phone?: string; message?: string };
}

function isActive(pathname: string, url?: string) {
  if (!url || /^https?:/i.test(url)) return false;
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}

/** Transparent over the hero, solid after scrolling. Menu items come from Admin → Navbar. */
export function SiteHeader({ nav, logoLight, logoDark, logoMobile, logoMobileLight, languages, phone, whatsapp }: Props) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu when the route changes (state adjustment during render, no effect needed).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
    setOpenSub(null);
  }

  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    // Escape closes the mobile menu and returns focus to the toggle button.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = scrolled || open;
  const links = nav.filter((n) => !n.isCta);
  const ctas = nav.filter((n) => n.isCta);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-500",
        solid ? "bg-white/95 shadow-[0_1px_0_rgb(0_0_0/0.06)] backdrop-blur-md" : "bg-gradient-to-b from-black/40 to-transparent",
      )}
    >
      <div className="container-page flex h-20 items-center justify-between gap-4">
        <CmsLink href="/" className="flex shrink-0 items-center" ariaLabel={tc("home")}>
          <span className="hidden sm:block">{solid ? logoDark : logoLight}</span>
          <span className="sm:hidden">{solid ? logoMobile : logoMobileLight}</span>
        </CmsLink>

        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-0.5">
            {links.map((item) => (
              <li key={item._id} className="group relative">
                {item.children?.length ? (
                  <>
                    <button
                      type="button"
                      className={cn(
                        "flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-2 text-[0.88rem] font-medium transition-colors",
                        solid ? "text-forest-900 hover:text-forest-600" : "text-white/90 hover:text-white",
                      )}
                      aria-haspopup="true"
                    >
                      {item.label}
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <ul className="invisible absolute start-0 top-full min-w-56 translate-y-2 rounded-2xl border border-sand-200 bg-white p-2 opacity-0 shadow-soft transition-all group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      {item.children.map((child) => (
                        <li key={child._id}>
                          <CmsLink href={child.url} newTab={child.openInNewTab} className="block rounded-xl px-3 py-2 text-sm text-forest-900 hover:bg-sand-100">
                            {child.label}
                          </CmsLink>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <CmsLink
                    href={item.url}
                    newTab={item.openInNewTab}
                    current={isActive(pathname, item.url)}
                    className={cn(
                      "relative whitespace-nowrap rounded-full px-2.5 py-2 text-[0.88rem] font-medium transition-colors",
                      solid ? "text-forest-900 hover:text-forest-600" : "text-white/90 hover:text-white",
                      isActive(pathname, item.url) && (solid ? "text-forest-600" : "text-white"),
                      isActive(pathname, item.url) && "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-gold-500",
                    )}
                  >
                    {item.label}
                  </CmsLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher enabled={languages} tone={solid ? "dark" : "light"} />
          {phone && (
            <a href={telLink(phone)} className={cn("hidden rounded-full p-2 lg:inline-flex", solid ? "text-forest-900" : "text-white")} aria-label={phone}>
              <Phone className="h-4 w-4" />
            </a>
          )}
          <AccountMenu tone={solid ? "dark" : "light"} />
          {ctas.map((c) => (
            <span key={c._id} className="hidden sm:block">
              <CmsLink href={c.url} whatsapp={whatsapp} className={buttonClass("primary", "sm")}>
                {c.label}
              </CmsLink>
            </span>
          ))}
          <button
            ref={toggleRef}
            type="button"
            className={cn("rounded-full p-2 xl:hidden", solid ? "text-forest-900" : "text-white")}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t("closeMenu") : t("openMenu")}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="h-[calc(100dvh-5rem)] overflow-y-auto border-t border-sand-200 bg-white xl:hidden">
          <nav aria-label="Mobile" className="container-page py-6">
            <ul className="divide-y divide-sand-100">
              {links.map((item) => (
                <li key={item._id}>
                  {item.children?.length ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpenSub((s) => (s === item._id ? null : item._id))}
                        className="flex w-full items-center justify-between py-4 text-lg text-forest-900"
                        aria-expanded={openSub === item._id}
                      >
                        {item.label}
                        <ChevronDown className={cn("h-5 w-5 transition-transform", openSub === item._id && "rotate-180")} />
                      </button>
                      {openSub === item._id && (
                        <ul className="pb-3 ps-4">
                          {item.children.map((child) => (
                            <li key={child._id}>
                              <CmsLink href={child.url} newTab={child.openInNewTab} className="block py-2 text-forest-700">
                                {child.label}
                              </CmsLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <CmsLink href={item.url} newTab={item.openInNewTab} current={isActive(pathname, item.url)} className="block py-4 text-lg text-forest-900">
                      {item.label}
                    </CmsLink>
                  )}
                </li>
              ))}
              <li>
                <MobileAccountLink />
              </li>
            </ul>
            <div className="mt-6 flex flex-col gap-3">
              {ctas.map((c) => (
                <CmsLink key={c._id} href={c.url} whatsapp={whatsapp} className={buttonClass("primary", "lg", "w-full")}>
                  {c.label}
                </CmsLink>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
