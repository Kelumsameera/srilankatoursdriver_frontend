"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import type { NavItem } from "@/types/cms";
import { cn, telLink } from "@/lib/utils";
import { CmsLink } from "@/components/ui/CmsLink";
import { buttonClass } from "@/components/ui/Button";
import { AccountMenu, MobileAccountLink } from "@/components/account/AccountMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface Props {
  destinationsHero?: boolean;
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

// Header height: 64px on phones/tablets, 80px on desktop; Tamil/Hindi add a 96px nav row.
// Keep in sync with: the open menu height below, the scroll-margin for anchors in app/globals.css and the
// "content unavailable" bar in app/[locale]/layout.tsx.

// True when a nav link points at the page that is open now (external links never are)
function isActive(pathname: string, url?: string) {
  if (!url || /^https?:/i.test(url)) return false;
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}

// The colour of a desktop nav link: dark on the white (scrolled) bar, white over the hero photo
const navTextColor = (solid: boolean) => (solid ? "text-forest-900 hover:text-forest-600" : "text-white/90 hover:text-white");

// Desktop nav link and dropdown button. min-h-11 gives a 44px tap target; the text stays the same size.
// Longer translations get a full-width desktop row; links wrap as whole items.
const WRAPPED_NAV_LOCALES = ["ta", "hi"];

const desktopNavItem = "relative flex min-h-11 items-center rounded-full px-1.5 text-[0.78rem] font-medium transition-colors 2xl:px-2.5 2xl:text-[0.88rem]";

/**
 * Site header: logo on the left, the main nav in the middle (from 1280px), language / phone / account / Book Now on the right.
 * Transparent over the hero, white once the page is scrolled or the mobile menu is open.
 * Below 1280px the nav moves into the mobile menu (fixed breakpoint, no measuring, so it never changes between page loads).
 */
export function SiteHeader({ nav, logoLight, logoDark, logoMobile, logoMobileLight, languages, phone, whatsapp, destinationsHero = false }: Props) {
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const wrappedNav = WRAPPED_NAV_LOCALES.includes(useLocale());
  const navItemClass = cn(desktopNavItem, "whitespace-nowrap", wrappedNav && "justify-center text-center leading-relaxed");

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [lastPathname, setLastPathname] = useState(pathname);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Solid bar once the page is scrolled a little
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A new page closes the mobile menu (state is reset during render, React's pattern for "reset on prop change")
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
    setOpenSubmenu(null);
  }

  // While the mobile menu is open: the page behind does not scroll, and Escape closes the menu and puts focus back on its button
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setOpenSubmenu(null);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const interiorPage = pathname !== "/";
  const destinationDetail = /^\/destinations\/[^/]+\/?$/.test(pathname);
  const imageHeroPage = destinationDetail || (pathname === "/destinations" && destinationsHero);
  const solid = (interiorPage && !imageHeroPage) || scrolled || menuOpen;
  // Nav items marked "CTA" in Admin → Navigation become the Book Now button; the rest are links
  const links = nav.filter((item) => !item.isCta);
  const ctas = nav.filter((item) => item.isCta);

  return (
    <>
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-500",
        solid ? "bg-white/95 shadow-[0_1px_0_rgb(0_0_0/0.06)] backdrop-blur-md" : "bg-linear-to-b from-black/40 to-transparent",
      )}
    >
      {/* HEADER BAR */}
      <div className={cn(
        "flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:px-8 2xl:px-10",
        wrappedNav ? "xl:grid xl:h-auto xl:grid-cols-[auto_1fr] xl:grid-rows-[5rem_auto] xl:gap-x-3 xl:gap-y-0" : "xl:h-20",
      )}>
        {/* LOGO */}
        <div className="flex shrink-0 items-center">
          <CmsLink href="/" className="flex items-center" ariaLabel={tCommon("home")}>
            <span className="hidden sm:block">{solid ? logoDark : logoLight}</span>
            <span className="sm:hidden">{solid ? logoMobile : logoMobileLight}</span>
          </CmsLink>
        </div>

        {/* DESKTOP NAV (from 1280px) */}
        <nav aria-label="Main" className={cn("hidden min-w-0 flex-1 justify-center xl:flex", wrappedNav && "xl:col-span-2 xl:row-start-2 xl:min-h-24 xl:pb-2")}>
          <ul
            className={cn("flex min-w-0 items-center", wrappedNav ? "w-full flex-wrap justify-center gap-x-4" : "gap-0 2xl:gap-0.5")}
          >
            {links.map((item) => {
              const active = isActive(pathname, item.url);
              return (
                <li key={item._id} className="group relative min-w-0">
                  {item.children?.length ? (
                    <>
                      {/* Dropdown: opens on hover and on keyboard focus */}
                      <button type="button" aria-haspopup="true" className={cn(navItemClass, "gap-0.5", navTextColor(solid))}>
                        <span className="min-w-0">{item.label}</span>
                        <ChevronDown className="h-3 w-3 shrink-0 2xl:h-3.5 2xl:w-3.5" aria-hidden />
                      </button>
                      <ul className="invisible absolute inset-s-0 top-full min-w-56 translate-y-2 rounded-2xl border border-sand-200 bg-white p-2 opacity-0 shadow-soft transition-all group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                        {item.children.map((child) => (
                          <li key={child._id}>
                            <CmsLink href={child.url} newTab={child.openInNewTab} className="block rounded-xl px-3 py-3 text-sm text-forest-900 hover:bg-sand-100">
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
                      current={active}
                      className={cn(
                        navItemClass,
                        navTextColor(solid),
                        active && (solid ? "text-forest-600" : "text-white"),
                        // Gold line under the current page
                        active && "after:absolute after:inset-x-2 after:bottom-0.5 after:h-0.5 after:rounded-full after:bg-gold-500 2xl:after:inset-x-3",
                      )}
                    >
                      {item.label}
                    </CmsLink>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ACTIONS: language, phone, account, Book Now, menu button. ms-auto keeps them on the right when the nav is hidden. */}
        <div className={cn("ms-auto flex shrink-0 items-center gap-0.5 sm:gap-1 2xl:gap-2", wrappedNav && "xl:col-start-2 xl:row-start-1")}>
          <LanguageSwitcher enabled={languages} tone={solid ? "dark" : "light"} />

          {phone && (
            <a
              href={telLink(phone)}
              aria-label={phone}
              className={cn("hidden h-11 w-11 items-center justify-center rounded-full lg:inline-flex", solid ? "text-forest-900" : "text-white")}
            >
              <Phone className="h-4 w-4" aria-hidden />
            </a>
          )}

          <AccountMenu tone={solid ? "dark" : "light"} />

          {/* Book Now: the same primary button as the CTA and section buttons (ButtonLink, size md) */}
          {ctas.map((cta) => (
            <span key={cta._id} className="hidden sm:block">
              <CmsLink href={cta.url} whatsapp={whatsapp} className={buttonClass("primary", "md")}>
                {cta.label}
              </CmsLink>
            </span>
          ))}

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? tNav("closeMenu") : tNav("openMenu")}
            className={cn("inline-flex h-11 w-11 items-center justify-center rounded-full xl:hidden", solid ? "text-forest-900" : "text-white")}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU (below 1280px). Height = screen minus the header bar. */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className={cn(
            "h-[calc(100dvh-4rem)] overflow-y-auto overflow-x-hidden border-t border-sand-200 bg-white xl:h-[calc(100dvh-5rem)]",
            "xl:hidden",
          )}
        >
          <nav aria-label="Mobile" className="px-6 py-6 lg:px-8">
            <ul className="divide-y divide-sand-100">
              {links.map((item) => (
                <li key={item._id}>
                  {item.children?.length ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpenSubmenu((current) => (current === item._id ? null : item._id))}
                        aria-expanded={openSubmenu === item._id}
                        className="flex w-full items-center justify-between py-4 text-lg text-forest-900"
                      >
                        {item.label}
                        <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform", openSubmenu === item._id && "rotate-180")} aria-hidden />
                      </button>
                      {openSubmenu === item._id && (
                        <ul className="pb-3 ps-4">
                          {item.children.map((child) => (
                            <li key={child._id}>
                              <CmsLink href={child.url} newTab={child.openInNewTab} className="block py-2.5 text-forest-700">
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

            {/* MOBILE BOOK NOW */}
            <div className="mt-6 flex flex-col gap-3">
              {ctas.map((cta) => (
                <CmsLink key={cta._id} href={cta.url} whatsapp={whatsapp} className={buttonClass("primary", "lg", "w-full")}>
                  {cta.label}
                </CmsLink>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
    {wrappedNav && interiorPage && !imageHeroPage && <div aria-hidden="true" className="hidden xl:block xl:h-24 xl:shrink-0" />}
    </>
  );
}
