import { getLocale, getTranslations } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import type { TripAdvisorSummary } from "@/types/cms";
import { Section, SectionHeading } from "@/components/ui/misc";
import { TripAdvisorBubbles, TripAdvisorMark } from "@/components/ui/TripAdvisorBubbles";
import { formatDate } from "@/lib/utils";
import { SocialIcons } from "@/components/ui/icons";
import { sectionTheme, type SectionProps } from "./sectionParts";
import { TRIPADVISOR_PROFILE_URL } from "./TripAdvisorWriteReview";

// "tripadvisor" section: the TripAdvisor rating, up to 3 reviews and a link to the profile
// TripAdvisor display rules: logo next to the content, its own bubbles, quoted text with date and a link back
export async function TripAdvisorSection({ section, ctx }: SectionProps) {
  const { theme } = sectionTheme(section);
  const tripAdvisor = section.data as TripAdvisorSummary | null;
  const profile = tripAdvisor?.webUrl || ctx.settings?.tripadvisor?.profileUrl || ctx.settings?.social?.tripadvisor || TRIPADVISOR_PROFILE_URL;
  const enabled = ctx.settings?.tripadvisor?.enabled !== false;
  // Switched off in settings: no section at all (the profile link always has something to show)
  if (!enabled) return null;
  const tReviews = await getTranslations("reviews");
  const locale = await getLocale();

  return (
    <Section theme={theme}>
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 rounded-[2rem] border border-sand-200 bg-surface p-8 text-center shadow-card sm:p-12">
        {/* LOGO + HEADING */}
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#34e0a1]/15 text-[#00aa6c]">
          <SocialIcons.tripadvisor className="h-9 w-9" />
        </span>
        <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} />

        {/* RATING: live from TripAdvisor, else the text typed in settings */}
        {tripAdvisor?.rating ? (
          <div className="-mt-6 flex flex-col items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5">
              <TripAdvisorMark className="text-sm" />
              <TripAdvisorBubbles rating={tripAdvisor.rating} />
            </span>
            <p className="text-small text-muted">
              {tripAdvisor.rating.toFixed(1)} / 5 · {tReviews("basedOn", { count: tripAdvisor.numReviews ?? 0 })}
            </p>
          </div>
        ) : ctx.settings?.tripadvisor?.ratingText ? (
          <p className="-mt-6 text-small text-muted">{ctx.settings.tripadvisor.ratingText}</p>
        ) : null}

        {/* LATEST REVIEWS */}
        {tripAdvisor?.reviews?.length ? (
          <ul className="grid w-full gap-4 text-start md:grid-cols-3">
            {tripAdvisor.reviews.slice(0, 3).map((review) => (
              <li key={review.id} className="flex flex-col rounded-2xl bg-sand-50 p-5">
                <TripAdvisorBubbles rating={review.rating} />
                {review.title && <p className="mt-2 font-medium text-heading">“{review.title}”</p>}
                <p className="mt-1 line-clamp-4 flex-1 text-small text-muted">“{review.text}”</p>
                <p className="mt-3 text-xs text-muted">
                  — {[review.user?.username, review.publishedDate ? formatDate(review.publishedDate, locale, { month: "short", year: "numeric" }) : null].filter(Boolean).join(" · ")}
                </p>
                <a href={review.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-soft underline-offset-4 hover:underline">
                  {tReviews("travellerReview")} <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        {/* PROFILE LINK – the "Write a review" widget (<TripAdvisorWriteReview />) is switched off for now */}
        {profile && (
          <a href={profile} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-medium text-brand-soft underline-offset-4 hover:underline">
            {tReviews("readOnTripadvisor")} <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          </a>
        )}
      </div>
    </Section>
  );
}
