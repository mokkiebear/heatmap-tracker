import { LegendEntry } from "src/utils/report/legend";
import { EMPTY_CELL_COLOR } from "src/utils/report/heatmapHtml";
import {
  aggregateVisibility,
  mergeLegendWithDefaults,
  paletteEntriesInOrder,
  reorderLegendEntries,
} from "../LegendModal";

describe("mergeLegendWithDefaults", () => {
  const defaults: LegendEntry[] = [
    { color: "#c6e48b", label: "", includeInSummary: false },
    { color: "#7bc96f", label: "" },
    { color: EMPTY_CELL_COLOR, label: "", includeInSummary: false },
  ];

  it("preserves an existing entry's customizations for a color still in defaults", () => {
    const entries: LegendEntry[] = [
      { color: "#7bc96f", label: "Workday", valueOverride: 8 },
    ];
    const merged = mergeLegendWithDefaults(entries, defaults);

    expect(merged.find((e) => e.color === "#7bc96f")).toEqual({
      color: "#7bc96f",
      label: "Workday",
      valueOverride: 8,
    });
  });

  it("appends the fresh default for a color not yet present, without touching existing entries", () => {
    const entries: LegendEntry[] = [{ color: "#7bc96f", label: "Workday" }];
    const merged = mergeLegendWithDefaults(entries, defaults);

    expect(merged.find((e) => e.color === "#c6e48b")).toEqual(defaults[0]);
    expect(merged.find((e) => e.color === "#7bc96f")).toEqual({
      color: "#7bc96f",
      label: "Workday",
    });
  });

  it("drops an entry whose color no longer appears in the current defaults", () => {
    const entries: LegendEntry[] = [
      { color: "#7bc96f", label: "Workday" },
      { color: "#orphaned-color", label: "Stale" },
    ];
    const merged = mergeLegendWithDefaults(entries, defaults);

    expect(merged.some((e) => e.color === "#orphaned-color")).toBe(false);
    expect(merged).toHaveLength(defaults.length);
  });

  it("preserves the existing entries' own relative order instead of resetting to the defaults' order", () => {
    // The user drag-reordered so blank comes first - refreshing must not
    // silently reshuffle that back to palette order.
    const entries: LegendEntry[] = [
      { color: EMPTY_CELL_COLOR, label: "Rest day" },
      { color: "#7bc96f", label: "Workday" },
    ];
    const merged = mergeLegendWithDefaults(entries, defaults);

    expect(merged.map((e) => e.color)).toEqual([
      EMPTY_CELL_COLOR,
      "#7bc96f",
      "#c6e48b",
    ]);
  });

  it("appends brand-new colors in the defaults' own order, after all preserved entries", () => {
    const entries: LegendEntry[] = [
      { color: EMPTY_CELL_COLOR, label: "Rest day" },
    ];
    const biggerDefaults: LegendEntry[] = [
      { color: "#c6e48b", label: "" },
      { color: "#7bc96f", label: "" },
      { color: "#196127", label: "" },
      { color: EMPTY_CELL_COLOR, label: "" },
    ];
    const merged = mergeLegendWithDefaults(entries, biggerDefaults);

    expect(merged.map((e) => e.color)).toEqual([
      EMPTY_CELL_COLOR,
      "#c6e48b",
      "#7bc96f",
      "#196127",
    ]);
  });

  it("is a no-op when nothing has changed (idempotent)", () => {
    const entries: LegendEntry[] = [
      { color: "#7bc96f", label: "Workday" },
      { color: "#c6e48b", label: "Half day", includeInSummary: false },
      { color: EMPTY_CELL_COLOR, label: "Rest day" },
    ];
    expect(mergeLegendWithDefaults(entries, defaults)).toEqual(entries);
  });

  it("returns exactly the defaults, in order, when starting from empty (first-time population)", () => {
    expect(mergeLegendWithDefaults([], defaults)).toEqual(defaults);
  });
});

describe("paletteEntriesInOrder", () => {
  const colorsList = ["#c6e48b", "#7bc96f", "#196127"];

  it("returns entries matching a palette color, in the palette's own order, ignoring the entries' own order", () => {
    const entries: LegendEntry[] = [
      { color: "#196127", label: "Dark" },
      { color: "#c6e48b", label: "Light" },
      { color: "#7bc96f", label: "Medium" },
    ];

    expect(
      paletteEntriesInOrder(entries, colorsList).map((e) => e.color),
    ).toEqual(["#c6e48b", "#7bc96f", "#196127"]);
  });

  it("excludes a matched color that isn't in the palette (e.g. a custom per-day color, or blank)", () => {
    const entries: LegendEntry[] = [
      { color: "#c6e48b", label: "Light" },
      { color: "#f59e0b", label: "Rest day work" },
      { color: EMPTY_CELL_COLOR, label: "" },
    ];

    expect(
      paletteEntriesInOrder(entries, colorsList).map((e) => e.color),
    ).toEqual(["#c6e48b"]);
  });

  it("skips a palette color with no matching entry, rather than inserting a placeholder", () => {
    const entries: LegendEntry[] = [{ color: "#c6e48b", label: "Light" }];

    expect(
      paletteEntriesInOrder(entries, colorsList).map((e) => e.color),
    ).toEqual(["#c6e48b"]);
  });

  it("returns an empty array when nothing matches the palette", () => {
    expect(
      paletteEntriesInOrder(
        [{ color: "#f59e0b", label: "Rest day work" }],
        colorsList,
      ),
    ).toEqual([]);
  });
});

describe("aggregateVisibility", () => {
  it("returns the shared visibility when every entry agrees", () => {
    const entries: LegendEntry[] = [
      { color: "#c6e48b", label: "", includeInSummary: false },
      { color: "#7bc96f", label: "", includeInSummary: false },
    ];
    expect(aggregateVisibility(entries)).toBe("summaryHidden");
  });

  it("defaults to 'shown' when entries disagree, as a neutral starting point", () => {
    const entries: LegendEntry[] = [
      { color: "#c6e48b", label: "" },
      { color: "#7bc96f", label: "", includeInSummary: false },
    ];
    expect(aggregateVisibility(entries)).toBe("shown");
  });

  it("returns 'shown' for an empty list", () => {
    expect(aggregateVisibility([])).toBe("shown");
  });
});

describe("reorderLegendEntries", () => {
  const workday: LegendEntry = { color: "#196127", label: "Workday" };
  const leave: LegendEntry = { color: "#8b95a5", label: "Leave" };
  const restWork: LegendEntry = { color: "#f59e0b", label: "Rest day work" };
  const blank: LegendEntry = { color: EMPTY_CELL_COLOR, label: "" };

  it("moves a single dragged entry to sit immediately before the target", () => {
    const entries = [workday, leave, restWork, blank];
    const reordered = reorderLegendEntries(entries, [blank], [leave]);

    expect(reordered).toEqual([workday, blank, leave, restWork]);
  });

  it("moves an entire block together, preserving the block's own internal order", () => {
    // Simulates dragging the gradient group row (a multi-entry block) to sit
    // before an independent entry - block members are workday/blank, in
    // this.entries' own relative order, not recomputed to any other order.
    const entries = [leave, workday, blank, restWork];
    const block = [workday, blank];
    const reordered = reorderLegendEntries(entries, block, [leave]);

    expect(reordered).toEqual([workday, blank, leave, restWork]);
  });

  it("is a no-op when the dragged entry is dropped onto itself", () => {
    const entries = [workday, leave, restWork];
    expect(reorderLegendEntries(entries, [leave], [leave])).toBe(entries);
  });

  it("is a no-op when the drop target overlaps the dragged block at all", () => {
    const entries = [workday, leave, restWork, blank];
    const block = [workday, leave];
    expect(reorderLegendEntries(entries, block, [leave, restWork])).toBe(
      entries,
    );
  });

  it("appends at the end when the target isn't found in the remaining entries", () => {
    const entries = [workday, leave];
    const strayTarget: LegendEntry = { color: "#000000", label: "Not present" };
    expect(reorderLegendEntries(entries, [workday], [strayTarget])).toEqual([
      leave,
      workday,
    ]);
  });
});
