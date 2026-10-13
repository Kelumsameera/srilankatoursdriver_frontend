import type { Excursion } from "@/types/cms";
import { Section } from "@/components/ui/misc";
import { ExcursionCard } from "@/components/cards/ExcursionCard";
import { Heading, sectionData, sectionTheme, type SectionProps } from "./sectionParts";

// "excursions" section: a grid of excursion cards
export function ExcursionsSection({ section, ctx }: SectionProps) {
  const { theme, light } = sectionTheme(section);
  const excursions = sectionData<Excursion>(section);
  if (!excursions.length) return null;

  return (
    <Section theme={theme}>
      <Heading section={section} light={light} ctx={ctx} />
      <div className="grid grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-3">
        {excursions.map((excursion) => (
          <ExcursionCard key={excursion._id} excursion={excursion} />
        ))}
      </div>
    </Section>
  );
}
