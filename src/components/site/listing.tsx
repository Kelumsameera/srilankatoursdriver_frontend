import type { ReactNode } from "react";
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

/** "/tours?category=x&days=5" from the set values only. */
function listHref(basePath: string, query: Record<string, string | undefined>) {
  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v) as [string, string][]).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function FilterChip({ href, label, selected }: { href: string; label: string; selected: boolean }) {
  return (
    <li className="shrink-0">
      <CmsLink
        href={href}
        current={selected}
        className={cn(
          "block whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
          selected ? "border-brand bg-forest-800 text-white shadow-card" : "border-sand-200 bg-surface text-brand hover:border-brand",
        )}
      >
        {label}
      </CmsLink>
    </li>
  );
}

/**
 * One swipeable row on phones, centred and wrapping on larger screens.
 * `inline`: from sm up the chips join the parent's flex row (FilterBar), so two filters can share lines.
 */
function ChipRow({ label, className, inline, children }: { label: string; className?: string; inline?: boolean; children: ReactNode }) {
  return (
    <nav aria-label={label} className={cn("-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0", inline && "sm:contents", className ?? "mb-8")}>
      <ul className={cn("flex w-max gap-1.5 sm:w-auto sm:flex-wrap sm:justify-center", inline && "sm:contents")}>{children}</ul>
    </nav>
  );
}

/** Several filters flowing as one centred, wrapping group of chips from sm up (stacked swipeable rows on phones). */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-8 space-y-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-1.5 sm:space-y-0">{children}</div>;
}

/** Thin line between two filters inside a FilterBar (larger screens only). */
export function FilterDivider() {
  return <span aria-hidden className="mx-1.5 hidden h-5 w-px bg-sand-200 sm:block" />;
}

/**
 * Category filter chips (links, so they work without JS and are crawlable).
 * `query` keeps the page's other filters (e.g. ?days=5 on /tours) when a category is picked.
 */
export function CategoryFilter({ basePath, categories, active, query = {}, className, inline }: { basePath: string; categories: Category[]; active?: string; query?: Record<string, string | undefined>; className?: string; inline?: boolean }) {
  const t = useTranslations("common");
  if (!categories.length) return null;
  return (
    <ChipRow label="Filter" className={className} inline={inline}>
      <FilterChip href={listHref(basePath, query)} label={t("all")} selected={!active} />
      {categories.map((c) => (
        <FilterChip key={c.slug} href={listHref(basePath, { category: c.slug, ...query })} label={c.name} selected={active === c.slug} />
      ))}
    </ChipRow>
  );
}

/** ?days= values of the tour length chips – must match `days` in backend/src/validations/public.ts. */
export const TOUR_DAY_OPTIONS = ["5", "8", "10", "12", "14", "1", "other"] as const;

export function tourDaysParam(sp: Record<string, string | string[] | undefined>): string | undefined {
  const v = param(sp, "days");
  return TOUR_DAY_OPTIONS.find((d) => d === v);
}

/** Tour length chips: 5, 8, 10, 12, 14 days, One day, Other – keeps the chosen category. */
export function TourDaysFilter({ basePath, active, category, inline }: { basePath: string; active?: string; category?: string; inline?: boolean }) {
  const t = useTranslations("tour");
  const label = (d: string) => (d === "1" ? t("oneDay") : d === "other" ? t("otherLengths") : t("daysCount", { count: Number(d) }));
  return (
    <ChipRow label={t("duration")} inline={inline} className={inline ? "" : undefined}>
      <FilterChip href={listHref(basePath, { category })} label={t("anyLength")} selected={!active} />
      {TOUR_DAY_OPTIONS.map((d) => (
        <FilterChip key={d} href={listHref(basePath, { category, days: d })} label={label(d)} selected={active === d} />
      ))}
    </ChipRow>
  );
}

export function Pagination({ meta, basePath, query = {} }: { meta: PaginationMeta; basePath: string; query?: Record<string, string | undefined> }) {
  const t = useTranslations("common");
  if (meta.totalPages <= 1) return null;
  const href = (p: number) => listHref(basePath, { ...query, page: p > 1 ? String(p) : undefined });
  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-4 text-sm">
      {meta.page > 1 ? (
        <CmsLink href={href(meta.page - 1)} className="inline-flex items-center gap-1 rounded-full border border-sand-200 bg-surface px-4 py-2 hover:border-brand">
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" /> {t("previous")}
        </CmsLink>
      ) : null}
      <span className="text-muted">{t("pageOf", { page: meta.page, total: meta.totalPages })}</span>
      {meta.page < meta.totalPages ? (
        <CmsLink href={href(meta.page + 1)} className="inline-flex items-center gap-1 rounded-full border border-sand-200 bg-surface px-4 py-2 hover:border-brand">
          {t("next")} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </CmsLink>
      ) : null}
    </nav>
  );
}
