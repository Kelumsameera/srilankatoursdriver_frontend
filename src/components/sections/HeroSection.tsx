import { getTranslations } from "next-intl/server";
import type { HeroSlide } from "@/types/cms";
import { FeatureIcon } from "@/components/ui/icons";
import { HeroSlider } from "./HeroSlider";
import { FoliageCluster } from "./home/Foliage";
import { sectionData, type SectionItem, type SectionProps } from "./sectionParts";

/** Trust row under the hero: the page's "Why travel with us" items as gold line icons (design: below the hero). */
function TrustHighlights({ items }: { items: SectionItem[] }) {
  return (
    <div className="relative z-10 bg-sand-50">
      <ul className="container-page grid grid-cols-2 gap-y-4 py-5 sm:py-6 lg:grid-cols-4 lg:divide-x lg:divide-sand-200 rtl:lg:divide-x-reverse">
        {items.map((item, i) => (
          <li key={`${item.title}-${i}`} className="flex min-w-0 items-center gap-3 px-2 lg:justify-center lg:px-5">
            <FeatureIcon name={item.icon} className="h-7 w-7 shrink-0 text-gold-600 sm:h-8 sm:w-8" />
            <span className="min-w-0 text-small font-semibold leading-tight text-forest-900 wrap-anywhere hyphens-auto">{item.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// "hero" section: the photo/video slideshow with foliage in the bottom corners, then the trust row
export async function HeroSection({ section, ctx }: SectionProps) {
  const slides = sectionData<HeroSlide>(section);
  if (!slides.length) return null;
  const [tCommon, tReviews] = await Promise.all([getTranslations("common"), getTranslations("reviews")]);
  // The selling points come from the page's "Why travel with us" section
  const points = (ctx.highlights ?? []).filter((h) => h.title).slice(0, 4);

  return (
    // z-10 + isolate: the foliage (behind the hero and trust row) reaches over the edge into the next section.
    <div className="relative isolate z-10 overflow-x-clip">
      {/* SLIDESHOW + FOLIAGE */}
      <div className="relative">
        <HeroSlider
          slides={slides}
          rating={ctx.rating ? { value: ctx.rating.value, label: tReviews("basedOn", { count: ctx.rating.count }), source: "TripAdvisor" } : undefined}
          whatsapp={{ phone: ctx.settings?.whatsapp, message: ctx.settings?.whatsappMessage }}
          labels={{
            previous: tCommon("previous"),
            next: tCommon("next"),
            pause: tCommon("pauseSlideshow"),
            play: tCommon("playSlideshow"),
            playVideo: tCommon("playVideo"),
            pauseVideo: tCommon("pauseVideo"),
          }}
        />
        <FoliageCluster front side="left" className="bottom-0 translate-y-[18%]" />
        <FoliageCluster front side="right" className="bottom-0 translate-y-[18%]" />
      </div>

      {/* TRUST ROW */}
      {points.length > 0 && <TrustHighlights items={points} />}
    </div>
  );
}
