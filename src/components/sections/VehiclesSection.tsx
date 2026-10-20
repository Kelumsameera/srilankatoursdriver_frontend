import { getTranslations } from "next-intl/server";
import { Snowflake } from "lucide-react";
import type { Vehicle } from "@/types/cms";
import { cn } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { VehicleCard } from "@/components/cards/VehicleCard";
import { Buttons, sectionData, sectionTheme, type SectionProps } from "./sectionParts";

// "vehicles" section: text and button beside a row of overlapping vehicle photos, then a few fleet facts
export async function VehiclesSection({ section, ctx }: SectionProps) {
  const { light } = sectionTheme(section);
  const vehicles = sectionData<Vehicle>(section);
  if (!vehicles.length) return null;
  const tCommon = await getTranslations("common");
  // Design: text and button beside a row of real vehicle photos, then a few facts taken from the fleet data.
  const shown = vehicles.filter((v) => v.images?.[0]?.url).slice(0, 3);
  // Only facts true for every vehicle shown (the section may list just part of the fleet, so no "up to" claims).
  const facts = vehicles.every((v) => v.airConditioning) ? [{ icon: Snowflake, label: tCommon("airConditioned") }] : [];

  return (
    <section className={cn("relative overflow-x-clip py-20 sm:py-24", light ? "bg-forest-900 text-white" : "bg-sand-100")}>
      <div className="container-page grid items-center gap-12 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]">
        {/* TEXT: eyebrow, title, subtitle, buttons */}
        <div>
          {section.eyebrow && <p className={cn("eyebrow mb-4", light && "text-gold-400")}>{section.eyebrow}</p>}
          {section.title && <h2 className={cn("text-4xl leading-tight sm:text-5xl", light ? "text-white" : "text-heading")}>{section.title}</h2>}
          {section.subtitle && <p className={cn("mt-5 max-w-md text-lead leading-relaxed", light ? "text-white/75" : "text-muted")}>{section.subtitle}</p>}
          <div className="mt-8">
            <Buttons section={section} ctx={ctx} light={light} />
          </div>
        </div>

        {/* VEHICLE PHOTOS (the middle one raised), or two cards when no vehicle has a photo */}
        {shown.length > 0 ? (
          <ul className="flex items-end justify-center">
            {shown.map((v, i) => (
              <li
                key={v._id}
                className={cn(
                  "relative min-w-0 flex-1",
                  i > 0 && "-ms-6 sm:-ms-10",
                  shown.length === 3 && i === 1 ? "z-10 -translate-y-3" : "z-0",
                )}
              >
                <CmsLink href={`/vehicles/${v.slug}`} className="group block">
                  <CmsImage
                    media={v.images![0]}
                    alt={v.images![0].alt || v.name}
                    sizes="(min-width: 1024px) 22vw, 33vw"
                    wrapperClassName="aspect-[5/4] rounded-2xl border-4 border-white shadow-card"
                    className="transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className={cn("mt-3 block truncate text-center text-small font-semibold", light ? "text-white" : "text-heading")}>{v.name}</span>
                </CmsLink>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-1 gap-grid sm:grid-cols-2">
            {vehicles.slice(0, 2).map((v) => (
              <VehicleCard key={v._id} vehicle={v} />
            ))}
          </div>
        )}
      </div>

      {/* FLEET FACTS */}
      {facts.length > 0 && (
        <ul className={cn("container-page mt-12 flex flex-wrap justify-center gap-x-10 gap-y-3 text-small lg:justify-end", light ? "text-white/80" : "text-brand")}>
          {facts.map(({ icon: Icon, label }) => (
            <li key={label} className={cn("flex items-center gap-2 rounded-full px-4 py-2 shadow-sm", light ? "bg-white/10" : "bg-surface/70")}>
              <Icon className={cn("h-5 w-5 shrink-0", light ? "text-gold-400" : "text-gold-600")} aria-hidden /> {label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
