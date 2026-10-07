"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ExternalLink, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { ADMIN_NAV, type NavGroup } from "@/features/admin/navigation";
import { cn } from "@/lib/utils";
import { LoadingBlock } from "./ui";

function isActive(pathname: string, search: string, href: string) {
  const [path, query] = href.split("?");
  if (query) return pathname === path && search === query;
  if (path === "/admin") return pathname === "/admin";
  return (pathname === path || pathname.startsWith(`${path}/`)) && !search.startsWith("status=");
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const { can } = useAuth();
  const visible = ADMIN_NAV.map((g) => ({ ...g, children: g.children?.filter((c) => !c.perm || can(c.perm)) })).filter(
    (g) => (g.href ? !g.perm || can(g.perm) : (g.children?.length ?? 0) > 0),
  );
  // Highlight only the most specific matching link (e.g. "Homepage" rather than also "Pages").
  const activeHref = visible
    .flatMap((g) => g.children ?? [])
    .filter((c) => isActive(pathname, search, c.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const activeGroup = visible.find((g) => g.children?.some((c) => c.href === activeHref))?.label;
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const isOpen = (g: NavGroup) => open[g.label] ?? g.label === activeGroup;

  return (
    <nav aria-label="Admin" className="space-y-0.5 p-3 text-sm">
      {visible.map((g) =>
        g.href ? (
          <Link
            key={g.label}
            href={g.href}
            onClick={onNavigate}
            className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium", isActive(pathname, search, g.href) ? "bg-forest-800 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white")}
          >
            <g.icon className="h-4 w-4" /> {g.label}
          </Link>
        ) : (
          <div key={g.label}>
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [g.label]: !isOpen(g) }))}
              className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-medium", activeGroup === g.label ? "text-white" : "text-slate-300 hover:bg-white/5 hover:text-white")}
              aria-expanded={isOpen(g)}
            >
              <g.icon className="h-4 w-4" />
              <span className="flex-1 text-start">{g.label}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen(g) && "rotate-180")} />
            </button>
            {isOpen(g) && (
              <ul className="mb-1 ms-[1.35rem] border-s border-white/10 ps-2">
                {g.children!.map((c) => (
                  <li key={c.href}>
                    <Link
                      href={c.href}
                      onClick={onNavigate}
                      className={cn("block rounded-md px-3 py-1.5", c.href === activeHref ? "bg-white/10 text-gold-400" : "text-slate-400 hover:text-white")}
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ),
      )}
    </nav>
  );
}

/** Authenticated admin chrome. Redirects to /admin/login when there is no session. */
export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading || !user) return <LoadingBlock />;

  const brand = (
    <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500 font-display text-lg font-semibold text-forest-950">S</span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-white">Sri Lanka Tours Driver</p>
        <p className="text-[11px] text-slate-400">CRM & CMS</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 overflow-y-auto bg-forest-950 lg:block">
        {brand}
        <Sidebar />
      </aside>
      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobile(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 overflow-y-auto bg-forest-950">
            <div className="flex items-center justify-between pe-3">
              {brand}
              <button type="button" onClick={() => setMobile(false)} className="text-white" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar onNavigate={() => setMobile(false)} />
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col lg:ps-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button type="button" className="rounded-lg p-1.5 text-slate-600 lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <a href="/en" target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1 text-sm text-slate-500 hover:text-forest-700 sm:inline-flex">
            View website <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <div className="ms-auto flex items-center gap-3">
            <div className="text-end text-xs leading-tight">
              <p className="font-medium text-slate-800" data-testid="admin-user">
                {user.name}
              </p>
              <p className="text-slate-500">{user.role?.name}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.replace("/admin/login");
              }}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
