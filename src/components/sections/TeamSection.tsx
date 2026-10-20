import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { Section } from "@/components/ui/misc";
import { Heading, sectionTheme, type SectionItem, type SectionProps } from "./sectionParts";

/** Team member photo, or their initials when no photo has been uploaded yet. */
function TeamPhoto({ person, className, sizes }: { person: SectionItem; className: string; sizes: string }) {
  if (person.image?.url) {
    return <CmsImage media={person.image} alt={person.image.alt || person.title || ""} sizes={sizes} wrapperClassName={className} />;
  }
  const initials = (person.title ?? "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
  return (
    <div className={cn(className, "flex items-center justify-center bg-forest-800 font-display text-4xl text-gold-400")} aria-hidden>
      {initials}
    </div>
  );
}

// "team" section: the owner first in a large card, then managers and the rest of the team
export function TeamSection({ section, ctx }: SectionProps) {
  const { theme, light } = sectionTheme(section);
  // Team members without a name are skipped. The first one is the owner.
  const people = (section.items ?? []).filter((p) => p.title);
  if (!people.length) return null;
  const [lead, ...rest] = people;

  return (
    <Section theme={theme}>
      <Heading section={section} light={light} withAction={false} ctx={ctx} />

      {/* LEAD CARD */}
      <article className="mx-auto grid grid-cols-1 max-w-5xl items-center gap-8 overflow-hidden rounded-[2rem] bg-surface shadow-card md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" data-testid="team-lead">
        <TeamPhoto person={lead} sizes="(min-width: 768px) 40vw, 100vw" className="relative aspect-[4/5] w-full md:h-full md:min-h-[24rem]" />
        <div className="p-8 md:p-10 md:ps-2">
          {lead.role && <p className="eyebrow mb-3">{lead.role}</p>}
          <h3 className="text-3xl text-heading sm:text-4xl">{lead.title}</h3>
          {lead.description && <p className="mt-5 whitespace-pre-line text-lead leading-relaxed text-muted">{lead.description}</p>}
          {lead.url && (
            <a href={lead.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 text-small font-semibold text-brand-soft hover:text-gold-600">
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden /> {lead.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
            </a>
          )}
        </div>
      </article>

      {/* REST OF THE TEAM */}
      {rest.length > 0 && (
        <ul className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p, i) => (
            <li key={`${p.title}-${i}`} className="group overflow-hidden rounded-3xl bg-surface text-center shadow-card">
              <TeamPhoto
                person={p}
                sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
                className="relative aspect-square w-full overflow-hidden [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-105"
              />
              <div className="p-6">
                <h3 className="text-h3 text-heading">{p.title}</h3>
                {p.role && <p className="mt-1 text-xs font-semibold uppercase tracking-label text-gold-600">{p.role}</p>}
                {p.description && <p className="mt-3 text-small leading-relaxed text-muted">{p.description}</p>}
                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 min-w-11 items-center justify-center text-forest-600 hover:text-gold-600" aria-label={`${p.title} – profile`}>
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
