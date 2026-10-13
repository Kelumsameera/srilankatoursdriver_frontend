import { cn } from "@/lib/utils";
import { Markdown } from "@/components/ui/Markdown";
import { Section } from "@/components/ui/misc";
import { FeatureIcon } from "@/components/ui/icons";
import { Heading, sectionTheme, type SectionProps } from "./sectionParts";

// "features" section: a grid of icon cards (3 per row, or 4 when there are 4 or more)
export function FeaturesSection({ section, ctx }: SectionProps) {
  const { theme, light } = sectionTheme(section);
  const items = section.items ?? [];

  return (
    <Section theme={theme}>
      <Heading section={section} light={light} ctx={ctx} />
      {section.content && <Markdown content={section.content} className="mx-auto mb-12 max-w-3xl text-center" />}

      {/* FEATURE CARDS */}
      <ul className={cn("grid gap-6 sm:grid-cols-2", items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
        {items.map((item, i) => (
          <li
            key={`${item.title}-${i}`}
            className={cn("rounded-3xl p-7 transition-colors", light ? "bg-white/5 hover:bg-white/10" : "bg-white shadow-card")}
          >
            <span className={cn("mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl", light ? "bg-gold-500/15" : "bg-forest-50")}>
              <FeatureIcon name={item.icon} className={cn("h-7 w-7", light ? "text-gold-400" : "text-forest-600")} />
            </span>
            {item.title && <h3 className={cn("text-h3", light ? "text-white" : "text-forest-900")}>{item.title}</h3>}
            {item.description && <p className={cn("mt-2 text-small leading-relaxed", light ? "text-white/70" : "text-muted")}>{item.description}</p>}
          </li>
        ))}
      </ul>
    </Section>
  );
}
