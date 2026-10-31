import { ColorsList, Entry } from "src/types";
import { EMPTY_CELL_COLOR } from "src/utils/report/heatmapHtml";
import { buildRefreshBaseline } from "../exportLegendDefaults";

const colorsList: ColorsList = ["#c6e48b", "#7bc96f", "#239a3b", "#196127"];

/** Entries keyed by date, each drawn in the given color. */
function logged(days: Record<string, string>): Record<string, Entry> {
  return Object.fromEntries(
    Object.entries(days).map(([date, customColor]) => [
      date,
      { date, customColor },
    ]),
  );
}

const includeInSummary = (entries: ReturnType<typeof buildRefreshBaseline>) =>
  Object.fromEntries(entries.map((e) => [e.color, e.includeInSummary]));

describe("buildRefreshBaseline", () => {
  it("lists the palette in order, then the blank color, unlabeled and excluded when nothing is logged", () => {
    const entries = buildRefreshBaseline({}, colorsList);

    expect(entries.map((e) => e.color)).toEqual([
      ...colorsList,
      EMPTY_CELL_COLOR,
    ]);
    expect(entries.every((e) => e.label === "")).toBe(true);
    expect(entries.every((e) => e.includeInSummary === false)).toBe(true);
  });

  it("shows colors in use anywhere in the data, custom ones before the blank color, and excludes the rest", () => {
    // Months apart: a narrower export range would miss the January color.
    const entries = buildRefreshBaseline(
      logged({ "2026-01-05": "#d18616", "2026-07-13": "#7bc96f" }),
      colorsList,
    );
    const visibility = includeInSummary(entries);

    expect(entries.map((e) => e.color)).toEqual([
      ...colorsList,
      "#d18616",
      EMPTY_CELL_COLOR,
    ]);
    expect(visibility["#d18616"]).toBeUndefined();
    expect(visibility["#7bc96f"]).toBeUndefined();
    expect(visibility["#196127"]).toBe(false);
  });

  it("shows the blank color only when the logged span has gap days", () => {
    const noGap = buildRefreshBaseline(
      logged({ "2026-07-13": "#7bc96f" }),
      colorsList,
    );
    const withGap = buildRefreshBaseline(
      logged({ "2026-07-13": "#7bc96f", "2026-07-15": "#7bc96f" }),
      colorsList,
    );

    expect(includeInSummary(noGap)[EMPTY_CELL_COLOR]).toBe(false);
    expect(includeInSummary(withGap)[EMPTY_CELL_COLOR]).toBeUndefined();
  });
});
