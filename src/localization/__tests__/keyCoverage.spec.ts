import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import i18n from "src/localization/i18n";

const SKIP_DIRS = new Set(["__tests__", "localization", "test-utils"]);

function sourceFiles(dir: string): string[] {
  const result: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        result.push(...sourceFiles(join(dir, entry.name)));
      }
    } else if (/\.tsx?$/.test(entry.name)) {
      result.push(join(dir, entry.name));
    }
  }

  return result;
}

/**
 * Every `t("...")` / `i18n.t("...")` call site in `src`, with the literal key.
 * Guards the whole translation surface at once: the flat-vs-nested key bug in
 * `support.*` shipped because no test asserted that real call sites resolve.
 */
function collectKeys(): { key: string; file: string }[] {
  const found: { key: string; file: string }[] = [];

  for (const file of sourceFiles("src")) {
    const source = readFileSync(file, "utf8");
    // Only literal single-argument keys: template-literal keys
    // (`monthsShort.${...}`) are covered by the views' own tests.
    for (const match of source.matchAll(/\bt\(\s*"([^"]+)"/g)) {
      found.push({ key: match[1], file });
    }
  }

  return found;
}

describe("translation keys used in src", () => {
  const keys = collectKeys();

  it("finds call sites at all (the regex still matches the codebase)", () => {
    expect(keys.length).toBeGreaterThan(30);
  });

  it.each([...new Set(keys.map((k) => k.key))])(
    "resolves %s to a real string",
    (key) => {
      // A key that resolves to nothing is echoed back verbatim — exactly what
      // the settings tab rendered as "support.header".
      expect(i18n.t(key)).not.toBe(key);
    },
  );
});
