import { buildEntriesFromDataview } from "src/utils/dataviewEntries";
import { fillEntriesWithIntensity } from "src/utils/intensity";
import { DEFAULT_TRACKER_DATA } from "src/constants/defaultTrackerData";
import { DEFAULT_SETTINGS } from "src/constants/defaultSettings";
import { IntensityConfig } from "src/types";

const colors = DEFAULT_SETTINGS.palettes.default;

function config(overrides: Partial<IntensityConfig> = {}): IntensityConfig {
  return { ...DEFAULT_TRACKER_DATA.intensityConfig, ...overrides };
}

/** Minimal stand-in for the Dataview API: `pages()` returns a chainable list. */
function fakeDataview(pages: Record<string, unknown>[]) {
  function wrap(list: Record<string, unknown>[]) {
    return {
      where: (fn: (p: Record<string, unknown>) => boolean) =>
        wrap(list.filter(fn)),
      [Symbol.iterator]: () => list[Symbol.iterator](),
    };
  }

  return { pages: () => wrap(pages) } as never;
}

describe("intensityConfig.aggregation (#117)", () => {
  describe("several entries on the same day", () => {
    const entries = [
      { date: "2024-03-01", intensity: 6 },
      { date: "2024-03-01", intensity: 10 },
      { date: "2024-03-02", intensity: 6 },
    ];

    it("sums them by default", () => {
      const filled = fillEntriesWithIntensity(entries, config(), colors);

      expect(filled[61].value).toBe(16);
      expect(filled[62].value).toBe(6);
    });

    it('averages them when aggregation is "average"', () => {
      const filled = fillEntriesWithIntensity(
        entries,
        config({ aggregation: "average" }),
        colors,
      );

      expect(filled[61].value).toBe(8);
      // A single entry averages to itself, so a day with one reading is no
      // longer darker or lighter than the same reading on a two-entry day.
      expect(filled[62].value).toBe(6);
    });

    it("colors a lone 6 the same as an averaged 6", () => {
      const filled = fillEntriesWithIntensity(
        [
          { date: "2024-03-01", intensity: 6 },
          { date: "2024-03-01", intensity: 6 },
          { date: "2024-03-02", intensity: 6 },
        ],
        config({ aggregation: "average" }),
        colors,
      );

      expect(filled[61].intensity).toBe(filled[62].intensity);
    });
  });

  describe("several tracked properties on one page", () => {
    const pages = [
      {
        file: { name: "2024-03-01", path: "Daily/2024-03-01.md", tags: [] },
        "hunger-morning": 6,
        "hunger-evening": 10,
      },
      {
        // Evening never got filled in: the average is over what exists.
        file: { name: "2024-03-02", path: "Daily/2024-03-02.md", tags: [] },
        "hunger-morning": 6,
      },
    ];

    const property = ["hunger-morning", "hunger-evening"];

    it("sums them by default", () => {
      const entries = buildEntriesFromDataview(fakeDataview(pages), {
        property,
      });

      expect(entries.map((e) => e.intensity)).toEqual([16, 6]);
    });

    it('averages only the properties the page sets when aggregation is "average"', () => {
      const entries = buildEntriesFromDataview(fakeDataview(pages), {
        property,
        aggregation: "average",
      });

      // 8 = (6 + 10) / 2, and 6 — not 3 — for the day missing its evening entry.
      expect(entries.map((e) => e.intensity)).toEqual([8, 6]);
    });
  });
});
