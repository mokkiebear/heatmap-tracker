import { ColorsList, Entry } from "src/types";
import { ReportModel } from "src/utils/report/reportModel";
import { EMPTY_CELL_COLOR } from "src/utils/report/heatmapHtml";
import { buildDefaultLegendEntries, buildRefreshBaseline } from "../ExportView";

const colorsList: ColorsList = ["#c6e48b", "#7bc96f", "#239a3b", "#196127"];

function modelWithDays(
  startDate: string,
  endDate: string,
  dayColors: string[],
): ReportModel {
  return {
    startDate,
    endDate,
    weeks: [
      {
        weekStart: startDate,
        days: dayColors.map((color, i) => ({
          date: `2026-07-${String(13 + i).padStart(2, "0")}`,
          weekday: 1,
          color,
        })),
      },
    ],
    summary: { totalDays: dayColors.length, totalValue: 0, activeWeeks: 1 },
  };
}

describe("buildDefaultLegendEntries", () => {
  it("returns one entry per palette color, in order, plus the blank color last", () => {
    const entries = buildDefaultLegendEntries(null, colorsList);

    expect(entries.map((e) => e.color)).toEqual([
      ...colorsList,
      EMPTY_CELL_COLOR,
    ]);
    expect(entries.every((e) => e.label === "")).toBe(true);
  });

  it("defaults a color actually used in the range to shown (includeInSummary undefined)", () => {
    const model = modelWithDays("2026-07-13", "2026-07-13", ["#7bc96f"]);
    const entries = buildDefaultLegendEntries(model, colorsList);

    const used = entries.find((e) => e.color === "#7bc96f");
    expect(used?.includeInSummary).toBeUndefined();
  });

  it("defaults a color not used in the range to hidden (includeInSummary: false)", () => {
    const model = modelWithDays("2026-07-13", "2026-07-13", ["#7bc96f"]);
    const entries = buildDefaultLegendEntries(model, colorsList);

    const unused = entries.find((e) => e.color === "#196127");
    expect(unused?.includeInSummary).toBe(false);
  });

  it("defaults the blank color to hidden when the range has no gap days", () => {
    // 1 logged day, 1-day range -> no gaps.
    const model = modelWithDays("2026-07-13", "2026-07-13", ["#7bc96f"]);
    const entries = buildDefaultLegendEntries(model, colorsList);

    expect(
      entries.find((e) => e.color === EMPTY_CELL_COLOR)?.includeInSummary,
    ).toBe(false);
  });

  it("defaults the blank color to shown when the range has at least one gap day", () => {
    // 1 logged day, 3-day range -> 2 gap days.
    const model = modelWithDays("2026-07-13", "2026-07-15", ["#7bc96f"]);
    const entries = buildDefaultLegendEntries(model, colorsList);

    expect(
      entries.find((e) => e.color === EMPTY_CELL_COLOR)?.includeInSummary,
    ).toBeUndefined();
  });

  it("appends a used custom color that isn't in the palette, before the blank color", () => {
    const model = modelWithDays("2026-07-13", "2026-07-13", ["#d18616"]);
    const entries = buildDefaultLegendEntries(model, colorsList);

    const colors = entries.map((e) => e.color);
    expect(colors).toEqual([...colorsList, "#d18616", EMPTY_CELL_COLOR]);
    expect(
      entries.find((e) => e.color === "#d18616")?.includeInSummary,
    ).toBeUndefined();
  });

  it("hides everything by default when there is no model (nothing logged, no range)", () => {
    const entries = buildDefaultLegendEntries(null, colorsList);
    expect(entries.every((e) => e.includeInSummary === false)).toBe(true);
  });
});

describe("buildRefreshBaseline", () => {
  it("includes a custom color used anywhere in entriesByDate, not just within any one narrower range", () => {
    // Far apart dates - the point is that a color from months ago still
    // counts as "used somewhere in the whole calendar", exactly the case
    // that a narrower export date-range picker would miss.
    const entriesByDate: Record<string, Entry> = {
      "2026-01-05": { date: "2026-01-05", intensity: 1 },
      "2026-07-13": { date: "2026-07-13", customColor: "#d18616" },
    };

    const baseline = buildRefreshBaseline(entriesByDate, colorsList);

    expect(baseline.map((e) => e.color)).toEqual([
      ...colorsList,
      "#d18616",
      EMPTY_CELL_COLOR,
    ]);
    expect(
      baseline.find((e) => e.color === "#d18616")?.includeInSummary,
    ).toBeUndefined();
  });

  it("falls back to the plain (all-hidden) defaults when there's no data at all", () => {
    expect(buildRefreshBaseline({}, colorsList)).toEqual(
      buildDefaultLegendEntries(null, colorsList),
    );
  });
});
