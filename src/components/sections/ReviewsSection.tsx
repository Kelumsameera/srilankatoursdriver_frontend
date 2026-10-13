import type { Review } from "@/types/cms";
import { Section } from "@/components/ui/misc";
import { ReviewCard } from "@/components/cards/cards";
import { Marquee } from "@/components/ui/Marquee";
import { Heading, sectionData, sectionTheme, type SectionProps } from "./sectionParts";

// "reviews" section: a grid of review cards, or a moving marquee with the Carousel layout
export function ReviewsSection({ section, ctx }: SectionProps) {
  const { theme, light } = sectionTheme(section);
  const reviews = sectionData<Review>(section);
  if (!reviews.length) return null;

  return (
    <Section theme={theme}>
      <Heading section={section} light={light} ctx={ctx} />
      {section.settings?.layout === "carousel" ? (
        <Marquee
          items={reviews}
          getKey={(review) => review._id}
          label={section.title}
          itemClassName="w-[20rem] whitespace-normal sm:w-[26rem]"
          render={(review) => <ReviewCard review={review} />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}
    </Section>
  );
}
