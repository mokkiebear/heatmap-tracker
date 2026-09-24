/**
 * The `aggregation` examples in
 * `EXAMPLE_VAULT/.../9. intensityConfig.md` must keep rendering real, differing
 * data — a doc example whose two heatmaps look identical demonstrates nothing,
 * and one naming a property the vault dropped renders empty.
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { buildEntriesFromDataview } from "src/utils/dataviewEntries";
import {
  fillEntriesWithIntensity,
  fillEntriesWithIntensityByDate,
} from "src/utils/intensity";
import { DEFAULT_TRACKER_DATA } from "src/constants/defaultTrackerData";
import { DEFAULT_SETTINGS } from "src/constants/defaultSettings";

const VAULT = join(__dirname, "../../../EXAMPLE_VAULT");
const NOTES_DIR = join(VAULT, "daily notes");
const DOC = join(
  VAULT,
  "Documentation with Examples/3. trackerData parameters/9. intensityConfig.md",
);

const colors = DEFAULT_SETTINGS.palettes.default;

/** Reads `key: value` frontmatter out of the vault's daily notes. */
function vaultPages() {
  return readdirSync(NOTES_DIR)
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.md$/.test(name))
    .map((name) => {
      const text = readFileSync(join(NOTES_DIR, name), "utf8");
      const front = text.split("---")[1] ?? "";
      const page: Record<string, unknown> = {
        file: { name: name.replace(/\.md$/, ""), path: `daily notes/${name}` },
      };

      for (const line of front.trim().split("\n")) {
        const [key, ...rest] = line.split(":");
        if (rest.length) page[key.trim()] = rest.join(":").trim();
      }

      return page;
    });
}

function fakeDataview(pages: Record<string, unknown>[]) {
  const wrap = (list: Record<string, unknown>[]) => ({
    where: (fn: (p: Record<string, unknown>) => boolean) =>
      wrap(list.filter(fn)),
    [Symbol.iterator]: () => list[Symbol.iterator](),
  });

  return { pages: () => wrap(pages) } as never;
}

/** The readings both `dataviewjs` blocks in the doc share. */
const docEntries = [
  { date: "2025-01-01", intensity: 8 },
  { date: "2025-01-01", intensity: 8 },
  { date: "2025-01-02", intensity: 2 },
  { date: "2025-01-02", intensity: 2 },
  { date: "2025-01-03", intensity: 8 },
  { date: "2025-01-04", intensity: 4 },
  { date: "2025-01-04", intensity: 4 },
];

describe("EXAMPLE_VAULT aggregation examples", () => {
  it("scores Jan 3 the way the doc's prose claims", () => {
    // Identical config except `aggregation` — if the two blocks differed on
    // the scale too, the example would prove nothing about averaging.
    const scale = {
      ...DEFAULT_TRACKER_DATA.intensityConfig,
      scaleStart: 1,
      scaleEnd: 10,
    };
    const summed = fillEntriesWithIntensity(docEntries, scale, colors);
    const averaged = fillEntriesWithIntensity(
      docEntries,
      { ...scale, aggregation: "average" },
      colors,
    );

    // Keys are day-of-year: Jan 1 is 1, Jan 3 is 3.
    // Summed, Jan 3's lone 8 ties with Jan 4, which was rated 4 twice.
    expect(summed[3].value).toBe(8);
    expect(summed[4].value).toBe(8);
    expect(summed[3].intensity).toBe(summed[4].intensity);

    // Averaged, Jan 3 matches Jan 1 (a genuine 8) and outranks Jan 4 (a 4).
    expect(averaged[3].value).toBe(8);
    expect(averaged[1].value).toBe(8);
    expect(averaged[4].value).toBe(4);
    expect(averaged[3].intensity).toBe(averaged[1].intensity);
    expect(averaged[3].intensity!).toBeGreaterThan(averaged[4].intensity!);
  });

  it("keeps the properties the heatmap-tracker block names", () => {
    const pages = vaultPages();
    const property = ["exercise", "learning"];

    expect(pages.length).toBeGreaterThan(50);
    for (const key of property) {
      expect(pages.filter((p) => p[key] !== undefined).length).toBeGreaterThan(
        50,
      );
    }

    // The multi-property example only demonstrates anything if some notes log
    // just one of the two — that partial day is what averaging rescues.
    const partial = pages.filter(
      (p) => p.exercise !== undefined && p.learning === undefined,
    );
    expect(partial.length).toBeGreaterThan(20);

    const averaged = buildEntriesFromDataview(fakeDataview(pages), {
      property,
      aggregation: "average",
    });
    expect(averaged.length).toBeGreaterThan(50);

    // The vault spans two years, so the day-of-year-keyed variant would
    // collapse them onto ~365 keys.
    const filled = fillEntriesWithIntensityByDate(
      averaged.map((e) => ({ date: e.date, intensity: e.intensity })),
      { ...DEFAULT_TRACKER_DATA.intensityConfig, aggregation: "average" },
      colors,
    );
    expect(Object.keys(filled).length).toBe(averaged.length);
  });

  it("spells aggregation correctly in both codeblock flavours", () => {
    const doc = readFileSync(DOC, "utf8");

    expect(doc).toContain('aggregation: "average"'); // dataviewjs
    expect(doc).toContain("aggregation: average"); // heatmap-tracker YAML
  });
});
