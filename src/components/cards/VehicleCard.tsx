import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Briefcase, Snowflake, Users } from "lucide-react";
import type { Vehicle } from "@/types/cms";
import { formatPrice } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { Badge } from "@/components/ui/misc";

// Vehicle card: photo with a type pill, name (the whole card is a link), spec row, then the daily rate
export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const tCommon = useTranslations("common");
  const tVehicle = useTranslations("vehicle");
  const locale = useLocale();
  const rate = formatPrice(vehicle.dailyRate, vehicle.currency, locale);
  // Only the specs this vehicle has (seats, bags, air conditioning)
  const specs = [
    vehicle.seats ? { icon: Users, label: tCommon("seats", { count: vehicle.seats }) } : null,
    vehicle.luggageCapacity ? { icon: Briefcase, label: tCommon("bags", { count: vehicle.luggageCapacity }) } : null,
    vehicle.airConditioning ? { icon: Snowflake, label: tCommon("airConditioned") } : null,
  ].filter(Boolean) as { icon: typeof Users; label: string }[];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-transform duration-500 hover:-translate-y-1">
      {/* IMAGE + TYPE / AVAILABILITY PILLS */}
      <div className="relative">
        <CmsImage
          media={vehicle.images?.[0]}
          alt={vehicle.images?.[0]?.alt || vehicle.name}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          wrapperClassName="aspect-[4/3] bg-sand-100"
          className="transition-transform duration-700 group-hover:scale-105"
        />
        {vehicle.type && (
          <span className="absolute start-4 top-4 rounded-full bg-forest-950/80 px-3 py-1 text-caption font-bold uppercase tracking-label text-white/90 backdrop-blur">
            {vehicle.type}
          </span>
        )}
        {vehicle.availability && vehicle.availability !== "available" && (
          <Badge className="absolute end-4 top-4 bg-gold-100 text-earth-700">{tVehicle(vehicle.availability)}</Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* NAME */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl leading-snug text-forest-900">
            {/* Stretched link: the whole card opens the vehicle overview. */}
            <CmsLink href={`/vehicles/${vehicle.slug}`} className="after:absolute after:inset-0 focus:outline-none">
              {vehicle.name}
            </CmsLink>
          </h3>
          <span
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-800 text-white transition-colors group-hover:bg-gold-500 group-hover:text-forest-950"
            aria-hidden
          >
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </span>
        </div>

        {/* SPECS */}
        {specs.length > 0 && (
          <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
            {specs.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-gold-600" aria-hidden /> {label}
              </li>
            ))}
          </ul>
        )}

        {/* DAILY RATE */}
        <div className="mt-auto border-t border-sand-100 pt-4">
          {rate ? (
            <p className="text-sm text-muted">
              {tCommon("from")} <span className="text-lg font-semibold text-gold-600">{rate}</span> {tVehicle("perDay")}
            </p>
          ) : (
            <p className="text-sm font-medium text-forest-700">{tCommon("priceOnRequest")}</p>
          )}
        </div>
      </div>
    </article>
  );
}
