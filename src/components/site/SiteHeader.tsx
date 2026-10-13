"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronDown, Menu, Phone, X } from "lucide-react";
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
  // Desktop menu (from lg): as many items as fit next to the logo and actions are shown in the bar, the rest go
  // into a "More" dropdown. Label lengths differ a lot between the 14 languages, so this is measured (on a hidden
  // copy of the list) rather than tied to a breakpoint. If fewer than three items fit, the menu button is used.
  const barRef = useRef<HTMLDivElement>(null);
  const navListRef = useRef<HTMLUListElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(Number.MAX_SAFE_INTEGER);
  const [compact, setCompact] = useState(false);
  // Until the first measurement the bar would show every item and could overflow, so it stays invisible.
  const [measured, setMeasured] = useState(false);
  useEffect(() => {
    const bar = barRef.current;
    const list = navListRef.current;
    if (!bar || !list || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const logo = (bar.firstElementChild as HTMLElement | null)?.getBoundingClientRect().width ?? 0;
      const actions = (actionsRef.current?.getBoundingClientRect().width ?? 0) - (toggleRef.current?.getBoundingClientRect().width ?? 0);
      const style = getComputedStyle(bar);
      const inner = bar.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const items = Array.from(list.children) as HTMLElement[];
      const more = items.pop()?.getBoundingClientRect().width ?? 0; // last child = the "More" button
      const widths = items.map((li) => li.getBoundingClientRect().width + 2); // + gap-0.5
      const available = inner - logo - actions - 48;
      let count = widths.length;
      if (widths.reduce((a, b) => a + b, 0) > available) {
        let used = more;
        count = 0;
        for (const w of widths) {
          if (used + w > available) break;
          used += w;
          count++;
        }
      }
      setVisible(count);
      setCompact(count < Math.min(3, widths.length));
      setMeasured(true);
    });
    ro.observe(bar);
    ro.observe(list);
    // The actions grow after hydration (sign-in state, web fonts), so watch them too.
    if (actionsRef.current) ro.observe(actionsRef.current);
    return () => ro.disconnect();
  }, []);
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

  // Destination detail pages use a white editorial hero beneath the fixed header.
  const solid = scrolled || open || /^\/destinations\/[^/]+\/?$/.test(pathname);
  const links = nav.filter((n) => !n.isCta);
  const ctas = nav.filter((n) => n.isCta);
  const shown = links.slice(0, visible);
  const overflow = links.slice(visible);
  const itemClass = "whitespace-nowrap rounded-full px-1.5 py-1.5 text-[0.8rem] font-medium transition-colors";
  const tone = solid ? "text-forest-900 hover:text-forest-600" : "text-white/90 hover:text-white";
  // The "More" dropdown sits at the end of the bar, so it opens towards the start (`end-0`).
  const dropdownClass =
    "invisible absolute top-full z-10 min-w-56 translate-y-2 rounded-2xl border border-sand-200 bg-white p-2 opacity-0 shadow-soft transition-all group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-500",
        solid ? "bg-white/95 shadow-[0_1px_0_rgb(0_0_0/0.06)] backdrop-blur-md" : "bg-gradient-to-b from-black/40 to-transparent",
      )}
    >
      <div ref={barRef} className="container-page relative flex h-16 items-center justify-between gap-2 sm:gap-4 xl:max-w-[90rem]">
        {/* The logo may shrink on very narrow phones so the header actions always fit. */}
        <CmsLink href="/" className="flex min-w-0 shrink items-center sm:shrink-0" ariaLabel={tc("home")}>
          <span className="hidden max-w-[12rem] sm:block xl:max-w-[14rem]">{solid ? logoDark : logoLight}</span>
          <span className="min-w-0 sm:hidden">{solid ? logoMobile : logoMobileLight}</span>
        </CmsLink>

        {/* Hidden copy of the full menu, used only to measure how many items fit (last item = the "More" button). */}
        <div className="pointer-events-none invisible absolute start-0 top-0 -z-10 h-0 w-0 overflow-hidden" aria-hidden inert>
          <ul ref={navListRef} className="flex w-max">
            {links.map((item) => (
              <li key={item._id} className={cn(itemClass, "flex items-center gap-1")}>
                {item.label}
                {item.children?.length ? <ChevronDown className="h-3.5 w-3.5" /> : null}
              </li>
            ))}
            <li className={cn(itemClass, "flex items-center gap-1")}>
              {t("more")}
              <ChevronDown className="h-3.5 w-3.5" />
            </li>
          </ul>
        </div>

        <nav aria-label="Main" className={cn(compact ? "hidden" : "hidden lg:block", !measured && "invisible")}>
          <ul className="flex items-center gap-0.5">
            {shown.map((item) => (
              <li key={item._id} className="group relative">
                {item.children?.length ? (
                  <>
                    <button type="button" className={cn(itemClass, "flex items-center gap-1", tone)} aria-haspopup="true">
                      {item.label}
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <ul className={cn(dropdownClass, "start-0")}>
                      {item.children.map((child) => (
                        <li key={child._id}>
                          <CmsLink
                            href={child.url}
                            newTab={child.openInNewTab}
                            className="block rounded-xl px-3 py-2 text-sm text-forest-900 hover:bg-sand-100"
                          >
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
                      itemClass,
                      "relative block",
                      tone,
                      isActive(pathname, item.url) && (solid ? "text-forest-600" : "text-white"),
                      isActive(pathname, item.url) && "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-gold-500",
                    )}
                  >
                    {item.label}
                  </CmsLink>
                )}
              </li>
            ))}
            {overflow.length > 0 && (
              <li className="group relative">
                <button type="button" className={cn(itemClass, "flex items-center gap-1", tone)} aria-haspopup="true">
                  {t("more")}
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                </button>
                <ul className={cn(dropdownClass, "end-0")}>
                  {overflow.map((item) => (
                    <li key={item._id}>
                      <CmsLink
                        href={item.url}
                        newTab={item.openInNewTab}
                        current={isActive(pathname, item.url)}
                        className="block rounded-xl px-3 py-2 text-sm font-medium text-forest-900 hover:bg-sand-100"
                      >
                        {item.label}
                      </CmsLink>
                      {item.children?.map((child) => (
                        <CmsLink
                          key={child._id}
                          href={child.url}
                          newTab={child.openInNewTab}
                          className="block rounded-xl py-2 pe-3 ps-6 text-sm text-forest-700 hover:bg-sand-100"
                        >
                          {child.label}
                        </CmsLink>
                      ))}
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
        </nav>

        <div ref={actionsRef} className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          <LanguageSwitcher enabled={languages} tone={solid ? "dark" : "light"} />
          {phone && (
            <a href={telLink(phone)} className={cn("hidden rounded-full p-2 2xl:inline-flex", solid ? "text-forest-900" : "text-white")} aria-label={phone}>
              <Phone className="h-4 w-4" />
            </a>
          )}
          <AccountMenu tone={solid ? "dark" : "light"} />
          {ctas.map((c) => (
            <span key={c._id} className="hidden max-w-[13rem] sm:block">
              <CmsLink href={c.url} whatsapp={whatsapp} className={buttonClass(solid ? "secondary" : "primary", "sm", "group/cta rounded-md leading-tight px-3 py-1.5 text-xs")}>
                {c.label}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-0.5 rtl:rotate-180" aria-hidden />
              </CmsLink>
            </span>
          ))}
          <button
            ref={toggleRef}
            type="button"
            className={cn("inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-2", !compact && "lg:hidden", solid ? "text-forest-900" : "text-white")}
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
        <div id="mobile-menu" className={cn("h-[calc(100dvh-4rem)] overflow-y-auto border-t border-sand-200 bg-white", !compact && "lg:hidden")}>
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
