import { useId } from "react";

/**
 * Two gold jingle bells tied together under a red ribbon bow with holly, gently swinging
 * (CSS .bell-swing in globals.css). Decorative only.
 */
export function ChristmasBells() {
  const goldId = useId();
  return (
    <span aria-hidden="true" className="pointer-events-none ms-1 flex shrink-0 self-start sm:ms-2">
      <svg className="bell-swing block h-auto w-[30px] sm:w-[46px]" viewBox="0 0 46 52">
        <defs>
          <linearGradient id={goldId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#f7d774" />
            <stop offset="0.55" stopColor="#d4a537" />
            <stop offset="1" stopColor="#9a7420" />
          </linearGradient>
        </defs>

        {/* left bell, tilted out */}
        <g transform="rotate(22 23 14)">
          <Bell goldId={goldId} />
        </g>
        {/* right bell, tilted the other way */}
        <g transform="rotate(-22 23 14)">
          <Bell goldId={goldId} />
        </g>

        {/* holly leaves and berries behind the bow */}
        <path d="M23 12 q-9 -6 -15 -2 q4 1 3 4 q4 -2 5 2 q3 -3 7 -4z" fill="#1d6b3a" />
        <path d="M23 12 q9 -6 15 -2 q-4 1 -3 4 q-4 -2 -5 2 q-3 -3 -7 -4z" fill="#15803d" />
        <circle cx="20.5" cy="7.5" r="2" fill="#b91c1c" />
        <circle cx="25.5" cy="7.5" r="2" fill="#dc2626" />

        {/* red ribbon bow */}
        <path d="M23 12 c-5 -6 -12 -5 -11 0 c1 4 7 3 11 0z" fill="#c81e1e" stroke="#7f1d1d" strokeWidth="0.8" />
        <path d="M23 12 c5 -6 12 -5 11 0 c-1 4 -7 3 -11 0z" fill="#c81e1e" stroke="#7f1d1d" strokeWidth="0.8" />
        <path d="M22 13 l-5 9 l3 -1 l1 3 l2 -10z" fill="#b91c1c" />
        <path d="M24 13 l5 9 l-3 -1 l-1 3 l-2 -10z" fill="#991b1b" />
        <circle cx="23" cy="12" r="2.6" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.8" />
      </svg>
    </span>
  );
}

/** One bell hanging straight down from the knot at (23, 14). */
function Bell({ goldId }: { goldId: string }) {
  return (
    <>
      <path
        d="M23 15 c-6 0 -8 5 -8 11 v6 l-3.5 5 h23 l-3.5 -5 v-6 c0 -6 -2 -11 -8 -11z"
        fill={`url(#${goldId})`}
        stroke="#8a661b"
        strokeWidth="0.9"
      />
      <path d="M12.5 36 h21" stroke="#8a661b" strokeWidth="1.4" />
      <path d="M18 20 q1.5 -2.5 4 -3" stroke="#fff6c8" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <circle cx="23" cy="39.5" r="2.6" fill="#8a661b" />
    </>
  );
}
