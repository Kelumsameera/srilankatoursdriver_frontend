import { getTranslations } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import type { TripAdvisorSummary } from "@/types/cms";
import { Section, SectionHeading, Stars } from "@/components/ui/misc";
import { SocialIcons } from "@/components/ui/icons";
import { sectionTheme, type SectionProps } from "./sectionParts";

// "tripadvisor" section: the TripAdvisor rating, up to 3 reviews and a link to the profile
export async function TripAdvisorSection({ section, ctx }: SectionProps) {
  const { theme } = sectionTheme(section);
  const tripAdvisor = section.data as TripAdvisorSummary | null;
  const profile = tripAdvisor?.webUrl || ctx.settings?.tripadvisor?.profileUrl || ctx.settings?.social?.tripadvisor;
  const enabled = ctx.settings?.tripadvisor?.enabled !== false;
  // Switched off in settings, or nothing to show: no section at all
  if (!enabled || (!profile && !tripAdvisor?.reviews?.length)) return null;
  const tReviews = await getTranslations("reviews");

  return (
    <Section theme={theme}>
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 rounded-[2rem] border border-sand-200 bg-white p-8 text-center shadow-card sm:p-12">
        {/* LOGO + HEADING */}
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#34e0a1]/15 text-[#00aa6c]">
          <SocialIcons.tripadvisor className="h-9 w-9" />
        </span>
        <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} />

        {/* RATING: live from TripAdvisor, else the text typed in settings */}
        {tripAdvisor?.rating ? (
          <div className="-mt-6 flex flex-col items-center gap-2">
            <Stars rating={tripAdvisor.rating} className="[&_svg]:h-6 [&_svg]:w-6" />
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
              <li key={review.id} className="rounded-2xl bg-sand-50 p-5">
                <Stars rating={review.rating} />
                <p className="mt-2 font-medium text-forest-900">{review.title}</p>
                <p className="mt-1 line-clamp-4 text-small text-muted">{review.text}</p>
                {review.user?.username && <p className="mt-3 text-xs text-muted">— {review.user.username}</p>}
              </li>
            ))}
          </ul>
        ) : null}

        {/* PROFILE LINK */}
        {profile && (
          <a href={profile} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-medium text-forest-700 underline-offset-4 hover:underline">
            {tReviews("readOnTripadvisor")} <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          </a>
        )}
      </div>
    </Section>
  );
}
