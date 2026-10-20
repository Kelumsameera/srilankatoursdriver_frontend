import { CmsLink } from "@/components/ui/CmsLink";
import { SITE_URL } from "@/lib/config";
import { jsonLd } from "@/lib/seo";

/** Visible breadcrumbs + BreadcrumbList JSON-LD. Labels come from CMS page titles. */
export function Breadcrumbs({ locale, items, onLight = false, label = "Breadcrumb", dots = false }: { locale: string; items: { label: string; href?: string }[]; onLight?: boolean; label?: string; /** Accent-dot separators (destination pages). */ dots?: boolean }) {
  const list = items.filter((i) => i.label);
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}/${locale}${item.href === "/" ? "" : item.href}` } : {}),
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema)} />
      <nav aria-label={label} className={`mb-5 text-sm ${onLight ? "text-muted" : "text-white/70"}`}>
        <ol className="flex flex-wrap items-center gap-x-2">
          {list.map((item, i) => (
            <li key={`${item.label}-${i}`} className="flex items-center gap-2">
              {i > 0 && (dots ? <span className="dest-dot" aria-hidden /> : <span aria-hidden>/</span>)}
              {item.href && i < list.length - 1 ? (
                <CmsLink href={item.href} className={onLight ? "hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4" : "hover:text-white"}>
                  {item.label}
                </CmsLink>
              ) : (
                <span aria-current={i === list.length - 1 ? "page" : undefined} className="line-clamp-1">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
