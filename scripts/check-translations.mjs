import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { parse, TYPE } from "@formatjs/icu-messageformat-parser";
import { IntlMessageFormat } from "intl-messageformat";

const messagesDir = resolve("messages");
// Brands and words genuinely shared with English should not be forcibly retranslated.
const sharedNames = new Set(["WhatsApp", "Sri Lanka Tours Driver"]);
const sharedWords = {
  de: new Set(["optional", "Route", "Region", "in {name}", "Standard", "Boutique", "Name", "Van", "Bus", "Videos", "Video", "Van (USD)", "Bus (USD)"]),
  fr: new Set(["Destinations", "Questions", "Message", "Boutique", "via {platform}", "Photos", "Articles", "Destination", "Distance"]),
  es: new Set(["Boutique"]),
  it: new Set(["Email", "Boutique", "Video"]),
  pt: new Set(["Boutique", "Van", "via {platform}", "Van (USD)"]),
};
function flatten(value, prefix = "") {
  return Object.fromEntries(Object.entries(value).flatMap(([key, text]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    return text && typeof text === "object" ? Object.entries(flatten(text, name)) : [[name, text]];
  }));
}
function argumentsOf(nodes) {
  const args = new Set();
  for (const node of nodes) {
    if (node.type !== TYPE.literal && node.type !== TYPE.pound) args.add(`${node.type === TYPE.tag ? "tag:" : ""}${node.value}`);
    if (node.options) {
      // Target languages can use different plural categories, but must retain other.
      if (!node.options.other) throw new Error("Plural/select expression has no other branch");
      for (const option of Object.values(node.options)) for (const arg of argumentsOf(option.value)) args.add(arg);
    }
    if (node.children) for (const arg of argumentsOf(node.children)) args.add(arg);
  }
  return [...args].sort();
}
const english = flatten(JSON.parse(readFileSync(resolve(messagesDir, "en.json"), "utf8")));
function sampleValues(nodes, count) {
  const values = {};
  for (const node of nodes) {
    if (node.type === TYPE.argument) values[node.value] ??= "Sample";
    if (node.type === TYPE.number || node.type === TYPE.plural) values[node.value] = count;
    if (node.type === TYPE.date || node.type === TYPE.time) values[node.value] = new Date("2026-01-01T12:00:00Z");
    if (node.type === TYPE.select) values[node.value] = "other";
    if (node.type === TYPE.tag) values[node.value] = (chunks) => chunks;
    if (node.options) for (const option of Object.values(node.options)) Object.assign(values, sampleValues(option.value, count));
    if (node.children) Object.assign(values, sampleValues(node.children, count));
  }
  return values;
}
let errors = 0;
let checked = 0;
for (const file of readdirSync(messagesDir).filter((name) => name.endsWith(".json") && name !== "si.json")) {
  const translated = flatten(JSON.parse(readFileSync(resolve(messagesDir, file), "utf8")));
  let localeErrors = 0;
  for (const [key, source] of Object.entries(english)) {
    try {
      const target = translated[key];
      if (typeof target !== "string" || !target.trim()) throw new Error("Missing/empty translation");
      if (/\uFFFD|\?{3,}|ZXQ\d+QXZ/.test(target)) throw new Error("Corrupted text or unresolved placeholder");
      const locale = file.replace(/\.json$/, "");
      if (locale !== "en" && target === source && !sharedNames.has(source) && !sharedWords[locale]?.has(source)) {
        throw new Error("English text remains untranslated (review shared words if intentional)");
      }
      const sourceAst = parse(source);
      const targetAst = parse(target);
      const expected = argumentsOf(sourceAst);
      const actual = argumentsOf(targetAst);
      if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error(`Arguments differ: ${expected} vs ${actual}`);
      const formatter = new IntlMessageFormat(targetAst, file.replace(/\.json$/, ""));
      for (const count of [0, 1, 2]) formatter.format({ ...sampleValues(targetAst, count), ...sampleValues(sourceAst, count) });
      checked++;
    } catch (error) {
      console.error(`${file}: ${key}: ${error.message}`);
      localeErrors++;
    }
  }
  const extras = Object.keys(translated).filter((key) => !(key in english));
  if (extras.length) console.log(`${file}: ${extras.length} additional locale-specific keys retained`);
  console.log(`${file}: ${Object.keys(english).length - localeErrors}/${Object.keys(english).length} valid messages`);
  errors += localeErrors;
}
console.log(`Checked ${checked} messages; ${errors} errors.`);
process.exitCode = errors ? 1 : 0;
