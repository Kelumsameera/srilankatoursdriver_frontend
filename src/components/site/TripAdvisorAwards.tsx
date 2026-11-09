import { SocialIcons } from "@/components/ui/icons";
import type { TripAdvisorAward } from "@/types/cms";

/** Only explicitly recorded award years are displayed; the calendar never creates an award. */
export function TripAdvisorAwards({ awards }: { awards?: TripAdvisorAward[] }) {
  if (!awards?.length) return null;
  return (
    <ul aria-label="Tripadvisor awards" className="flex flex-wrap justify-center gap-4">
      {[...awards].sort((a, b) => b.year - a.year).map((award) => (
        <li key={`${award.year}-${award.name}`}>
          <a href={award.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-44 w-48 flex-col items-center justify-center rounded-3xl border border-[#00aa6c]/25 bg-[#f2fff8] px-5 py-6 text-center text-forest-950 shadow-sm transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest-800">
            <SocialIcons.tripadvisor className="mb-3 h-10 w-10" aria-hidden />
            <span className="text-xs font-semibold">Tripadvisor</span>
            <span className="mt-1 text-sm font-semibold">{award.name}</span>
            <span className="mt-2 font-display text-3xl">{award.year}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
