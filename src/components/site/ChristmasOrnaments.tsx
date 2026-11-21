/**
 * Shiny Christmas balls hanging on ribbons from the top edge of the nav bar, over the top of the homepage hero.
 * Each sways gently (CSS .ornament-sway in globals.css). Decorative only: never catches clicks.
 * Positioned against the page, so it scrolls away with the hero.
 */

type Ornament = { left: string; length: number; size: number; color: [string, string, string]; delay: string; star?: boolean; hideOnPhone?: boolean };

const RED: [string, string, string] = ["#ff8a8a", "#d61f1f", "#7a0d0d"];
const GOLD: [string, string, string] = ["#fff1b0", "#e0b03c", "#8a6414"];
const GREEN: [string, string, string] = ["#8fe3a8", "#1f8a4c", "#0b3f22"];
const SILVER: [string, string, string] = ["#ffffff", "#c9d3dc", "#6b7a88"];

// Lengths start at the very top of the page, so they include the header height (64px, 80px from xl).
const ORNAMENTS: Ornament[] = [
  { left: "1%", length: 120, size: 44, color: RED, delay: "0s" },
  { left: "4.5%", length: 85, size: 30, color: GOLD, delay: "-0.8s", star: true },
  { left: "8%", length: 150, size: 38, color: GREEN, delay: "-1.6s", hideOnPhone: true },
  { left: "11.5%", length: 100, size: 26, color: SILVER, delay: "-2.2s", hideOnPhone: true },
  { left: "84%", length: 105, size: 28, color: SILVER, delay: "-0.4s", hideOnPhone: true },
  { left: "87.5%", length: 155, size: 40, color: RED, delay: "-1.2s", hideOnPhone: true },
  { left: "91%", length: 90, size: 30, color: GREEN, delay: "-2s", star: true },
  { left: "94.5%", length: 125, size: 46, color: GOLD, delay: "-2.8s" },
];

export function ChristmasOrnaments() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-50 h-[260px] overflow-hidden">
      {ORNAMENTS.map((o, i) => (
        <Ball key={i} index={i} {...o} />
      ))}
    </div>
  );
}

function Ball({ index, left, length, size, color, delay, star, hideOnPhone }: Ornament & { index: number }) {
  const id = `ornament-${index}`;
  const r = size / 2;
  const w = size + 4;
  const h = length + size + 10;
  const cx = w / 2;
  const cy = length + 8 + r;
  return (
    <svg
      className={`ornament-sway absolute top-0 ${hideOnPhone ? "hidden md:block" : "block"}`}
      style={{ left, animationDelay: delay, filter: "drop-shadow(0 4px 6px rgba(0,0,0,.25))" }}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
    >
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor={color[0]} />
          <stop offset="0.45" stopColor={color[1]} />
          <stop offset="1" stopColor={color[2]} />
        </radialGradient>
      </defs>
      {/* ribbon */}
      <line x1={cx} y1="0" x2={cx} y2={length + 2} stroke="#d4a537" strokeWidth="1.5" />
      {/* metal cap */}
      <rect x={cx - 4} y={length} width="8" height="7" rx="1.5" fill="#c9a227" stroke="#8a6414" strokeWidth="0.8" />
      <circle cx={cx} cy={length} r="2" fill="none" stroke="#8a6414" strokeWidth="1" />
      {star ? (
        // golden star ornament
        <path
          transform={`translate(${cx} ${cy}) scale(${r / 10})`}
          d="M0 -10 L2.9 -3.1 L9.5 -3.1 L4.2 1.2 L6.2 8.1 L0 4 L-6.2 8.1 L-4.2 1.2 L-9.5 -3.1 L-2.9 -3.1Z"
          fill={`url(#${id})`}
          stroke={color[2]}
          strokeWidth="0.6"
        />
      ) : (
        <>
          <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
          {/* glitter band */}
          <path d={`M${cx - r * 0.95} ${cy + 2} q${r * 0.95} ${r * 0.35} ${r * 1.9} 0`} stroke="#fff7d1" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="1 3" fill="none" />
          {/* shine */}
          <ellipse cx={cx - r * 0.35} cy={cy - r * 0.4} rx={r * 0.22} ry={r * 0.12} fill="#fff" fillOpacity="0.75" transform={`rotate(-35 ${cx - r * 0.35} ${cy - r * 0.4})`} />
        </>
      )}
    </svg>
  );
}
