import { getTranslations } from "next-intl/server";
import type { SiteSettings } from "@/types/cms";
import { CmsImage } from "@/components/ui/CmsImage";
import { reveal3d } from "@/lib/reveal";

/**
 * "Our team" block (Admin → Our Team): member cards, then group photos.
 * Renders nothing when switched off or when there is nothing to show.
 */
export async function TeamShowcase({ team }: { team: SiteSettings["team"] }) {
  const members = (team?.members ?? []).filter((m) => m.name && m.enabled !== false);
  const images = (team?.images ?? []).filter((img) => img?.url);
  if (!team || team.enabled === false || (members.length === 0 && images.length === 0)) return null;
  const t = await getTranslations("about");

  return (
    <section className="bg-surface py-20 sm:py-28" aria-labelledby="team-heading" data-testid="team-section">
      <div className="container-page">
        <div className="mx-auto mb-12 max-w-2xl text-center" data-scroll-reveal>
          <p className="eyebrow mb-3">{t("teamLabel")}</p>
          <h2 id="team-heading" className="text-3xl text-heading sm:text-4xl">
            {team.title || t("teamTitle")}
          </h2>
          <div className="mx-auto mt-4 h-0.5 w-14 rounded-full bg-gold-500" aria-hidden />
          {team.subtitle && <p className="mt-5 text-lg leading-relaxed text-muted">{team.subtitle}</p>}
        </div>

        {members.length > 0 && (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m, i) => (
              <li key={m._id ?? `${m.name}-${i}`} {...reveal3d(i)} className="overflow-hidden rounded-[2rem] border border-sand-200 bg-sand-50 shadow-sm transition-shadow hover:shadow-card">
                <CmsImage
                  depth
                  media={m.photo ?? undefined}
                  alt={m.photo?.alt || m.name}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  wrapperClassName="aspect-[4/5]"
                  objectPosition="top"
                  fallbackLabel={m.name}
                />
                <div className="p-6">
                  <h3 className="text-xl text-heading">{m.name}</h3>
                  {m.role && <p className="mt-1 text-sm font-bold uppercase tracking-[0.12em] text-gold-600">{m.role}</p>}
                  {m.bio && <p className="mt-3 text-sm leading-relaxed text-muted">{m.bio}</p>}
                  {m.languages && m.languages.length > 0 && (
                    <p className="mt-4 text-xs text-muted">
                      <span className="font-semibold text-ink">{t("teamLanguages")}:</span> {m.languages.join(", ")}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {images.length > 0 && (
          <ul className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 ${members.length > 0 ? "mt-12" : ""}`}>
            {images.map((img, i) => (
              <li key={img.publicId ?? img.url ?? i} {...reveal3d(i)} className={i === 0 && images.length > 2 ? "col-span-2 row-span-2" : ""}>
                <CmsImage media={img} alt={img.alt || team.title || t("teamTitle")} sizes="(min-width: 1024px) 33vw, 50vw" wrapperClassName="aspect-square h-full rounded-2xl" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
