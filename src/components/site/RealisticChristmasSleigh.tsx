/** Realistic cutout frames, animated inside an SVG viewport with native SVG timing. */
export function RealisticChristmasSleigh() {
  return (
    <svg
      viewBox="0 230 543 220"
      width="543"
      height="220"
      className="block h-auto w-full overflow-hidden"
      aria-hidden="true"
    >
      <image
        className="xmas-svg-team-motion"
        href="/images/christmas-sleigh-gallop.webp"
        width="2172"
        height="724"
        x="0"
        y="0"
      >
        <animate
          attributeName="x"
          values="0;-543;-1086;-1629;0"
          keyTimes="0;0.25;0.5;0.75;1"
          calcMode="discrete"
          dur="0.72s"
          repeatCount="indefinite"
        />
      </image>
      <image
        className="xmas-svg-team-still"
        href="/images/christmas-sleigh-gallop.webp"
        width="2172"
        height="724"
        x="0"
        y="0"
      />
    </svg>
  );
}
