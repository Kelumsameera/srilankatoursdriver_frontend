import type { Destination } from "@/types/cms";
import { Section } from "@/components/ui/misc";
import { DestinationCard } from "@/components/cards/cards";
import { PaperEdge } from "./home/Decor";
import { FoliageCluster } from "./home/Foliage";
import { reveal3d } from "@/lib/reveal";
import { Heading, sectionData, sectionTheme, type SectionProps } from "./sectionParts";

// "destinations" section: framed destination cards on a green band
export function DestinationsSection({ section, ctx }: SectionProps) {
  const { theme, light } = sectionTheme(section);
  const destinations = sectionData<Destination>(section);
  if (!destinations.length) return null;

  // Design: "Popular Destinations" is a forest-green band between torn-paper edges.
  return (
    // Keep decorative foliage inside the green band and clear of neighbouring content.
    <Section theme={light ? theme : "forest"} className="relative isolate overflow-hidden pb-28 md:pb-20 md:[&>.container-page]:px-[clamp(6rem,10vw,9rem)]">
      <PaperEdge flip className="text-sand-50" />
      <FoliageCluster inset side="left" className="bottom-8 md:bottom-auto md:top-[38%]" />
      <FoliageCluster inset side="right" className="bottom-8 md:bottom-[15%]" />
      <Heading section={section} light ctx={ctx} />

      {/* DESTINATION CARDS */}
      <div className="relative z-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {destinations.map((destination, index) => (
          <div key={destination._id} {...reveal3d(index, 4)}>
            <DestinationCard destination={destination} framed />
          </div>
        ))}
      </div>
      <PaperEdge className="text-sand-50" />
    </Section>
  );
}
