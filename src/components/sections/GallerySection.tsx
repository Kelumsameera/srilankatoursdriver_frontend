import { getTranslations } from "next-intl/server";
import type { GalleryItem } from "@/types/cms";
import { Section } from "@/components/ui/misc";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { Heading, sectionData, sectionTheme, type SectionProps } from "./sectionParts";

// "gallery" section: a photo/video strip, or a moving marquee with the Carousel layout
export async function GallerySection({ section, ctx }: SectionProps) {
  const { theme, light } = sectionTheme(section);
  const items = sectionData<GalleryItem>(section);
  if (!items.length) return null;
  const [tCommon, tGallery] = await Promise.all([getTranslations("common"), getTranslations("gallery")]);

  return (
    <Section theme={theme}>
      <Heading section={section} light={light} ctx={ctx} />
      <GalleryGrid
        items={items}
        variant={section.settings?.layout === "carousel" ? "marquee" : "strip"}
        labels={{
          close: tCommon("close"),
          previous: tCommon("previous"),
          next: tCommon("next"),
          all: tCommon("all"),
          photos: tGallery("photos"),
          videos: tGallery("videos"),
        }}
      />
    </Section>
  );
}
