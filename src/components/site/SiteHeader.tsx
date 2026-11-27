"use client";

import { ChristmasBells } from "./ChristmasBells";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import type { NavItem } from "@/types/cms";
import { cn, telLink } from "@/lib/utils";
import { CmsLink } from "@/components/ui/CmsLink";
import { buttonClass } from "@/components/ui/Button";
import { AccountMenu, MobileAccountLink } from "@/components/account/AccountMenu";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface Props {
  /** Show the light/dark switch (Admin → Theme → Mode: "Visitor chooses"). */
  themeToggle?: boolean;
  /** Christmas bells hanging beside the logo (on while Admin → Theme → snow animation is on). */
  festive?: boolean;
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

// Header height: 64px on phones/tablets, 80px on desktop.
// Keep in sync with: the open menu height below, the scroll-margin for anchors in app/globals.css and the
// "content unavailable" bar in app/[locale]/layout.tsx.

// True when a nav link points at the page that is open now (external links never are)
function isActive(pathname: string, url?: string) {
  if (!url || /^https?:/i.test(url)) return false;
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}

// The colour of a desktop nav link: dark on the white (scrolled) bar, white over the hero photo
const navTextColor = (solid: boolean) => (solid ? "text-heading hover:text-forest-600" : "text-white/90 hover:text-white");

// Desktop nav link and dropdown button. min-h-11 gives a 44px tap target; the text stays the same size.
// Links stay on one line; the font and spacing fit the available desktop width.

const desktopNavItem = "relative flex min-h-11 items-center rounded-full px-[0.5em] text-[1em] font-medium transition-colors";

/**
 * Site header: logo on the left, the main nav in the middle (from 1280px), language / phone / account / Book Now on the right.
 * Transparent over the hero, white once the page is scrolled or the mobile menu is open.
 * Below 1280px the nav moves into the mobile menu. Desktop links always remain visible on a single line.
 */
export function SiteHeader({ nav, logoLight, logoDark, logoMobile, logoMobileLight, languages, phone, whatsapp, themeToggle = false, festive = false, destinationsHero = false }: Props) {
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const locale = useLocale();
  const navItemClass = cn(desktopNavItem, "whitespace-nowrap");

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [lastPathname, setLastPathname] = useState(pathname);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLUListElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const navScale = useRef(1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 80, left: 0 });

  // Fit translated labels without wrapping, clipping, or hiding desktop links.
  useEffect(() => {
    const bar = barRef.current;
    const logo = logoRef.current;
    const actions = actionsRef.current;
    const list = linksRef.current;
    const navigation = navRef.current;
    if (!bar || !logo || !actions || !list || !navigation) return;
    const measure = () => {
      if (!navigation.clientWidth) return;
      const naturalWidth = list.getBoundingClientRect().width / navScale.current;
      if (!naturalWidth) return;
      // Keep text readable; very long translations can scroll within this same row.
      const scale = Math.max(0.85, Math.min(1, Math.floor((navigation.clientWidth - 4) / naturalWidth * 1000) / 1000));
      list.style.marginInline = scale === 0.85 && naturalWidth * scale > navigation.clientWidth ? "0" : "auto";
      if (scale > 0 && Math.abs(scale - navScale.current) >= 0.002) {
        navScale.current = scale;
        list.style.fontSize = `${0.88 * scale}rem`;
      }
    };
    const observer = new ResizeObserver(measure);
    [bar, logo, actions, list, navigation].forEach((element) => observer.observe(element));
    measure();
    return () => observer.disconnect();
  }, [nav, locale]);

  // Solid bar once the page is scrolled a little
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

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
  // Standard CMS pages (including custom slugs) render PageHero or a CMS hero.
  // Utility/feed pages have no image behind the header and need a solid bar.
  const noHeroRoots = ["account", "blog", "community", "reels", "stories", "destinations"];
  const segments = pathname.split("/").filter(Boolean);
  const cmsHeroPage = segments.length === 1 && !noHeroRoots.includes(segments[0]);
  const detailHeroPage = /^\/(destinations|tours|excursions|blog|preview)\/[^/]+\/?$/.test(pathname);
  const imageHeroPage = pathname === "/" || cmsHeroPage || detailHeroPage || (pathname === "/destinations" && destinationsHero);
  const solid = (interiorPage && !imageHeroPage) || scrolled || menuOpen;
  // Nav items marked "CTA" in Admin → Navigation become the Book Now button; the rest are links
  const links = nav.filter((item) => !item.isCta);
  const ctas = nav.filter((item) => item.isCta);

  return (
    <>
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-500",
        solid ? "bg-surface/95 shadow-[0_1px_0_rgb(0_0_0/0.06)] backdrop-blur-md" : "bg-linear-to-b from-black/40 to-transparent",
      )}
    >
      {/* HEADER BAR */}
      <div ref={barRef} className={cn(
        "flex h-16 w-full items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8 xl:gap-2 xl:px-5",
        "xl:h-20",
      )}>
        {/* LOGO: may shrink on very narrow phones so the menu button always fits */}
        <div ref={logoRef} className="flex min-w-0 shrink items-center xl:shrink-0 xl:[zoom:0.8]">
          <CmsLink href="/" className="flex min-w-0 items-center" ariaLabel={tCommon("home")}>
            {/* On the solid bar: the dark logo, or the light one in dark mode */}
            <span className="hidden sm:block dark:sm:hidden">{solid ? logoDark : logoLight}</span>
            <span className="sm:hidden dark:hidden">{solid ? logoMobile : logoMobileLight}</span>
            <span className="hidden dark:sm:block">{logoLight}</span>
            <span className="hidden dark:block dark:sm:hidden">{logoMobileLight}</span>
          </CmsLink>
          {festive && <ChristmasBells />}
        </div>

        {/* DESKTOP NAV (from 1280px) */}
        <nav ref={navRef} aria-label="Main" className="hidden min-w-0 flex-1 items-center overflow-x-auto overscroll-x-contain xl:flex">
          <ul
            ref={linksRef}
            className="flex w-max shrink-0 items-center gap-0 text-[0.88rem]"
          >
            {links.map((item) => {
              const active = isActive(pathname, item.url);
              return (
                <li
                  key={item._id}
                  className="group relative min-w-0 shrink-0"
                  onMouseEnter={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setDropdownPosition({ top: rect.bottom, left: Math.max(8, Math.min(rect.left, window.innerWidth - 232)) });
                  }}
                  onFocus={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setDropdownPosition({ top: rect.bottom, left: Math.max(8, Math.min(rect.left, window.innerWidth - 232)) });
                  }}
                >
                  {item.children?.length ? (
                    <>
                      {/* Dropdown: opens on hover and on keyboard focus */}
                      <button type="button" aria-haspopup="true" className={cn(navItemClass, "gap-0.5", navTextColor(solid))}>
                        <span className="min-w-0">{item.label}</span>
                        <ChevronDown className="h-[1em] w-[1em] shrink-0" aria-hidden />
                      </button>
                      <ul style={dropdownPosition} className="invisible fixed z-50 w-56 translate-y-2 rounded-2xl border border-sand-200 bg-surface p-2 opacity-0 shadow-soft transition-all group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                        {item.children.map((child) => (
                          <li key={child._id}>
                            <CmsLink href={child.url} newTab={child.openInNewTab} className="block rounded-xl px-3 py-3 text-sm text-heading hover:bg-sand-100">
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
        <div ref={actionsRef} className={cn("ms-auto flex shrink-0 items-center gap-0 sm:gap-1 xl:gap-0 xl:[zoom:0.85]")}>
          <LanguageSwitcher enabled={languages} tone={solid ? "dark" : "light"} />

          {themeToggle && <ThemeToggle tone={solid ? "dark" : "light"} />}

          {phone && (
            <a
              href={telLink(phone)}
              aria-label={phone}
              className={cn("hidden h-11 w-11 items-center justify-center rounded-full lg:inline-flex", solid ? "text-heading" : "text-white")}
            >
              <Phone className="h-4 w-4" aria-hidden />
            </a>
          )}

          <AccountMenu tone={solid ? "dark" : "light"} />

          {/* Book Now: the same primary button as the CTA and section buttons (ButtonLink, size md) */}
          {ctas.map((cta) => (
            <span key={cta._id} className="hidden max-w-48 sm:block">
              <CmsLink href={cta.url} whatsapp={whatsapp} className={buttonClass("primary", "md", "whitespace-nowrap xl:px-4")}>
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
            className={cn("inline-flex h-11 w-11 items-center justify-center rounded-full", "xl:hidden", solid ? "text-heading" : "text-white")}
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
            "h-[calc(100dvh-4rem)] overflow-y-auto overflow-x-hidden border-t border-sand-200 bg-surface xl:h-[calc(100dvh-5rem)]",
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
                        className="flex w-full items-center justify-between py-4 text-lg text-heading"
                      >
                        {item.label}
                        <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform", openSubmenu === item._id && "rotate-180")} aria-hidden />
                      </button>
                      {openSubmenu === item._id && (
                        <ul className="pb-3 ps-4">
                          {item.children.map((child) => (
                            <li key={child._id}>
                              <CmsLink href={child.url} newTab={child.openInNewTab} className="block py-2.5 text-brand-soft">
                                {child.label}
                              </CmsLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <CmsLink href={item.url} newTab={item.openInNewTab} current={isActive(pathname, item.url)} className="block py-4 text-lg text-heading">
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
    </>
  );
}
