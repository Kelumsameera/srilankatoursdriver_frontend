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
    <div className="space-y-6">
      {title && (
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gold-100 text-gold-600">
            <Award className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="font-display text-2xl text-heading sm:text-3xl">{title}</h2>
          {description && <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{description}</p>}
        </div>
      )}
      <ul aria-label={label || "Tripadvisor awards"} className="flex flex-wrap justify-center gap-4 sm:gap-5">
        {[...awards].sort((a, b) => a.year - b.year).map((award) => (
          <li key={`${award.year}-${award.name}`} className="w-32 sm:w-40">
            <a href={award.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Tripadvisor ${award.name} ${award.year}`} className="group flex h-full flex-col items-center rounded-2xl border border-sand-200 bg-surface p-2 text-center text-forest-950 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gold-300 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest-800 sm:p-3">
              <span className="flex w-full flex-1 items-center justify-center overflow-hidden rounded-2xl bg-white">
                {[2024, 2025, 2026].includes(award.year) && /travell?ers.? choice/i.test(award.name) ? (
                  <Image src={`/images/awards/tripadvisor-choice-${award.year}.png`} alt={`Tripadvisor ${award.name} Awards ${award.year}`} width={BADGE_SIZES[award.year].width} height={BADGE_SIZES[award.year].height} className="h-auto w-full" unoptimized />
                ) : (
                  <span className="flex min-h-40 w-full flex-col items-center justify-center bg-[#34e0a1] px-3 py-5">
                    <span className="text-xs font-bold">Tripadvisor</span>
                    <span className="mt-1 text-sm">{award.name}</span>
                    <SocialIcons.tripadvisor className="my-3 h-12 w-12" aria-hidden />
                    <span className="text-xl font-bold">{award.year}</span>
                  </span>
                )}
              </span>
              <span className="px-1 pt-2 text-xs font-semibold text-forest-900 transition-colors group-hover:text-gold-700 sm:text-sm">
                {award.name} · {award.year}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
