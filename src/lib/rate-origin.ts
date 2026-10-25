// Finds the Admin → Rates table whose starting point is this excursion's place.
// "Habarana (Sigiriya)" matches the Sigiriya excursion, "Airport (CMB)" matches Colombo Airport.

const norm = (text: string) => text.toLowerCase().replace(/[^a-z]/g, "");
const words = (text: string) => text.toLowerCase().split(/[^a-z]+/).filter(Boolean);

// "Habarana (Sigiriya)" -> ["habaranasigiriya", "habarana", "sigiriya"]
function originNames(origin: string) {
  const base = origin.replace(/\(.*?\)/g, "");
  const inside = origin.match(/\((.*?)\)/)?.[1] ?? "";
  return [origin, base, inside].map(norm).filter(Boolean);
}

export function findRateTable<T extends { origin: string }>(tables: T[], excursion: { slug: string; title: string; location?: string }) {
  const names = [excursion.title, excursion.location ?? "", excursion.slug].map(norm).filter(Boolean);

  // 1. Same name: "Kandy" -> Kandy, "Sigiriya" -> Habarana (Sigiriya)
  const exact = tables.find((tbl) => originNames(tbl.origin).some((name) => names.includes(name)));
  if (exact) return exact;

  // 2. Shared words: "Colombo Airport" -> Airport (CMB). On a tie the longer, more specific name wins.
  const excursionWords = new Set([excursion.title, excursion.location ?? "", excursion.slug].flatMap(words));
  let best: T | undefined;
  let bestScore = 0;
  for (const tbl of tables) {
    const score = words(tbl.origin).filter((word) => excursionWords.has(word)).length;
    if (score > bestScore || (score === bestScore && score > 0 && best && tbl.origin.length > best.origin.length)) {
      best = tbl;
      bestScore = score;
    }
  }
  return best;
}
