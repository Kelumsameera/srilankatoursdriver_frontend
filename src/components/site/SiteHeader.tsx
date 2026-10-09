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
  whatsapp?: {
    phone?: string;
    message?: string;
  };
}

/**
 * Check whether a navigation URL represents the current route.
 */
function isActive(pathname: string, url?: string) {
  if (!url || /^https?:/i.test(url)) {
    return false;
  }

  if (url === "/") {
    return pathname === "/";
  }

  return pathname === url || pathname.startsWith(`${url}/`);
}

/**
 * Site Header
 *
 * - Transparent over hero
 * - Solid after scrolling
 * - Logo aligned left
 * - Desktop navigation centered
 * - Actions aligned right
 * - Responsive mobile navigation
 */
export function SiteHeader({ nav, logoLight, logoDark, logoMobile, logoMobileLight, languages, phone, whatsapp }: Props) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null);

  /**
   * Detect page scroll.
   */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  /**
   * Close mobile menu when route changes.
   */
  const [lastPath, setLastPath] = useState(pathname);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
    setOpenSub(null);
  }

  /**
   * Mobile menu toggle ref.
   */
  const toggleRef = useRef<HTMLButtonElement>(null);

  /**
   * Lock body scroll while mobile menu is open
   * and allow Escape to close it.
   */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    if (!open) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setOpen(false);
      setOpenSub(null);

      toggleRef.current?.focus();
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = "";

      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /**
   * Header becomes solid when:
   * - user scrolls
   * - mobile menu is open
   */
  const solid = scrolled || open;

  /**
   * Separate normal links from CTA links.
   */
  const links = nav.filter((item) => !item.isCta);

  const ctas = nav.filter((item) => item.isCta);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40",
        "transition-all duration-500",

        solid ? ["bg-white/95", "shadow-[0_1px_0_rgb(0_0_0/0.06)]", "backdrop-blur-md"] : ["bg-linear-to-b", "from-black/40", "to-transparent"],
      )}
    >
      {/* ============================================================
          HEADER BAR
      ============================================================ */}

      <div
        className="
          flex h-20 w-full
          items-center
          gap-3
          px-4
          sm:px-6
          lg:px-8
          2xl:px-10
        "
      >
        {/* ==========================================================
            LEFT — LOGO
        ========================================================== */}

        <div className="flex shrink-0 items-center">
          <CmsLink href="/" className="flex items-center" ariaLabel={tc("home")}>
            {/* Desktop / tablet logo */}
            <span className="hidden sm:block">{solid ? logoDark : logoLight}</span>

            {/* Mobile logo */}
            <span className="sm:hidden">{solid ? logoMobile : logoMobileLight}</span>
          </CmsLink>
        </div>

        {/* ==========================================================
            CENTER — DESKTOP NAVIGATION
        ========================================================== */}

        <nav
          aria-label="Main"
          className="
            hidden
            min-w-0
            flex-1
            justify-center
            xl:flex
          "
        >
          <ul
            className="
              flex
              min-w-0
              items-center
              gap-0
              2xl:gap-0.5
            "
          >
            {links.map((item) => {
              const active = isActive(pathname, item.url);

              return (
                <li key={item._id} className="group relative">
                  {/* ==================================================
                      DESKTOP DROPDOWN
                  ================================================== */}

                  {item.children?.length ? (
                    <>
                      <button
                        type="button"
                        className={cn(
                          // Compact at 1280px
                          "flex items-center",
                          "gap-0.5",
                          "whitespace-nowrap",
                          "rounded-full",
                          "px-1.5 py-2",
                          "2xl:px-2.5",

                          "text-[0.78rem]",
                          "2xl:text-[0.88rem]",

                          "font-medium",
                          "transition-colors",

                          solid ? ["text-forest-900", "hover:text-forest-600"] : ["text-white/90", "hover:text-white"],
                        )}
                        aria-haspopup="true"
                      >
                        {item.label}

                        <ChevronDown
                          className="
                            h-3 w-3
                            2xl:h-3.5
                            2xl:w-3.5
                          "
                          aria-hidden
                        />
                      </button>

                      {/* Dropdown */}
                      <ul
                        className="
                          invisible
                          absolute
                          inset-s-0
                          top-full
                          min-w-56
                          translate-y-2

                          rounded-2xl
                          border
                          border-sand-200

                          bg-white
                          p-2

                          opacity-0
                          shadow-soft

                          transition-all

                          group-focus-within:visible
                          group-focus-within:translate-y-0
                          group-focus-within:opacity-100

                          group-hover:visible
                          group-hover:translate-y-0
                          group-hover:opacity-100
                        "
                      >
                        {item.children.map((child) => (
                          <li key={child._id}>
                            <CmsLink
                              href={child.url}
                              newTab={child.openInNewTab}
                              className="
                                  block
                                  rounded-xl
                                  px-3
                                  py-2
                                  text-sm
                                  text-forest-900
                                  hover:bg-sand-100
                                "
                            >
                              {child.label}
                            </CmsLink>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    /* =================================================
                       NORMAL DESKTOP LINK
                    ================================================= */

                    <CmsLink
                      href={item.url}
                      newTab={item.openInNewTab}
                      current={active}
                      className={cn(
                        "relative",
                        "whitespace-nowrap",
                        "rounded-full",

                        "px-1.5 py-2",
                        "2xl:px-2.5",

                        "text-[0.78rem]",
                        "2xl:text-[0.88rem]",

                        "font-medium",
                        "transition-colors",

                        solid ? ["text-forest-900", "hover:text-forest-600"] : ["text-white/90", "hover:text-white"],

                        active && (solid ? "text-forest-600" : "text-white"),

                        active && ["after:absolute", "after:inset-x-2", "2xl:after:inset-x-3", "after:-bottom-0.5", "after:h-0.5", "after:rounded-full", "after:bg-gold-500"],
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

        {/* ==========================================================
            RIGHT — HEADER ACTIONS
        ========================================================== */}

        <div
          className="
            flex
            shrink-0
            items-center
            gap-0.5
            sm:gap-1
            2xl:gap-2
          "
        >
          {/* ========================================================
              LANGUAGE
          ======================================================== */}

          <LanguageSwitcher enabled={languages} tone={solid ? "dark" : "light"} />

          {/* ========================================================
              PHONE
          ======================================================== */}

          {phone && (
            <a
              href={telLink(phone)}
              className={cn(
                "hidden",
                "rounded-full",
                "p-2",
                "lg:inline-flex",

                solid ? "text-forest-900" : "text-white",
              )}
              aria-label={phone}
            >
              <Phone className="h-4 w-4" aria-hidden />
            </a>
          )}

          {/* ========================================================
              ACCOUNT
          ======================================================== */}

          <AccountMenu tone={solid ? "dark" : "light"} />

          {/* ========================================================
              CTA
          ======================================================== */}

          {ctas.map((cta) => (
            <span
              key={cta._id}
              className="
                hidden
                sm:block
              "
            >
              <CmsLink
                href={cta.url}
                whatsapp={whatsapp}
                className={cn(
                  buttonClass("primary", "sm"),
                  // Keep CTA compact on smaller desktop screens.
                  "2xl:px-4",
                )}
              >
                {cta.label}
              </CmsLink>
            </span>
          ))}

          {/* ========================================================
              MOBILE MENU BUTTON
          ======================================================== */}

          <button
            ref={toggleRef}
            type="button"
            className={cn(
              "rounded-full",
              "p-2",
              "xl:hidden",

              solid ? "text-forest-900" : "text-white",
            )}
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t("closeMenu") : t("openMenu")}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* ==============================================================
          MOBILE MENU
      ============================================================== */}

      {open && (
        <div
          id="mobile-menu"
          className="
            h-[calc(100dvh-5rem)]
            overflow-y-auto
            border-t
            border-sand-200
            bg-white
            xl:hidden
          "
        >
          <nav
            aria-label="Mobile"
            className="
              px-6
              py-6
              lg:px-8
            "
          >
            <ul
              className="
                divide-y
                divide-sand-100
              "
            >
              {links.map((item) => (
                <li key={item._id}>
                  {/* ==================================================
                      MOBILE DROPDOWN
                  ================================================== */}

                  {item.children?.length ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpenSub((current) => (current === item._id ? null : item._id))}
                        className="
                          flex
                          w-full
                          items-center
                          justify-between
                          py-4
                          text-lg
                          text-forest-900
                        "
                        aria-expanded={openSub === item._id}
                      >
                        {item.label}

                        <ChevronDown
                          className={cn(
                            "h-5 w-5",
                            "transition-transform",

                            openSub === item._id && "rotate-180",
                          )}
                        />
                      </button>

                      {/* Mobile submenu */}
                      {openSub === item._id && (
                        <ul
                          className="
                            pb-3
                            ps-4
                          "
                        >
                          {item.children.map((child) => (
                            <li key={child._id}>
                              <CmsLink
                                href={child.url}
                                newTab={child.openInNewTab}
                                className="
                                    block
                                    py-2
                                    text-forest-700
                                  "
                              >
                                {child.label}
                              </CmsLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    /* =================================================
                       MOBILE NORMAL LINK
                    ================================================= */

                    <CmsLink
                      href={item.url}
                      newTab={item.openInNewTab}
                      current={isActive(pathname, item.url)}
                      className="
                        block
                        py-4
                        text-lg
                        text-forest-900
                      "
                    >
                      {item.label}
                    </CmsLink>
                  )}
                </li>
              ))}

              {/* ====================================================
                  MOBILE ACCOUNT
              ==================================================== */}

              <li>
                <MobileAccountLink />
              </li>
            </ul>

            {/* ======================================================
                MOBILE CTA
            ====================================================== */}

            <div
              className="
                mt-6
                flex
                flex-col
                gap-3
              "
            >
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
  );
}
