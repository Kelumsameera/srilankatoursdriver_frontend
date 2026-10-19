import { ArrowUpRight } from "lucide-react";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { DotEyebrow } from "@/components/destinations/Eyebrow";
import { ExpandableText } from "@/components/destinations/ExpandableText";
import { reveal3d } from "@/lib/reveal";
import type { Destination } from "@/types/cms";

// Translated texts passed in by the page
interface Labels {
  eyebrow: string;
  heading: string;
  /** e.g. "in Kandy" */
  subheading: string;
  readMore: string;
  readLess: string;
}

const readMoreLinkClass =
  "mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-forest-800 underline decoration-gold-400 underline-offset-4 transition-colors duration-200 hover:text-forest-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest-800";

// "Things to see" grid built from the destination's attractions.
// An attraction without a photo shows a plain panel with its name.
export function FeaturedExperiences({ items, labels }: { items: NonNullable<Destination["featuredExperiences"]>; labels: Labels }) {
  const experiences = items.filter((experience) => experience.title?.trim());
  if (!experiences.length) return null;

  return (
    <section className="border-t border-sand-200 py-10 sm:py-12" aria-labelledby="featured-experiences-title">
      {/* HEADING */}
      <div className="mb-6 sm:mb-8" data-scroll-reveal>
        <DotEyebrow>{labels.eyebrow}</DotEyebrow>
        <h2 id="featured-experiences-title" className="mt-4 font-display text-3xl tracking-tight text-ink sm:text-4xl">
          {labels.heading}
          <span className="mt-2 block font-display text-2xl normal-case tracking-normal text-forest-700 sm:text-3xl">{labels.subheading}</span>
        </h2>
      </div>

      {/* ATTRACTION CARDS */}
      <ul className="grid-center-last grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {experiences.map((experience, index) => {
          const hasLink = Boolean(experience.detailUrl?.trim());
          const hasDescription = Boolean(experience.description?.trim());

          return (
            <li key={experience._id || index} className="dest-card flex min-w-0 flex-col overflow-hidden rounded-lg bg-white shadow-card" {...reveal3d(index)}>
              {/* IMAGE */}
              <CmsImage
                media={experience.image}
                alt={experience.image?.alt || experience.title}
                placeholderName={experience.title}
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 400px"
                wrapperClassName="aspect-[16/10]"
                depth
              />

              <div className="flex flex-1 flex-col p-5">
                <h3 className="break-words font-display text-xl text-ink">{experience.title}</h3>

                {/* WITH A LINK: short text + "Read more" link to the attraction page */}
                {hasLink && (
                  <>
                    {hasDescription && <p className="mt-3 line-clamp-2 break-words text-sm leading-7 text-muted">{experience.description}</p>}
                    <CmsLink href={experience.detailUrl!} ariaLabel={`${labels.readMore}: ${experience.title}`} className={readMoreLinkClass}>
                      {labels.readMore}
                      <ArrowUpRight aria-hidden className="h-4 w-4 rtl:-scale-x-100" />
                    </CmsLink>
                  </>
                )}

                {/* WITHOUT A LINK: the text opens in place */}
                {!hasLink && hasDescription && (
                  <ExpandableText text={experience.description!} more={labels.readMore} less={labels.readLess} title={experience.title} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
