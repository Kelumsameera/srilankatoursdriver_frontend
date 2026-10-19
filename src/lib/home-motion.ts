/** Bounded offsets keep every layer inside its reserved overscan. */
export function parallaxOffset(top: number, height: number, viewport: number, strength: number) {
  if (![top, height, viewport, strength].every(Number.isFinite) || viewport <= 0 || height < 0) return 0;
  const progress = (viewport / 2 - top - height / 2) / (viewport + height);
  return Math.max(-1, Math.min(1, progress)) * Math.max(-60, Math.min(60, strength));
}

export function pointerTilt(x: number, y: number, rect: { left: number; top: number; width: number; height: number }) {
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
  const horizontal = Math.max(-1, Math.min(1, ((x - rect.left) / rect.width - 0.5) * 2));
  const vertical = Math.max(-1, Math.min(1, ((y - rect.top) / rect.height - 0.5) * 2));
  return { x: -vertical * 4, y: horizontal * 4 };
}
