import { cn } from "@/lib/utils";
import { SocialIcons } from "@/components/ui/icons";

// TripAdvisor's display rules: its own green bubbles (never our gold stars), #00AA6C, #84E9BD in dark mode
export function TripAdvisorBubbles({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[#00aa6c] dark:text-[#84e9bd]", className)} role="img" aria-label={`${rating} / 5 TripAdvisor`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rating >= i ? "100%" : rating >= i - 0.5 ? "50%" : "0%";
        return (
          <span
            key={i}
            aria-hidden
            className="h-3.5 w-3.5 rounded-full border-2 border-current"
            style={{ background: `linear-gradient(90deg, currentColor ${fill}, transparent ${fill})` }}
          />
        );
      })}
    </span>
  );
}

/** Owl + wordmark, shown next to every piece of TripAdvisor content. */
export function TripAdvisorMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold text-heading", className)}>
      <SocialIcons.tripadvisor className="h-5 w-5 shrink-0" aria-hidden />
      Tripadvisor
    </span>
  );
}
