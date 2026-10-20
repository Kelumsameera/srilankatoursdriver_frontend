export type Messages = { [key: string]: string | Messages };

/**
 * Applies Admin → Translations → UI texts overrides ({ "nav.tours": "…" }) to a messages tree.
 * Only keys that already exist as text are replaced, so an override can never break the message structure.
 */
export function applyOverrides(messages: Messages, overrides: Record<string, string> | null | undefined): Messages {
  if (!overrides) return messages;
  const out = structuredClone(messages);
  for (const [key, value] of Object.entries(overrides)) {
    const parts = key.split(".");
    let node: Messages | string | undefined = out;
    for (const part of parts.slice(0, -1)) node = typeof node === "object" ? node[part] : undefined;
    const last = parts[parts.length - 1];
    if (typeof node === "object" && typeof node[last] === "string" && value.trim()) node[last] = value;
  }
  return out;
}

/** Flattens a messages tree into { "nav.tours": "Tours", … } (used by the admin UI texts page). */
export function flattenMessages(messages: Messages, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(messages)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[key] = v;
    else Object.assign(out, flattenMessages(v, key));
  }
  return out;
}
