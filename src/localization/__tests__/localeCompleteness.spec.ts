/**
 * Locale completeness.
 *
 * `i18n.t` falls back to English for a missing key, so a locale that drifts
 * behind `en.json` renders a half-English UI and nothing fails — the drift is
 * only visible to someone who reads that language. This turns it into a test
 * failure at the moment the key is added.
 *
 * `keyCoverage.spec.ts` checks the other direction: that keys used in `src`
 * resolve at all. That one passes on English alone; this one does not.
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

import languages from "src/localization/languages.json";

const LOCALES_DIR = join(__dirname, "../locales");

type Tree = { [key: string]: string | Tree };

function load(code: string): Tree {
  return JSON.parse(readFileSync(join(LOCALES_DIR, `${code}.json`), "utf8"));
}

/** Dotted paths of every leaf string, so nesting differences are visible. */
function flatten(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? flatten(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

/** Dotted path → string, so two locales can be compared value by value. */
function leaves(tree: Tree, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tree).flatMap(([key, value]) =>
      typeof value === "object" && value !== null
        ? Object.entries(leaves(value, `${prefix}${key}.`))
        : [[`${prefix}${key}`, value as string]],
    ),
  );
}

const english = flatten(load("en"));
const others = Object.keys(languages).filter((code) => code !== "en");

describe("locale files", () => {
  it("ships a JSON file for every advertised language", () => {
    const files = readdirSync(LOCALES_DIR)
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.replace(/\.json$/, ""))
      .sort();

    // languages.json populates the settings dropdown: offering a language with
    // no resource file selects it and renders everything in English.
    expect(files).toEqual([...Object.keys(languages)].sort());
  });

  it.each(others)("%s has no key that English lacks", (code) => {
    // An extra key is dead weight at best and a renamed-in-en key at worst.
    expect(flatten(load(code)).filter((key) => !english.includes(key))).toEqual(
      [],
    );
  });

  it.each(others)("%s translates every English key", (code) => {
    const keys = flatten(load(code));

    // Every locale is complete and stays that way: adding a key to en.json is
    // expected to fail this until each language has it. `i18n.t` falls back to
    // English, so without this a half-translated UI ships silently — visible
    // only to someone who reads that language.
    expect(english.filter((key) => !keys.includes(key))).toEqual([]);
  });

  it.each(others)("%s keeps every {{placeholder}} intact", (code) => {
    const translated = leaves(load(code));
    const placeholders = (text: string) =>
      (text.match(/\{\{\w+\}\}/g) ?? []).sort();

    // interpolate() substitutes by name: a dropped or renamed placeholder
    // reaches the user as literal "{{value}}" instead of their number.
    const broken = Object.entries(leaves(load("en")))
      .filter(
        ([key, source]) =>
          key in translated &&
          placeholders(source).join() !== placeholders(translated[key]).join(),
      )
      .map(([key]) => key);

    expect(broken).toEqual([]);
  });
});
