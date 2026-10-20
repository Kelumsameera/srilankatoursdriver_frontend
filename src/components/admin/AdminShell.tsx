"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, ExternalLink, House, Languages, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, ShieldOff, Sun, X } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { errorMessage } from "@/lib/admin/api";
import { ADMIN_NAV, routePermission, type NavGroup } from "@/features/admin/navigation";
import { ADMIN_LOCALE_COOKIE, ADMIN_LOCALE_NAMES, ADMIN_LOCALES } from "@/features/admin/i18n";
import { ADMIN_THEME_KEY } from "@/features/admin/theme";
import { cn } from "@/lib/utils";
import { Empty, ErrorBlock, LoadingBlock } from "./ui";

const SIDEBAR_KEY = "admin_sidebar_collapsed";

function isActive(pathname: string, search: string, href: string) {
  const [path, query] = href.split("?");
  if (query) return pathname === path && search === query;
  if (path === "/admin") return pathname === "/admin";
  return (pathname === path || pathname.startsWith(`${path}/`)) && !search.startsWith("status=");
}

/** Sidebar labels are English in navigation.ts; show the admin language's version when there is one. */
function useNavLabel() {
  const t = useTranslations("nav");
  return (label: string) => (t.has(label) ? t(label) : label);
}

/** The sidebar groups and links this user may open. */
function useVisibleNav() {
  const { can } = useAuth();
  return ADMIN_NAV.map((g) => ({ ...g, children: g.children?.filter((c) => !c.perm || can(c.perm)) })).filter((g) => (g.href ? !g.perm || can(g.perm) : (g.children?.length ?? 0) > 0));
}

/** The most specific sidebar link for the current page, and its group (e.g. Tours › All Tours). */
function useActiveLink() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const visible = useVisibleNav();
  const links = visible.flatMap((g) => (g.children ?? []).map((c) => ({ ...c, group: g })));
  const active = links.filter((c) => isActive(pathname, search, c.href)).sort((a, b) => b.href.length - a.href.length)[0];
  return { visible, active, pathname, search };
}

/* ───────────── Light / dark ───────────── */

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** Sun / moon button: switches the admin between light and dark and remembers it on this device. */
function AdminThemeToggle() {
  const t = useTranslations("shell");
  const dark = useSyncExternalStore(subscribeTheme, () => document.documentElement.dataset.theme === "dark", () => false);
  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(ADMIN_THEME_KEY, next);
    } catch {
      // Private mode: the choice lasts for this page only.
    }
  };
  return (
    <button type="button" onClick={toggle} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label={dark ? t("lightMode") : t("darkMode")} title={dark ? t("lightMode") : t("darkMode")}>
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

/** EN / සිං switch: remembered in a cookie, the server re-renders the panel in that language. */
function AdminLanguageSwitcher() {
  const t = useTranslations("shell");
  const locale = useLocale();
  const router = useRouter();
  return (
    <label className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100">
      <Languages className="h-4 w-4" aria-hidden />
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        onChange={(e) => {
          document.cookie = `${ADMIN_LOCALE_COOKIE}=${e.target.value}; path=/; max-age=31536000; SameSite=Lax`;
          router.refresh();
        }}
        className="cursor-pointer bg-transparent text-sm text-slate-700 focus:outline-none"
      >
        {ADMIN_LOCALES.map((l) => (
          <option key={l} value={l}>
            {ADMIN_LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ───────────── Sidebar ───────────── */

/**
 * Admin navigation. Collapsed (desktop only) it shows just the icons with tooltips; clicking a group icon
 * opens the sidebar again on that group. Text colours are white-based so they stay readable in dark mode too.
 */
function Sidebar({ collapsed = false, onNavigate, onExpand }: { collapsed?: boolean; onNavigate?: () => void; onExpand?: () => void }) {
  const navLabel = useNavLabel();
  const { visible, active, pathname, search } = useActiveLink();
  const activeGroup = active?.group.label;
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const isOpen = (g: NavGroup) => open[g.label] ?? g.label === activeGroup;

  return (
    <nav aria-label="Admin" className={cn("space-y-0.5 text-sm", collapsed ? "p-2" : "p-3")}>
      {visible.map((g) => {
        const label = navLabel(g.label);
        if (g.href) {
          const current = isActive(pathname, search, g.href);
          return (
            <Link
              key={g.label}
              href={g.href}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              aria-current={current ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg py-2 font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                current ? "bg-forest-800 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <g.icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className={cn(collapsed && "sr-only")}>{label}</span>
            </Link>
          );
        }
        return (
          <div key={g.label}>
            <button
              type="button"
              title={collapsed ? label : undefined}
              onClick={() => {
                setOpen((o) => ({ ...o, [g.label]: collapsed ? true : !isOpen(g) }));
                if (collapsed) onExpand?.();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg py-2 font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                activeGroup === g.label ? "text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
                collapsed && activeGroup === g.label && "bg-white/10",
              )}
              aria-expanded={collapsed ? undefined : isOpen(g)}
            >
              <g.icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className={cn("flex-1 text-start", collapsed && "sr-only")}>{label}</span>
              {!collapsed && <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen(g) && "rotate-180")} aria-hidden />}
            </button>
            {!collapsed && isOpen(g) && (
              <ul className="mb-1 ms-[1.35rem] border-s border-white/10 ps-2">
                {g.children!.map((c) => (
                  <li key={c.href}>
                    <Link
                      href={c.href}
                      onClick={onNavigate}
                      aria-current={c.href === active?.href ? "page" : undefined}
                      className={cn("block rounded-md px-3 py-1.5 transition-colors", c.href === active?.href ? "bg-white/10 text-gold-400" : "text-white/55 hover:text-white")}
                    >
                      {navLabel(c.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/* ───────────── Top bar ───────────── */

/** Dashboard › Group › Page (› Edit / New) from the sidebar structure. */
function Breadcrumbs() {
  const navLabel = useNavLabel();
  const t = useTranslations("shell");
  const { active, pathname } = useActiveLink();
  if (pathname === "/admin") return null;
  const crumbs: { label: string; href?: string }[] = [];
  if (active) {
    if (active.group.label !== active.label) crumbs.push({ label: navLabel(active.group.label) });
    crumbs.push({ label: navLabel(active.label), href: active.href });
    const base = active.href.split("?")[0];
    if (pathname !== base && pathname.startsWith(`${base}/`)) crumbs.push({ label: pathname.endsWith("/new") ? t("new") : t("edit") });
  }
  return (
    <nav aria-label={t("breadcrumb")} className="hidden min-w-0 items-center gap-1.5 text-sm text-slate-500 md:flex">
      <Link href="/admin" className="rounded p-1 hover:bg-slate-100 hover:text-slate-800" aria-label={navLabel("Dashboard")}>
        <House className="h-4 w-4" />
      </Link>
      {crumbs.map((c, i) => (
        <span key={i} className="flex min-w-0 items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 rtl:rotate-180" aria-hidden />
          {c.href && i < crumbs.length - 1 ? (
            <Link href={c.href} className="truncate hover:text-slate-800">
              {c.label}
            </Link>
          ) : (
            <span className={cn("truncate", i === crumbs.length - 1 && "font-medium text-slate-800")} aria-current={i === crumbs.length - 1 ? "page" : undefined}>
              {c.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** Avatar button with name / role, link to the website and sign out. */
function UserMenu() {
  const t = useTranslations("shell");
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  if (!user) return null;
  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={t("userMenu")} className="flex items-center gap-2 rounded-lg p-1 pe-2 hover:bg-slate-100">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-800 text-xs font-semibold text-white">{initials}</span>
        <span className="hidden text-start text-xs leading-tight sm:block">
          <span className="block font-medium text-slate-800" data-testid="admin-user">
            {user.name}
          </span>
          <span className="block text-slate-500">{user.role?.name}</span>
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="animate-fade-up absolute end-0 top-full z-50 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="truncate text-sm font-medium text-slate-800">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <a href="/en" target="_blank" rel="noopener noreferrer" role="menuitem" className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <ExternalLink className="h-4 w-4 text-slate-400" /> {t("viewWebsite")}
          </a>
          <button
            type="button"
            role="menuitem"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              await logout();
              router.replace("/admin/login");
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" /> {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}

/* ───────────── Shell ───────────── */

/** Authenticated admin chrome. Redirects to /admin/login when there is no session. */
export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, error, reload, can } = useAuth();
  const t = useTranslations("shell");
  const router = useRouter();
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  // Desktop sidebar width, remembered on this device.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(SIDEBAR_KEY) === "1";
    } catch {
      return false;
    }
  });
  const toggleCollapsed = (next: boolean) => {
    setCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
    } catch {
      // Private mode: not remembered.
    }
  };

  useEffect(() => {
    if (!loading && !user && !error) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, error, router, pathname]);

  useEffect(() => {
    if (!mobile) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobile(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobile]);

  // The session could not be verified (API down / offline): don't bounce to the login page, offer a retry.
  if (!loading && !user && error) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <ErrorBlock message={errorMessage(error)} onRetry={() => void reload()} />
      </div>
    );
  }
  if (loading || !user) return <LoadingBlock />;
  const required = routePermission(pathname);
  const allowed = !required || can(required);

  const brand = (compact: boolean) => (
    <div className={cn("flex h-16 items-center gap-2 border-b border-white/10", compact ? "justify-center px-2" : "px-5")}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500 font-display text-lg font-semibold text-forest-950">S</span>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Sri Lanka Tours Driver</p>
          <p className="text-[11px] text-white/55">{t("crmCms")}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className={cn("fixed inset-y-0 start-0 z-40 hidden flex-col bg-forest-950 transition-[width] duration-200 lg:flex", collapsed ? "w-[4.5rem]" : "w-64")}>
        {brand(collapsed)}
        <div className="flex-1 overflow-y-auto">
          <Sidebar collapsed={collapsed} onExpand={() => toggleCollapsed(false)} />
        </div>
        <button
          type="button"
          onClick={() => toggleCollapsed(!collapsed)}
          className={cn("flex items-center gap-2 border-t border-white/10 py-3 text-sm text-white/55 hover:text-white", collapsed ? "justify-center" : "px-5")}
          aria-label={collapsed ? t("expand") : t("collapse")}
          title={collapsed ? t("expand") : t("collapse")}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4 rtl:-scale-x-100" /> : <PanelLeftClose className="h-4 w-4 rtl:-scale-x-100" />}
          {!collapsed && t("collapse")}
        </button>
      </aside>

      {/* Phone / tablet drawer */}
      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobile(false)} aria-hidden />
          <aside className="absolute inset-y-0 start-0 w-72 overflow-y-auto bg-forest-950" role="dialog" aria-modal="true" aria-label={t("adminMenu")}>
            <div className="flex items-center justify-between pe-3">
              {brand(false)}
              <button type="button" onClick={() => setMobile(false)} className="rounded p-1 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400" aria-label={t("closeMenu")} autoFocus>
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar onNavigate={() => setMobile(false)} />
          </aside>
        </div>
      )}

      <div className={cn("flex min-w-0 flex-1 flex-col transition-[padding] duration-200", collapsed ? "lg:ps-[4.5rem]" : "lg:ps-64")}>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button type="button" className="rounded-lg p-1.5 text-slate-600 lg:hidden" onClick={() => setMobile(true)} aria-label={t("openMenu")}>
            <Menu className="h-5 w-5" />
          </button>
          <Breadcrumbs />
          <div className="ms-auto flex items-center gap-1 sm:gap-2">
            <AdminLanguageSwitcher />
            <AdminThemeToggle />
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {allowed ? (
            children
          ) : (
            <Empty>
              <ShieldOff className="mx-auto mb-2 h-8 w-8 text-slate-400" aria-hidden />
              <p className="font-medium text-slate-700">{t("noAccess")}</p>
              <p className="mt-1">{t("noAccessHint", { permission: required ?? "" })}</p>
              <Link href="/admin" className="mt-3 inline-block text-forest-700 underline">
                {t("backToDashboard")}
              </Link>
            </Empty>
          )}
        </main>
      </div>
    </div>
  );
}
