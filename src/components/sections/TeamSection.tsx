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

// Compact, equal-sized profiles in the order configured in the CMS.
export function TeamSection({ section, ctx }: SectionProps) {
  const { theme, light } = sectionTheme(section);
  const people = (section.items ?? []).filter((person) => person.title);
  if (!people.length) return null;

  return (
    <Section theme={theme}>
      <Heading section={section} light={light} withAction={false} ctx={ctx} />
      <ul className="mx-auto grid max-w-5xl justify-center gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((person, index) => (
          <li key={`${person.title}-${index}`} className="mx-auto flex h-full w-full max-w-sm flex-col items-center rounded-3xl bg-surface p-6 text-center shadow-card">
            <TeamPhoto person={person} sizes="128px" className="relative mb-5 h-28 w-28 shrink-0 overflow-hidden rounded-full sm:h-32 sm:w-32" />
            {person.role && <p className="mb-2 text-xs font-semibold uppercase tracking-label text-gold-600">{person.role}</p>}
            <h3 className="text-xl leading-snug text-heading">{person.title}</h3>
            {person.description && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{person.description}</p>}
            {person.url && (
              <a href={person.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 min-w-11 items-center justify-center text-forest-600 hover:text-gold-600" aria-label={`${person.title} ? profile`}>
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
