/**
 * Christmas night scene above the footer (on while Admin → Theme → snow animation is on):
 * stars, snowy hills, pine trees, a coconut palm wrapped in twinkling lights and Santa driving
 * a tuk-tuk full of presents, with a Merry Christmas greeting in the page language plus Sinhala, Tamil and English.
 * Animations live in globals.css ("Christmas" block).
 */

const GREETINGS: Record<string, string> = {
  en: "Merry Christmas from Sri Lanka!",
  si: "ශ්‍රී ලංකාවේ සිට සුබ නත්තලක් වේවා!",
  ta: "இலங்கையிலிருந்து இனிய கிறிஸ்துமஸ் வாழ்த்துக்கள்!",
  de: "Frohe Weihnachten aus Sri Lanka!",
  fr: "Joyeux Noël depuis le Sri Lanka !",
  es: "¡Feliz Navidad desde Sri Lanka!",
  it: "Buon Natale dallo Sri Lanka!",
  pt: "Feliz Natal do Sri Lanka!",
  ru: "С Рождеством из Шри-Ланки!",
  ja: "スリランカからメリークリスマス！",
  ko: "스리랑카에서 메리 크리스마스!",
  zh: "来自斯里兰卡的圣诞快乐！",
  ar: "عيد ميلاد مجيد من سريلانكا!",
  hi: "श्रीलंका से क्रिसमस की शुभकामनाएं!",
};

const STARS = [
  [60, 30], [180, 70], [260, 20], [390, 55], [520, 25], [640, 80], [760, 35], [880, 60], [1010, 22], [1120, 75], [1240, 40], [1380, 65],
];

export function ChristmasFooterScene({ locale }: { locale: string }) {
  const greeting = GREETINGS[locale] ?? GREETINGS.en;
  return (
    <div aria-hidden="true" className="xmas-scene relative isolate h-[220px] overflow-hidden bg-forest-950 sm:h-[260px]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice">
        {/* stars */}
        <g fill="#fff">
          {STARS.map(([x, y], i) => (
            <circle key={i} className="xmas-star" style={{ animationDelay: `${(i % 5) * -0.7}s` }} cx={x} cy={y} r={i % 3 === 0 ? 2 : 1.3} />
          ))}
        </g>
        <circle cx="1300" cy="50" r="22" fill="#fef3c7" opacity="0.9" />

        <defs>
          <linearGradient id="xmas-mtn-far" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#5b7490" />
            <stop offset="1" stopColor="#2c3e55" />
          </linearGradient>
          <linearGradient id="xmas-mtn-mid" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#47607a" />
            <stop offset="1" stopColor="#1f3044" />
          </linearGradient>
          <linearGradient id="xmas-snowcap" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.6" stopColor="#e8f1fa" />
            <stop offset="1" stopColor="#b9cde0" />
          </linearGradient>
          <linearGradient id="xmas-mist" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#c7d8ea" stopOpacity="0" />
            <stop offset="1" stopColor="#c7d8ea" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="xmas-drift" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.5" stopColor="#eef4fb" />
            <stop offset="1" stopColor="#c9d9ea" />
          </linearGradient>
          <linearGradient id="xmas-drift-shade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#a9bfd6" stopOpacity="0.55" />
            <stop offset="1" stopColor="#a9bfd6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* far mountain range: jagged peaks, snow caps lit from the moon (right) */}
        <path d="M0 175 L70 130 L110 148 L190 92 L250 135 L300 118 L380 160 L450 110 L520 70 L600 128 L660 112 L740 150 L820 98 L880 60 L960 120 L1030 104 L1100 140 L1170 88 L1230 112 L1300 76 L1370 120 L1440 105 V260 H0Z" fill="url(#xmas-mtn-far)" />
        <g fill="url(#xmas-snowcap)">
          <path d="M190 92 L218 111 L208 114 L200 108 L190 118 L180 110 L170 114Z" />
          <path d="M520 70 L556 98 L544 100 L534 93 L522 104 L512 95 L496 101 L506 89Z" />
          <path d="M880 60 L912 84 L900 88 L890 80 L878 92 L868 82 L852 88Z" />
          <path d="M1300 76 L1330 97 L1318 100 L1308 93 L1298 102 L1288 94 L1276 98Z" />
          <path d="M1170 88 L1192 104 L1182 107 L1172 100 L1160 108 L1150 103Z" />
        </g>
        {/* shadow faces on the left of each far peak */}
        <g fill="#1b2a3c" opacity="0.35">
          <path d="M190 92 L170 114 L130 140 L110 148Z" />
          <path d="M520 70 L496 101 L470 112 L450 110Z" />
          <path d="M880 60 L852 88 L830 100 L820 98Z" />
          <path d="M1300 76 L1276 98 L1240 110 L1230 112Z" />
        </g>

        {/* mid range */}
        <path d="M0 200 L90 160 L150 178 L240 138 L320 172 L420 150 L500 182 L610 140 L700 168 L790 132 L880 170 L990 146 L1080 178 L1180 142 L1270 170 L1360 150 L1440 168 V260 H0Z" fill="url(#xmas-mtn-mid)" />
        <g fill="url(#xmas-snowcap)">
          <path d="M240 138 L268 156 L256 158 L246 152 L236 160 L224 152 L214 155Z" />
          <path d="M610 140 L636 157 L624 160 L614 153 L604 161 L592 154 L584 156Z" />
          <path d="M790 132 L818 150 L806 153 L796 146 L786 155 L774 147 L764 149Z" />
          <path d="M1180 142 L1206 159 L1194 162 L1184 155 L1174 163 L1162 156 L1154 158Z" />
        </g>

        {/* valley mist */}
        <rect x="0" y="150" width="1440" height="70" fill="url(#xmas-mist)" />
        {/* pine trees */}
        {[120, 170, 1180, 1230, 1290].map((x, i) => (
          <g key={x} transform={`translate(${x} ${i % 2 ? 150 : 140}) scale(${i % 2 ? 0.8 : 1})`}>
            <rect x="-4" y="52" width="8" height="12" fill="#5c3a1a" />
            <path d="M0 0 L22 30 H10 L28 56 H-28 L-10 30 H-22Z" fill="#1f5f3a" />
            <path d="M-10 30 h20 M-16 46 h32" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
            <path d="M0 -6 l2 4 l4 1 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 l4 -1z" fill="#fcd34d" />
          </g>
        ))}

        {/* coconut palm with lights */}
        <g transform="translate(330 70)">
          <path d="M30 150 Q22 90 4 20" stroke="#7c5a35" strokeWidth="10" fill="none" strokeLinecap="round" />
          <g fill="#1f8a4c">
            <path d="M4 20 Q-40 0 -70 30 Q-35 12 4 24z" />
            <path d="M4 20 Q40 -10 80 15 Q40 5 4 24z" />
            <path d="M4 20 Q-20 -30 -50 -25 Q-15 -20 4 22z" />
            <path d="M4 20 Q30 -30 60 -20 Q25 -18 4 22z" />
            <path d="M4 20 Q10 40 -10 70 Q14 42 6 22z" />
          </g>
          <circle cx="0" cy="26" r="5" fill="#6b4a2a" />
          <circle cx="9" cy="27" r="5" fill="#6b4a2a" />
          {/* light string spiralling down the trunk */}
          <path d="M4 30 Q20 40 8 55 Q-2 70 16 82 Q28 96 18 110 Q12 124 28 138" stroke="#1c1917" strokeWidth="1.2" fill="none" />
          {[[12, 40], [6, 58], [10, 74], [22, 90], [18, 106], [20, 124], [27, 138]].map(([x, y], i) => (
            <circle key={i} className="xmas-bulb" style={{ animationDelay: `${i * -0.35}s` }} cx={x} cy={y} r="3.2" fill={["#ef4444", "#facc15", "#22c55e", "#3b82f6"][i % 4]} />
          ))}
        </g>

        {/* back snow drifts */}
        <path d="M0 212 C120 190 240 196 360 208 S600 186 760 204 S1040 188 1200 202 S1380 196 1440 192 V260 H0Z" fill="#dfe9f4" />
        {/* front snow drifts with soft blue shading in the hollows */}
        <path d="M0 226 C140 204 280 214 420 224 S680 202 860 220 S1160 206 1300 218 S1410 214 1440 210 V260 H0Z" fill="url(#xmas-drift)" />
        <path d="M0 236 C160 222 300 232 440 238 S700 224 880 236 S1180 226 1440 230 V260 H0Z" fill="url(#xmas-drift-shade)" />
        <path d="M120 214 C200 208 260 212 320 220 M700 210 C780 204 840 208 900 216 M1180 210 C1240 205 1290 208 1340 214" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9" />
        {/* snow sparkles */}
        <g fill="#ffffff">
          {[[90, 238], [260, 232], [470, 244], [610, 230], [790, 242], [980, 234], [1120, 246], [1290, 236], [1400, 242]].map(([x, y], i) => (
            <circle key={i} className="xmas-star" style={{ animationDelay: `${i * -0.45}s` }} cx={x} cy={y} r="1.3" />
          ))}
        </g>
      </svg>

      {/* Santa's tuk-tuk drives along the snowy road */}
      <svg className="xmas-tuktuk absolute bottom-3 left-0 w-[130px] sm:w-[160px]" viewBox="0 0 160 100">
        {/* presents on the roof */}
        <rect x="52" y="4" width="18" height="14" fill="#22c55e" />
        <rect x="59" y="4" width="4" height="14" fill="#facc15" />
        <rect x="72" y="0" width="16" height="18" fill="#3b82f6" />
        <rect x="72" y="7" width="16" height="4" fill="#fde68a" />
        {/* canopy */}
        <path d="M30 22 Q32 18 40 18 H120 Q130 18 132 28 L136 60 H30Z" fill="#1c1917" />
        {/* body */}
        <path d="M24 60 H140 Q150 60 150 70 V80 H18 V68 Q18 60 24 60z" fill="#b91c1c" />
        <path d="M120 30 L134 60 H120Z" fill="#7dd3fc" opacity="0.7" />
        <rect x="18" y="72" width="132" height="3" fill="#fbbf24" />
        {/* Santa in the driver's seat */}
        <circle cx="108" cy="52" r="10" fill="#c81e1e" />
        <circle cx="110" cy="38" r="7" fill="#f5cba7" />
        <path d="M103 40 q7 12 14 0 q-2 10 -7 11 q-5 -1 -7 -11z" fill="#fff" />
        <path d="M103 34 q7 -13 16 -4 l-16 4z" fill="#c81e1e" />
        <circle cx="120" cy="29" r="2.6" fill="#fff" />
        {/* headlight + wheels */}
        <circle cx="150" cy="66" r="3" fill="#fef08a" />
        <g className="xmas-wheel" style={{ transformOrigin: "40px 84px" }}>
          <circle cx="40" cy="84" r="10" fill="#1c1917" />
          <path d="M32 84 h16 M40 76 v16" stroke="#9ca3af" strokeWidth="2" />
        </g>
        <g className="xmas-wheel" style={{ transformOrigin: "128px 84px" }}>
          <circle cx="128" cy="84" r="10" fill="#1c1917" />
          <path d="M120 84 h16 M128 76 v16" stroke="#9ca3af" strokeWidth="2" />
        </g>
      </svg>

      {/* greeting */}
      <div className="relative flex h-full flex-col items-center justify-start px-4 pt-6 text-center sm:pt-8">
        <p className="font-display text-2xl text-gold-400 drop-shadow sm:text-4xl">{greeting}</p>
        <p className="mt-2 text-xs tracking-wide text-white/70 sm:text-sm">සුබ නත්තලක් · இனிய கிறிஸ்துமஸ் · Merry Christmas</p>
      </div>
    </div>
  );
}
