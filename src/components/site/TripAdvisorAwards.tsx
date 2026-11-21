import { Award } from "lucide-react";
import Image from "next/image";
import { SocialIcons } from "@/components/ui/icons";
import type { TripAdvisorAward } from "@/types/cms";

const BADGE_SIZES: Record<number, { width: number; height: number }> = {
  2024: { width: 600, height: 600 },
  2025: { width: 1830, height: 1930 },
  2026: { width: 1009, height: 1174 },
};

/** Only explicitly recorded award years are displayed; the calendar never creates an award. */
export function TripAdvisorAwards({
  awards,
  title,
  description,
  label,
}: {
  awards?: TripAdvisorAward[];
  title?: string;
  description?: string;
  label?: string;
}) {
  if (!awards?.length) return null;
  return (
    <div className="space-y-4 sm:space-y-5">
      {title && (
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-gold-100 text-gold-600">
            <Award className="h-4 w-4" aria-hidden />
          </span>
          <h2 className="font-display text-xl text-heading sm:text-2xl">{title}</h2>
          {description && <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{description}</p>}
        </div>
      )}
      <ul aria-label={label || "Tripadvisor awards"} className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {[...awards].sort((a, b) => a.year - b.year).map((award) => (
          <li key={`${award.year}-${award.name}`} className="w-[84px] sm:w-28">
            <a href={award.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Tripadvisor ${award.name} ${award.year}`} className="group flex h-full flex-col items-center rounded-2xl border border-sand-200 bg-surface p-1.5 text-center text-forest-950 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gold-300 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest-800 sm:p-2">
              <span className="flex h-20 w-full items-center justify-center overflow-hidden rounded-lg bg-white sm:h-28">
                {[2024, 2025, 2026].includes(award.year) && /travell?ers.? choice/i.test(award.name) ? (
                  <Image src={`/images/awards/tripadvisor-choice-${award.year}.png`} alt={`Tripadvisor ${award.name} Awards ${award.year}`} width={BADGE_SIZES[award.year].width} height={BADGE_SIZES[award.year].height} className="h-full w-full object-contain" unoptimized />
                ) : (
                  <span className="flex h-full w-full flex-col items-center justify-center bg-[#34e0a1] px-1 py-1">
                    <span className="text-[8px] font-bold sm:text-[10px]">Tripadvisor</span>
                    <span className="mt-0.5 text-[8px] sm:text-[10px]">{award.name}</span>
                    <SocialIcons.tripadvisor className="my-1 h-6 w-6 sm:h-8 sm:w-8" aria-hidden />
                    <span className="text-sm font-bold sm:text-base">{award.year}</span>
                  </span>
                )}
              </span>
              <span className="px-0.5 pt-1.5 text-[9px] leading-snug font-semibold text-forest-900 transition-colors group-hover:text-gold-700 sm:text-[11px]">
                {award.name} · {award.year}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
