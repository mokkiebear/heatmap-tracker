import { LegendEntry } from "src/utils/report/legend";
import { EMPTY_CELL_COLOR } from "src/utils/report/heatmapHtml";
import {
  aggregateVisibility,
  mergeLegendWithDefaults,
  paletteEntriesInOrder,
} from "../legendEntries";

const entry = (
  color: string,
  label = "",
  extra: Partial<LegendEntry> = {},
): LegendEntry => ({ color, label, ...extra });
const colors = (entries: LegendEntry[]) => entries.map((e) => e.color);
const summaryHidden = { includeInSummary: false };

describe("mergeLegendWithDefaults", () => {
  const defaults = [
    entry("#c6e48b", "", summaryHidden),
    entry("#7bc96f"),
    entry(EMPTY_CELL_COLOR, "", summaryHidden),
  ];

  it("keeps an entry's customizations and appends the colors it lacks", () => {
    const workday = entry("#7BC96F ", "Workday", { valueOverride: 8 });

    expect(mergeLegendWithDefaults([workday], defaults)).toEqual([
      workday,
      defaults[0],
      defaults[2],
    ]);
  });

  it("drops an entry whose color is no longer in the defaults", () => {
    const merged = mergeLegendWithDefaults(
      [entry("#7bc96f", "Workday"), entry("#orphaned-color", "Stale")],
      defaults,
    );

    expect(colors(merged)).toEqual(["#7bc96f", "#c6e48b", EMPTY_CELL_COLOR]);
  });

  it("keeps the entries' own order, then adds new colors in the defaults' order", () => {
    // The user dragged blank first; a refresh must not reshuffle it.
    const merged = mergeLegendWithDefaults(
      [entry(EMPTY_CELL_COLOR, "Rest day"), entry("#7bc96f", "Workday")],
      [defaults[0], defaults[1], entry("#196127"), defaults[2]],
    );

    expect(colors(merged)).toEqual([
      EMPTY_CELL_COLOR,
      "#7bc96f",
      "#c6e48b",
      "#196127",
    ]);
  });

  it("returns complete entries unchanged, and the defaults for none", () => {
    const entries = [
      entry("#7bc96f", "Workday"),
      entry("#c6e48b", "Half day", summaryHidden),
      entry(EMPTY_CELL_COLOR, "Rest day"),
    ];

    expect(mergeLegendWithDefaults(entries, defaults)).toEqual(entries);
    expect(mergeLegendWithDefaults([], defaults)).toEqual(defaults);
  });
});

describe("paletteEntriesInOrder", () => {
  const colorsList = ["#c6e48b", "#7bc96f", "#196127"];

  it.each([
    ["in palette order", ["#196127", "#c6e48b", "#7bc96f"], colorsList],
    [
      "only, skipping palette colors with none",
      ["#c6e48b", "#f59e0b", EMPTY_CELL_COLOR],
      ["#c6e48b"],
    ],
    ["or nothing", ["#f59e0b"], []],
  ])("returns the palette's entries %s", (_, entryColors, expected) => {
    const entries = entryColors.map((color) => entry(color));

    expect(colors(paletteEntriesInOrder(entries, colorsList))).toEqual(
      expected,
    );
  });
});

describe("aggregateVisibility", () => {
  it.each([
    [
      "the shared visibility when all agree",
      [entry("#1", "", summaryHidden), entry("#2", "", summaryHidden)],
      "summaryHidden",
    ],
    [
      "shown when they disagree",
      [entry("#1"), entry("#2", "", summaryHidden)],
      "shown",
    ],
    ["shown for no entries", [], "shown"],
  ])("is %s", (_, entries, expected) => {
    expect(aggregateVisibility(entries)).toBe(expected);
  });
});
