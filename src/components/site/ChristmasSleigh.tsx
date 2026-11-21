import type { CSSProperties } from "react";

/**
 * Shared Christmas sleigh drawing: the scroll fly-by (ChristmasScrollDecor) and the footer night sky.
 * Santa in a red and gold sleigh full of presents, pulled by three pairs of reindeer whose legs gallop
 * (CSS .xmas-leg-* in globals.css). Faces right; the caller positions and animates the whole team.
 */

export function SleighArt({ className, onAnimationEnd }: { className?: string; onAnimationEnd?: () => void }) {
  return (
    <svg className={className} viewBox="0 -20 440 140" onAnimationEnd={onAnimationEnd}>
      <defs>
        <linearGradient id="xmas-sleigh-red" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e23b3b" />
          <stop offset="1" stopColor="#8f1414" />
        </linearGradient>
        <linearGradient id="xmas-deer-coat" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#c47a3e" />
          <stop offset="1" stopColor="#8a4d22" />
        </linearGradient>
        <linearGradient id="xmas-deer-coat-far" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#a8652f" />
          <stop offset="1" stopColor="#6e3c19" />
        </linearGradient>
      </defs>

      {/* sparkle trail */}
      <g fill="#fde68a">
        <circle cx="4" cy="92" r="1.6" />
        <circle cx="14" cy="84" r="1.2" />
        <circle cx="24" cy="95" r="1.8" />
        <circle cx="34" cy="88" r="1" />
      </g>

      {/* far reindeer of each pair (behind, slightly higher and darker) */}
      <Reindeer x={170} y={18} far delay="-0.15s" />
      <Reindeer x={258} y={10} far delay="-0.35s" />
      <Reindeer x={346} y={2} far delay="-0.55s" />

      {/* reins from Santa's hands to every collar */}
      <path d="M118 62 Q160 50 222 46 M118 62 Q210 44 310 38 M118 62 Q260 36 398 30 M118 64 Q160 60 204 60 M118 64 Q200 54 292 52 M118 64 Q250 46 380 44" stroke="#7a5418" strokeWidth="1" fill="none" opacity="0.9" />

      {/* sleigh */}
      <g>
        {/* presents and sack */}
        <ellipse cx="44" cy="56" rx="16" ry="14" fill="#2f6b3a" />
        <path d="M36 44 q8 -8 16 0" stroke="#1d4526" strokeWidth="2" fill="none" />
        <rect x="26" y="36" width="14" height="12" fill="#1f8a4c" transform="rotate(-10 33 42)" />
        <rect x="31" y="36" width="3" height="12" fill="#facc15" transform="rotate(-10 33 42)" />
        <rect x="46" y="32" width="15" height="14" fill="#e0b03c" />
        <rect x="52" y="32" width="3" height="14" fill="#b91c1c" />
        <rect x="38" y="28" width="11" height="10" fill="#3b82f6" transform="rotate(8 43 33)" />

        {/* body with scrolled back */}
        <path d="M24 60 q-6 -18 8 -16 q4 2 2 10 L36 62 H112 q12 0 16 -12 q4 -6 8 -2 q-2 22 -22 28 H40 q-16 0 -16 -14z" fill="url(#xmas-sleigh-red)" stroke="#6b0f0f" strokeWidth="1.2" />
        <path d="M34 66 H120" stroke="#e0b03c" strokeWidth="2" />
        <path d="M44 72 q8 -6 16 0 q8 -6 16 0 q8 -6 16 0" stroke="#e0b03c" strokeWidth="1.4" fill="none" />
        {/* runners with curled front */}
        <path d="M40 78 v10 M104 78 v10" stroke="#c9a227" strokeWidth="2.5" />
        <path d="M22 90 H130 q14 0 14 -12 q0 -8 -7 -6" stroke="#c9a227" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Santa */}
        <path d="M80 62 q-2 -22 14 -24 q16 2 14 24z" fill="#c81e1e" />
        <path d="M80 62 h28" stroke="#fff" strokeWidth="3" />
        <path d="M94 40 v22" stroke="#fff" strokeWidth="2.5" />
        <rect x="80" y="54" width="28" height="3.5" fill="#1c1917" />
        <rect x="91" y="53.5" width="6" height="4.5" fill="#e0b03c" />
        {/* arm holding the reins */}
        <path d="M104 46 q10 6 14 16" stroke="#c81e1e" strokeWidth="6" strokeLinecap="round" fill="none" />
        <circle cx="118" cy="63" r="3.2" fill="#1c1917" />
        {/* head, beard, hat */}
        <circle cx="96" cy="30" r="7.5" fill="#f5cba7" />
        <path d="M88 31 q8 16 16 0 q-1 12 -8 14 q-7 -2 -8 -14z" fill="#fff" />
        <path d="M91 33 q5 2 10 0" stroke="#e5e7eb" strokeWidth="1.5" fill="none" />
        <circle cx="99" cy="28" r="1" fill="#1c1917" />
        <circle cx="102" cy="31" r="1.6" fill="#f0a08a" />
        <path d="M87 25 q4 -16 20 -10 q-4 2 -6 8z" fill="#c81e1e" />
        <path d="M87 25 q9 -4 16 -1" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <circle cx="85" cy="16" r="3" fill="#fff" />
      </g>

      {/* near reindeer of each pair */}
      <Reindeer x={152} y={32} delay="0s" />
      <Reindeer x={240} y={24} delay="-0.2s" />
      <Reindeer x={328} y={16} delay="-0.4s" />
    </svg>
  );
}

/**
 * One reindeer in mid gallop, about 80 x 75 units, facing right. Front and back legs swing in
 * opposite phase; `delay` staggers the team so they do not move in lockstep.
 */
function Reindeer({ x, y, far = false, delay }: { x: number; y: number; far?: boolean; delay: string }) {
  const coat = far ? "url(#xmas-deer-coat-far)" : "url(#xmas-deer-coat)";
  const dark = far ? "#4a2810" : "#5c3414";
  const antler = far ? "#7a5a3a" : "#9b7650";
  const legStyle = { animationDelay: delay };
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* far-side legs (behind the body) */}
      <Leg className="xmas-leg-back" style={legStyle} hipX={14} color={dark} />
      <Leg className="xmas-leg-front" style={legStyle} hipX={46} color={dark} />

      {/* body */}
      <path d="M6 44 q-2 -14 14 -16 h26 q14 0 16 12 q0 10 -12 12 h-30 q-12 0 -14 -8z" fill={coat} />
      {/* white tail and belly */}
      <path d="M6 38 q-8 -2 -8 -8 q6 2 9 4z" fill="#f5f0e6" />
      <path d="M16 52 q16 4 32 0" stroke="#e8dcc6" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* neck and head held high */}
      <path d="M48 34 q4 -18 14 -26 l8 4 q-6 10 -8 24z" fill={coat} />
      {/* white chest and throat */}
      <path d="M54 44 q4 -18 12 -30 l4 3 q-6 10 -6 26 q-4 4 -10 1z" fill="#f2ece0" />
      <ellipse cx="70" cy="9" rx="9" ry="5.5" fill={coat} transform="rotate(10 70 9)" />
      <ellipse cx="78" cy="12" rx="3.5" ry="3" fill={far ? "#7a4a26" : "#a8693a"} />
      <circle cx="80.5" cy="12.5" r="1.6" fill="#1c1917" />
      <circle cx="70" cy="7" r="1.1" fill="#1c1917" />
      <path d="M63 5 q-6 -2 -8 2 q4 1 8 0z" fill={dark} />
      {/* branching antlers */}
      <path
        d="M66 3 q-4 -10 -2 -20 M65 -6 q-6 -2 -8 -8 M65 -12 q4 -5 4 -10 M64 -16 q-4 -3 -4 -7 M70 3 q2 -10 8 -18 M73 -6 q6 -1 9 -6 M76 -12 q-1 -5 2 -9"
        stroke={antler}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* harness: collar with gold bells and a belly strap */}
      <path d="M50 30 q6 6 14 4" stroke="#3b2414" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <circle cx="54" cy="35" r="1.8" fill="#e0b03c" />
      <circle cx="59" cy="36" r="1.8" fill="#e0b03c" />
      <path d="M30 28 v24" stroke="#3b2414" strokeWidth="3" />
      <rect x="28" y="38" width="4" height="4" fill="#e0b03c" />

      {/* near-side legs (in front of the body) */}
      <Leg className="xmas-leg-front" style={{ animationDelay: `calc(${delay} - 0.12s)` }} hipX={52} color={coat} hoof={dark} />
      <Leg className="xmas-leg-back" style={{ animationDelay: `calc(${delay} - 0.12s)` }} hipX={20} color={coat} hoof={dark} />
    </g>
  );
}

/** Two-segment leg hanging from the hip at (hipX, 44); the CSS swing pivots it at the hip. */
function Leg({ className, style, hipX, color, hoof }: { className: string; style: CSSProperties; hipX: number; color: string; hoof?: string }) {
  return (
    <g className={className} style={style}>
      <path d={`M${hipX - 3} 42 L${hipX + 3} 42 L${hipX + 4} 56 L${hipX + 1} 68 L${hipX - 2} 68 L${hipX} 56Z`} fill={color} />
      <rect x={hipX - 2.5} y="67" width="4.5" height="3" rx="1" fill={hoof ?? color} />
    </g>
  );
}
