import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/types/cms";
import { CmsImage } from "./CmsImage";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  light,
  action,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  align?: "center" | "left";
  light?: boolean;
  action?: ReactNode;
}) {
  if (!title && !eyebrow && !subtitle) return null;
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-4 md:mb-14",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className={cn("eyebrow mb-3", light && "text-gold-400")}>{eyebrow}</p>}
        {title && (
          <h2 className={cn("text-3xl leading-tight sm:text-4xl lg:text-[2.75rem]", light ? "text-white" : "text-forest-900")}>{title}</h2>
        )}
        {subtitle && <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", light ? "text-white/75" : "text-muted")}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} role="img" aria-label={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-4 w-4", i <= Math.round(rating) ? "fill-gold-500 text-gold-500" : "text-sand-200")} aria-hidden />
      ))}
    </div>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-forest-50 px-3 py-1 text-xs font-medium text-forest-700", className)}>
      {children}
    </span>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-sand-200 bg-white/60 p-10 text-center text-muted">{text}</p>;
}

/** Inner-page header: CMS page title / subtitle / image. */
export function PageHero({
  title,
  subtitle,
  image,
  eyebrow,
  children,
}: {
  title: string;
  subtitle?: string;
  image?: MediaAsset | null;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-forest-900 text-white">
      <CmsImage media={image} alt="" priority wrapperClassName="absolute inset-0 -z-10 opacity-60" className="animate-ken-burns" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-forest-950/70 via-forest-950/50 to-forest-950/80" />
      <div className="container-page pb-16 pt-36 sm:pb-20 sm:pt-44">
        {eyebrow && <p className="eyebrow mb-4 text-gold-400">{eyebrow}</p>}
        <h1 className="max-w-3xl animate-fade-up text-4xl leading-tight sm:text-5xl lg:text-6xl">{title}</h1>
        {subtitle && <p className="mt-5 max-w-2xl animate-fade-up text-lg text-white/80 [animation-delay:120ms]">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}

export function Section({ children, theme = "light", className, id }: { children: ReactNode; theme?: string; className?: string; id?: string }) {
  const themes: Record<string, string> = {
    light: "bg-sand-50",
    sand: "bg-sand-100",
    forest: "bg-forest-800 text-white",
    dark: "bg-forest-950 text-white",
  };
  return (
    <section id={id} className={cn("py-20 sm:py-24", themes[theme] ?? themes.light, className)}>
      <div className="container-page">{children}</div>
    </section>
  );
}
