import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Category, PaginationMeta } from "@/types/cms";
import { cn } from "@/lib/utils";
import { CmsLink } from "@/components/ui/CmsLink";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function param(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.length <= 120 ? s : undefined;
}

export function pageParam(sp: Record<string, string | string[] | undefined>): number {
  const n = Number(param(sp, "page") ?? 1);
  return Number.isInteger(n) && n > 0 && n < 1000 ? n : 1;
}

/** Category filter chips (links, so they work without JS and are crawlable). */
export function CategoryFilter({ basePath, categories, active }: { basePath: string; categories: Category[]; active?: string }) {
  const t = useTranslations("common");
  if (!categories.length) return null;
  const chip = (href: string, label: string, selected: boolean) => (
    <li key={href} className="shrink-0">
      <CmsLink
        href={href}
        current={selected}
        className={cn(
          "block whitespace-nowrap rounded-full border px-5 py-2 text-xs font-semibold tracking-wide transition-colors sm:text-sm",
          selected ? "border-forest-800 bg-forest-800 text-white shadow-card" : "border-sand-200 bg-white text-forest-800 hover:border-forest-800",
        )}
      >
        {label}
      </CmsLink>
    </li>
  );
  return (
    // One swipeable row on phones, centred and wrapping on larger screens.
    <nav aria-label="Filter" className="-mx-5 mb-10 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap sm:justify-center">
        {chip(basePath, t("all"), !active)}
        {categories.map((c) => chip(`${basePath}?category=${c.slug}`, c.name, active === c.slug))}
      </ul>
    </nav>
  );
}

export function Pagination({ meta, basePath, query = {} }: { meta: PaginationMeta; basePath: string; query?: Record<string, string | undefined> }) {
  const t = useTranslations("common");
  if (meta.totalPages <= 1) return null;
  const href = (p: number) => {
    const qs = new URLSearchParams(Object.entries({ ...query, page: p > 1 ? String(p) : undefined }).filter(([, v]) => v) as [string, string][]);
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-4 text-sm">
      {meta.page > 1 ? (
        <CmsLink href={href(meta.page - 1)} className="inline-flex items-center gap-1 rounded-full border border-sand-200 bg-white px-4 py-2 hover:border-forest-800">
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" /> {t("previous")}
        </CmsLink>
      ) : null}
      <span className="text-muted">{t("pageOf", { page: meta.page, total: meta.totalPages })}</span>
      {meta.page < meta.totalPages ? (
        <CmsLink href={href(meta.page + 1)} className="inline-flex items-center gap-1 rounded-full border border-sand-200 bg-white px-4 py-2 hover:border-forest-800">
          {t("next")} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </CmsLink>
      ) : null}
    </nav>
  );
}
