import Image from "next/image";
import { SocialIcons } from "@/components/ui/icons";
import type { TripAdvisorAward } from "@/types/cms";

/** Only explicitly recorded award years are displayed; the calendar never creates an award. */
export function TripAdvisorAwards({ awards }: { awards?: TripAdvisorAward[] }) {
  if (!awards?.length) return null;
  return (
    <ul aria-label="Tripadvisor awards" className="flex flex-wrap justify-center gap-4">
      {[...awards].sort((a, b) => a.year - b.year).map((award) => (
        <li key={`${award.year}-${award.name}`}>
          <a href={award.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Tripadvisor ${award.name} ${award.year}`} className="flex w-28 flex-col items-center justify-center overflow-hidden text-center text-forest-950 transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest-800 sm:w-36">
            {[2024, 2025, 2026].includes(award.year) && /travell?ers.? choice/i.test(award.name) ? (
              <Image src={`/images/awards/tripadvisor-choice-${award.year}.png`} alt={`Tripadvisor ${award.name} Awards ${award.year}`} width={320} height={360} className="h-auto w-full" unoptimized />
            ) : (
              <span className="flex min-h-40 w-full flex-col items-center justify-center bg-[#34e0a1] px-3 py-5">
                <span className="text-xs font-bold">Tripadvisor</span>
                <span className="mt-1 text-sm">{award.name}</span>
                <SocialIcons.tripadvisor className="my-3 h-12 w-12" aria-hidden />
                <span className="text-xl font-bold">{award.year}</span>
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}
