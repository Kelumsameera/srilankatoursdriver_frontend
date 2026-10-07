import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { locales } from "@/i18n/routing";

type Tree = { [k: string]: string | Tree };
const load = (l: string) => JSON.parse(fs.readFileSync(path.resolve(__dirname, `../messages/${l}.json`), "utf8")) as Tree;

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return typeof v === "string" ? { ...acc, [key]: v } : { ...acc, ...flatten(v, key) };
  }, {});
}

const placeholders = (s: string) => Array.from(s.matchAll(/\{(\w+)[,}]/g), (m) => m[1]).sort();

describe("UI translations", () => {
  const en = flatten(load("en"));

  it.each(locales.filter((l) => l !== "en"))("%s has every key from en.json and no extras", (locale) => {
    const other = flatten(load(locale));
    expect(Object.keys(other).sort()).toEqual(Object.keys(en).sort());
  });

  it.each(locales.filter((l) => l !== "en"))("%s keeps the same ICU placeholders and has no empty strings", (locale) => {
    const other = flatten(load(locale));
    for (const [key, value] of Object.entries(en)) {
      expect(other[key].trim().length, key).toBeGreaterThan(0);
      expect(placeholders(other[key]), `${locale}:${key}`).toEqual(placeholders(value));
    }
  });
});
