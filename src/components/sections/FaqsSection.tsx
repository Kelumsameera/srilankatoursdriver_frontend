import type { Faq } from "@/types/cms";
import { Section } from "@/components/ui/misc";
import { FaqList } from "./FaqList";
import { Heading, sectionData, sectionTheme, type SectionProps } from "./sectionParts";

// "faqs" section: questions and answers that open one at a time
export function FaqsSection({ section, ctx }: SectionProps) {
  const { theme, light } = sectionTheme(section);
  const faqs = sectionData<Faq>(section);
  if (!faqs.length) return null;

  return (
    <Section theme={theme}>
      <Heading section={section} light={light} withAction={false} ctx={ctx} />
      <div className="mx-auto max-w-3xl">
        <FaqList items={faqs} />
      </div>
    </Section>
  );
}
