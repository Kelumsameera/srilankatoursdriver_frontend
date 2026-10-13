import { Markdown } from "@/components/ui/Markdown";
import { Section, SectionHeading } from "@/components/ui/misc";
import { Buttons, sectionTheme, type SectionProps } from "./sectionParts";

// "richText" section: a heading and free text written in Admin → Pages, then the buttons
export function RichTextSection({ section, ctx }: SectionProps) {
  const { theme, light } = sectionTheme(section);

  return (
    <Section theme={theme}>
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} light={light} align="left" />
        <Markdown content={section.content} className={light ? "[&_*]:text-white/85" : ""} />
        <div className="mt-8">
          <Buttons section={section} ctx={ctx} light={light} />
        </div>
      </div>
    </Section>
  );
}
