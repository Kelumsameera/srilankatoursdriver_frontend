import { Clock, MapPin } from "lucide-react";
import type { Excursion } from "@/types/cms";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { Badge } from "@/components/ui/misc";
import { travelImageFor } from "@/lib/editorial-images";

// Excursion card: photo, category + duration badges, title (the whole card is a link), short text and place (rates are on the excursion page)
export function ExcursionCard({ excursion }: { excursion: Excursion }) {
  // A video can't be a card picture, so fall back to a matching editorial photo
  const cover = excursion.heroMedia?.url && excursion.heroMedia.resourceType !== "video"
    ? excursion.heroMedia
    : travelImageFor(`${excursion.slug} ${excursion.title} ${excursion.location ?? ""}`);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-surface shadow-card">
      {/* IMAGE */}
      <CmsImage
        media={cover}
        alt={cover.alt || excursion.title}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        wrapperClassName="aspect-[16/10]"
        depth
        className="transition-transform duration-700 group-hover:scale-105"
      />

      <div className="flex flex-1 flex-col p-6">
        {/* BADGES */}
        <div className="mb-3 flex flex-wrap gap-2">
          {excursion.category?.name && <Badge>{excursion.category.name}</Badge>}
          {excursion.duration && (
            <Badge className="bg-sand-100 text-earth-700">
              <Clock className="h-3 w-3" aria-hidden /> {excursion.duration}
            </Badge>
          )}
        </div>

        {/* TITLE: stretched link, the whole card opens the excursion */}
        <h3 className="text-xl leading-snug text-heading">
          <CmsLink href={`/excursions/${excursion.slug}`} className="after:absolute after:inset-0">
            {excursion.title}
          </CmsLink>
        </h3>
        {excursion.shortDescription && <p className="mt-2 line-clamp-2 text-sm text-muted">{excursion.shortDescription}</p>}

        {/* PLACE */}
        {excursion.location && (
          <div className="mt-auto flex items-center gap-1 pt-5 text-sm text-muted">
            <MapPin className="h-4 w-4 text-gold-600" aria-hidden /> {excursion.location}
          </div>
        )}
      </div>
    </article>
  );
}
