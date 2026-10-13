import type { GuestShort } from "@/types/cms";
import { Section } from "@/components/ui/misc";
import { GuestShortsGrid } from "./GuestShorts";
import { Heading, sectionData, sectionTheme, type SectionProps } from "./sectionParts";

// "guestShorts" section: short guest videos (YouTube, Instagram, TikTok …)
export function GuestShortsSection({ section, ctx }: SectionProps) {
  const { theme, light } = sectionTheme(section);
  const shorts = sectionData<GuestShort>(section);
  if (!shorts.length) return null;

  return (
    <Section theme={theme}>
      <Heading section={section} light={light} ctx={ctx} />
      <GuestShortsGrid shorts={shorts} />
    </Section>
  );
}
