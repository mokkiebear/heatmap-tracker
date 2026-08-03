import { ReportDay, ReportModel } from "../reportModel";
import {
  DayTypeCount,
  buildGradientLegendHtml,
  buildLegendHtml,
  buildSummaryModel,
  computeDayTypeCounts,
  getLegendVisibility,
  nextLegendVisibility,
  setLegendVisibility,
  LegendEntry,
} from "../legend";
import { EMPTY_CELL_COLOR } from "../heatmapHtml";

function day(overrides: Partial<ReportDay> & { date: string }): ReportDay {
  return { weekday: 1, ...overrides };
}

function countFor(counts: DayTypeCount[], color: string): number | undefined {
  return counts.find((c) => c.entry.color === color)?.count;
}

describe("computeDayTypeCounts", () => {
  const legend: LegendEntry[] = [
    { color: "#196127", label: "Workday" },
    { color: "#8b949e", label: "Leave" },
  ];

  it("counts days matching each legend color", () => {
    const days = [
      day({ date: "2026-07-13", color: "#196127" }),
      day({ date: "2026-07-14", color: "#196127" }),
      day({ date: "2026-07-15", color: "#8b949e" }),
    ];

    const { counts, otherCount } = computeDayTypeCounts(days, legend);

    expect(countFor(counts, "#196127")).toBe(2);
    expect(countFor(counts, "#8b949e")).toBe(1);
    expect(otherCount).toBe(0);
  });

  it("returns one {entry, count} pair per input entry, in input order", () => {
    const { counts } = computeDayTypeCounts([], legend);

    expect(counts).toHaveLength(2);
    expect(counts[0].entry).toBe(legend[0]);
    expect(counts[1].entry).toBe(legend[1]);
  });

  it("keeps separate counts for entries that share the same (blank) label", () => {
    // Auto-populated, not-yet-customized entries all start with a blank
    // label — counting by label instead of by color/entry would collide
    // these into a single bucket instead of tracking each color separately.
    const unlabeledLegend: LegendEntry[] = [
      { color: "#196127", label: "" },
      { color: "#8b949e", label: "" },
    ];
    const days = [
      day({ date: "2026-07-13", color: "#196127" }),
      day({ date: "2026-07-14", color: "#196127" }),
      day({ date: "2026-07-15", color: "#8b949e" }),
    ];

    const { counts } = computeDayTypeCounts(days, unlabeledLegend);

    expect(countFor(counts, "#196127")).toBe(2);
    expect(countFor(counts, "#8b949e")).toBe(1);
  });

  it("matches case-insensitively and ignores surrounding whitespace", () => {
    const days = [
      day({ date: "2026-07-13", color: " #196127 ".trim().toUpperCase() }),
    ];
    const { counts, otherCount } = computeDayTypeCounts(days, legend);

    expect(countFor(counts, "#196127")).toBe(1);
    expect(otherCount).toBe(0);
  });

  it("buckets unmatched colors and undefined colors into otherCount", () => {
    const days = [
      day({ date: "2026-07-13", color: "#d18616" }),
      day({ date: "2026-07-14", color: undefined }),
    ];

    const { counts, otherCount } = computeDayTypeCounts(days, legend);

    expect(countFor(counts, "#196127")).toBe(0);
    expect(countFor(counts, "#8b949e")).toBe(0);
    expect(otherCount).toBe(2);
  });

  it("buckets everything as other when the legend is empty", () => {
    const days = [day({ date: "2026-07-13", color: "#196127" })];
    const { counts, otherCount } = computeDayTypeCounts(days, []);

    expect(counts).toEqual([]);
    expect(otherCount).toBe(1);
  });

  it("counts unlogged (blank) days against the legend entry using EMPTY_CELL_COLOR", () => {
    const days = [day({ date: "2026-07-13", color: "#196127" })];
    const legendWithBlank: LegendEntry[] = [
      { color: "#196127", label: "Workday" },
      { color: EMPTY_CELL_COLOR, label: "Rest day" },
    ];

    const { counts } = computeDayTypeCounts(days, legendWithBlank, 5);

    expect(countFor(counts, "#196127")).toBe(1);
    expect(countFor(counts, EMPTY_CELL_COLOR)).toBe(4);
  });

  it("does not add a blank count when totalDaysInRange is omitted", () => {
    const days = [day({ date: "2026-07-13", color: "#196127" })];
    const legendWithBlank: LegendEntry[] = [
      { color: EMPTY_CELL_COLOR, label: "Rest day" },
    ];

    const { counts } = computeDayTypeCounts(days, legendWithBlank);

    expect(countFor(counts, EMPTY_CELL_COLOR)).toBe(0);
  });
});

describe("buildLegendHtml", () => {
  it("returns an empty string for an empty legend", () => {
    expect(buildLegendHtml([])).toBe("");
  });

  it("renders a swatch + escaped label per entry", () => {
    const html = buildLegendHtml([
      { color: "#196127", label: "<b>Workday</b>" },
    ]);

    expect(html).toContain("background-color:#196127");
    expect(html).toContain("&lt;b&gt;Workday&lt;/b&gt;");
    expect(html).not.toContain("<b>Workday</b>");
  });

  it("skips an entry with no label instead of rendering a blank swatch", () => {
    const html = buildLegendHtml([
      { color: "#196127", label: "Workday" },
      { color: "#8b949e", label: "", includeInSummary: false },
    ]);

    expect(html).toContain("background-color:#196127");
    expect(html).not.toContain("background-color:#8b949e");
  });

  it("returns an empty string when every entry is unlabeled", () => {
    expect(
      buildLegendHtml([
        { color: "#8b949e", label: "", includeInSummary: false },
      ]),
    ).toBe("");
  });

  it("skips an entry hidden entirely (includeInLegend: false), even with a label", () => {
    const html = buildLegendHtml([
      { color: "#196127", label: "Workday" },
      { color: "#8b949e", label: "Leave", includeInLegend: false },
    ]);

    expect(html).toContain("background-color:#196127");
    expect(html).not.toContain("background-color:#8b949e");
    expect(html).not.toContain(">Leave<");
  });
});

describe("legend visibility state machine", () => {
  it("defaults to shown for a plain entry", () => {
    expect(getLegendVisibility({ color: "#196127", label: "Workday" })).toBe(
      "shown",
    );
  });

  it("reads summaryHidden from includeInSummary: false alone", () => {
    expect(
      getLegendVisibility({
        color: "#196127",
        label: "Workday",
        includeInSummary: false,
      }),
    ).toBe("summaryHidden");
  });

  it("reads hidden from includeInLegend: false, regardless of includeInSummary", () => {
    expect(
      getLegendVisibility({
        color: "#196127",
        label: "Workday",
        includeInLegend: false,
        includeInSummary: false,
      }),
    ).toBe("hidden");
  });

  it("cycles shown -> summaryHidden -> hidden -> shown", () => {
    expect(nextLegendVisibility("shown")).toBe("summaryHidden");
    expect(nextLegendVisibility("summaryHidden")).toBe("hidden");
    expect(nextLegendVisibility("hidden")).toBe("shown");
  });

  it("setLegendVisibility('hidden') implies includeInSummary: false too", () => {
    const entry: LegendEntry = { color: "#196127", label: "Workday" };
    setLegendVisibility(entry, "hidden");

    expect(entry.includeInLegend).toBe(false);
    expect(entry.includeInSummary).toBe(false);
  });

  it("setLegendVisibility('shown') clears both flags back to the default", () => {
    const entry: LegendEntry = {
      color: "#196127",
      label: "Workday",
      includeInLegend: false,
      includeInSummary: false,
    };
    setLegendVisibility(entry, "shown");

    expect(getLegendVisibility(entry)).toBe("shown");
  });

  it("setLegendVisibility('summaryHidden') clears includeInLegend even if previously hidden", () => {
    const entry: LegendEntry = {
      color: "#196127",
      label: "Workday",
      includeInLegend: false,
      includeInSummary: false,
    };
    setLegendVisibility(entry, "summaryHidden");

    expect(getLegendVisibility(entry)).toBe("summaryHidden");
    expect(entry.includeInLegend).toBeUndefined();
  });
});

describe("buildGradientLegendHtml", () => {
  const colors = ["#c6e48b", "#7bc96f", "#239a3b", "#196127"];

  it("returns an empty string for an empty palette and no independent entries", () => {
    expect(buildGradientLegendHtml([], "Activity")).toBe("");
  });

  it("renders one swatch per palette color, in the given order", () => {
    const html = buildGradientLegendHtml(colors, "Activity");
    colors.forEach((color) =>
      expect(html).toContain(`background-color:${color}`),
    );
    expect(html.indexOf(colors[0])).toBeLessThan(html.indexOf(colors[1]));
    expect(html.indexOf(colors[2])).toBeLessThan(html.indexOf(colors[3]));
  });

  it("shows the shared label beside the strip, with no Less/More caption", () => {
    const html = buildGradientLegendHtml(colors, "Activity");
    expect(html).toContain(">Activity<");
    // No font size small enough reliably fits both words under as few as
    // two swatches without truncating or overlapping - dropped entirely.
    expect(html).not.toContain("Less");
    expect(html).not.toContain("More");
  });

  it("escapes the shared label and omits it entirely when blank", () => {
    const escaped = buildGradientLegendHtml(colors, "<b>Activity</b>");
    expect(escaped).toContain("&lt;b&gt;Activity&lt;/b&gt;");
    expect(escaped).not.toContain("<b>Activity</b>");

    const blank = buildGradientLegendHtml(colors, "   ");
    expect(blank).not.toContain('<span style="font-size:0.85em;">');
  });

  it("never includes the blank/background color in the strip, even if passed in", () => {
    const html = buildGradientLegendHtml(
      [...colors, EMPTY_CELL_COLOR],
      "Activity",
    );
    expect(html).not.toContain(`background-color:${EMPTY_CELL_COLOR}`);
  });

  it("renders independent (non-palette) entries as their own swatch+label items in the same row as the strip", () => {
    const html = buildGradientLegendHtml(colors, "Activity", [
      { color: "#8b95a5", label: "Leave" },
      { color: "#f59e0b", label: "Rest day work" },
    ]);

    expect(html).toContain("background-color:#8b95a5");
    expect(html).toContain(">Leave<");
    expect(html).toContain("background-color:#f59e0b");
    expect(html).toContain(">Rest day work<");
    // Exactly one wrapping row (one top-level flex container), not a
    // separate line below the gradient strip.
    expect(
      html.match(
        /flex-wrap:wrap;gap:12px;margin:8px 0 16px;align-items:center;/g,
      )?.length,
    ).toBe(1);
  });

  it("omits an independent entry with no label", () => {
    const html = buildGradientLegendHtml(colors, "Activity", [
      { color: "#8b95a5", label: "" },
    ]);
    expect(html).not.toContain("#8b95a5");
  });

  it("omits an independent entry hidden entirely (includeInLegend: false)", () => {
    const html = buildGradientLegendHtml(colors, "Activity", [
      { color: "#8b95a5", label: "Leave", includeInLegend: false },
    ]);
    expect(html).not.toContain("#8b95a5");
    expect(html).not.toContain(">Leave<");
  });

  it("still renders independent entries even when the palette itself is empty", () => {
    const html = buildGradientLegendHtml([], "Activity", [
      { color: "#8b95a5", label: "Leave" },
    ]);
    expect(html).toContain(">Leave<");
  });

  it("places the combined gradient item at the same position its palette colors occupy in the full legend array, not hardcoded first", () => {
    const legend: LegendEntry[] = [
      { color: "#8b95a5", label: "Leave" },
      { color: "#c6e48b", label: "" },
      { color: "#7bc96f", label: "" },
    ];
    const html = buildGradientLegendHtml(
      ["#c6e48b", "#7bc96f"],
      "Activity",
      legend,
    );

    // "Leave" comes first in the array, so it renders before the gradient
    // item too - dragging the gradient group row (see LegendModal) must be
    // able to actually change this order, not just cosmetically in the editor.
    expect(html.indexOf(">Leave<")).toBeLessThan(html.indexOf(">Activity<"));
  });

  it("omits the whole gradient item (strip + label) when every palette-color entry is hidden entirely", () => {
    const legend: LegendEntry[] = [
      { color: "#c6e48b", label: "", includeInLegend: false },
      { color: "#7bc96f", label: "", includeInLegend: false },
    ];
    const html = buildGradientLegendHtml(
      ["#c6e48b", "#7bc96f"],
      "Activity",
      legend,
    );

    expect(html).toBe("");
  });

  it("keeps showing the gradient item when only some palette colors are hidden", () => {
    const legend: LegendEntry[] = [
      { color: "#c6e48b", label: "", includeInLegend: false },
      { color: "#7bc96f", label: "" },
    ];
    const html = buildGradientLegendHtml(
      ["#c6e48b", "#7bc96f"],
      "Activity",
      legend,
    );

    expect(html).toContain(">Activity<");
  });
});

describe("buildSummaryModel", () => {
  const model: ReportModel = {
    startDate: "2026-07-13",
    endDate: "2026-07-15",
    weeks: [
      {
        weekStart: "2026-07-13",
        days: [
          day({ date: "2026-07-13", color: "#196127", value: 8 }),
          day({ date: "2026-07-14", color: "#8b949e", value: 0 }),
          day({ date: "2026-07-15", color: "#196127", value: 6 }),
        ],
      },
    ],
    summary: { totalDays: 3, totalValue: 14, activeWeeks: 1 },
  };

  it("falls back to a flat day count when there is no legend", () => {
    expect(buildSummaryModel(model, {})).toEqual({
      dayTypeParts: [{ label: "Days logged", value: 3 }],
      total: { label: "Total value", value: 14 },
    });
  });

  it("uses a custom value label when provided", () => {
    expect(buildSummaryModel(model, { valueLabel: "hours" }).total).toEqual({
      label: "Total hours",
      value: 14,
    });
  });

  it("breaks down by day type when a legend is provided", () => {
    const legend: LegendEntry[] = [
      { color: "#196127", label: "Workday" },
      { color: "#8b949e", label: "Leave" },
    ];

    expect(buildSummaryModel(model, { valueLabel: "hours", legend })).toEqual({
      dayTypeParts: [
        { label: "Workday", value: 2 },
        { label: "Leave", value: 1 },
      ],
      total: { label: "Total hours", value: 14 },
    });
  });

  it("adds an Other bucket when some days don't match the legend", () => {
    const legend: LegendEntry[] = [{ color: "#196127", label: "Workday" }];

    expect(buildSummaryModel(model, { legend })).toEqual({
      dayTypeParts: [
        { label: "Workday", value: 2 },
        { label: "Other", value: 1 },
      ],
      total: { label: "Total value", value: 14 },
    });
  });

  it("counts blank (unlogged) days against a legend entry using EMPTY_CELL_COLOR", () => {
    const sparseModel: ReportModel = {
      startDate: "2026-07-13",
      endDate: "2026-07-17", // 5 calendar days
      weeks: [
        {
          weekStart: "2026-07-13",
          days: [day({ date: "2026-07-13", color: "#196127", value: 8 })], // only 1 logged
        },
      ],
      summary: { totalDays: 1, totalValue: 8, activeWeeks: 1 },
    };
    const legend: LegendEntry[] = [
      { color: "#196127", label: "Workday" },
      { color: EMPTY_CELL_COLOR, label: "Rest day" },
    ];

    expect(buildSummaryModel(sparseModel, { legend }).dayTypeParts).toEqual([
      { label: "Workday", value: 1 },
      { label: "Rest day", value: 4 },
    ]);
  });

  it("omits an entry from the summary when includeInSummary is false, without affecting Other", () => {
    const legend: LegendEntry[] = [
      { color: "#196127", label: "Workday" },
      { color: "#8b949e", label: "Leave", includeInSummary: false },
    ];

    // Leave's day is matched (not "Other"), just not displayed as its own line.
    expect(
      buildSummaryModel(model, { valueLabel: "hours", legend }).dayTypeParts,
    ).toEqual([{ label: "Workday", value: 2 }]);
  });

  it("still matches a blank-labeled, summary-excluded entry's color instead of counting it as Other", () => {
    // LegendModal keeps a blank-labeled row only when it's excluded from the
    // summary (the only way to hide a color from both the legend and the
    // summary line) — its days must still land on its own color, not "Other".
    const legend: LegendEntry[] = [
      { color: "#196127", label: "Workday" },
      { color: "#8b949e", label: "", includeInSummary: false },
    ];

    expect(
      buildSummaryModel(model, { valueLabel: "hours", legend }).dayTypeParts,
    ).toEqual([{ label: "Workday", value: 2 }]);
  });

  it("returns an empty dayTypeParts array (not a blank placeholder) when every legend entry is excluded", () => {
    const legend: LegendEntry[] = [
      { color: "#196127", label: "Workday", includeInSummary: false },
      { color: "#8b949e", label: "Leave", includeInSummary: false },
    ];

    expect(buildSummaryModel(model, { legend }).dayTypeParts).toEqual([]);
  });

  it("omits the day-type breakdown entirely when hideSummary is set", () => {
    const legend: LegendEntry[] = [{ color: "#196127", label: "Workday" }];

    const result = buildSummaryModel(model, { legend, hideSummary: true });

    expect(result.dayTypeParts).toEqual([]);
    expect(result.total).toEqual({ label: "Total value", value: 14 });
  });

  it("omits the day count fallback too when hideSummary is set and there's no legend", () => {
    expect(
      buildSummaryModel(model, { hideSummary: true }).dayTypeParts,
    ).toEqual([]);
  });

  it("omits only the total when hideTotalValue is set", () => {
    const result = buildSummaryModel(model, { hideTotalValue: true });

    expect(result.dayTypeParts).toEqual([{ label: "Days logged", value: 3 }]);
    expect(result.total).toBeNull();
  });

  it("omits only the total when hideAllValues is set", () => {
    const result = buildSummaryModel(model, { hideAllValues: true });

    expect(result.dayTypeParts).toEqual([{ label: "Days logged", value: 3 }]);
    expect(result.total).toBeNull();
  });

  it("omits everything when both hideSummary and hideAllValues are set", () => {
    expect(
      buildSummaryModel(model, { hideSummary: true, hideAllValues: true }),
    ).toEqual({
      dayTypeParts: [],
      total: null,
    });
  });

  describe("legendMode: gradient", () => {
    const colorsList = ["#196127", "#8b949e"];

    it("combines all palette-color entries into one part labeled with the shared gradientLabel", () => {
      const legend: LegendEntry[] = [
        { color: "#196127", label: "" },
        { color: "#8b949e", label: "" },
      ];

      expect(
        buildSummaryModel(model, {
          legend,
          legendMode: "gradient",
          gradientLabel: "Activity",
          colorsList,
        }).dayTypeParts,
      ).toEqual([{ label: "Activity", value: 3 }]);
    });

    it("keeps a matched color that isn't in colorsList as its own independent part, not folded into the gradient", () => {
      // "#8b949e" is used in the data and matched by the legend, but isn't
      // part of the configured palette (e.g. a one-off custom color) - it
      // must stay its own line, exactly like the blank color does.
      const legend: LegendEntry[] = [
        { color: "#196127", label: "" },
        { color: "#8b949e", label: "Custom" },
      ];

      expect(
        buildSummaryModel(model, {
          legend,
          legendMode: "gradient",
          gradientLabel: "Activity",
          colorsList: ["#196127"],
        }).dayTypeParts,
      ).toEqual([
        { label: "Activity", value: 2 },
        { label: "Custom", value: 1 },
      ]);
    });

    it("scales a color's contribution by its countWeight (e.g. a lighter 'half day' color)", () => {
      const legend: LegendEntry[] = [
        { color: "#196127", label: "" }, // 2 days, default weight 1
        { color: "#8b949e", label: "", countWeight: 0.5 }, // 1 day, half weight
      ];

      expect(
        buildSummaryModel(model, {
          legend,
          legendMode: "gradient",
          gradientLabel: "Workday",
          colorsList,
        }).dayTypeParts,
      ).toEqual([{ label: "Workday", value: 2.5 }]);
    });

    it("never applies a weight to the blank entry, even if one were set", () => {
      const sparseModel: ReportModel = {
        startDate: "2026-07-13",
        endDate: "2026-07-17",
        weeks: [
          {
            weekStart: "2026-07-13",
            days: [day({ date: "2026-07-13", color: "#196127", value: 8 })],
          },
        ],
        summary: { totalDays: 1, totalValue: 8, activeWeeks: 1 },
      };
      const legend: LegendEntry[] = [
        { color: "#196127", label: "" },
        // 4 gap days; a weight here (if it were honored) would misleadingly
        // shrink/grow the blank line - it must always show the raw count.
        { color: EMPTY_CELL_COLOR, label: "Rest day", countWeight: 0.5 },
      ];

      expect(
        buildSummaryModel(sparseModel, {
          legend,
          legendMode: "gradient",
          gradientLabel: "Workday",
          colorsList: ["#196127"],
        }).dayTypeParts,
      ).toEqual([
        { label: "Workday", value: 1 },
        { label: "Rest day", value: 4 },
      ]);
    });

    it("rounds away floating-point drift from repeated fractional weights", () => {
      const threeDayModel: ReportModel = {
        startDate: "2026-07-13",
        endDate: "2026-07-15",
        weeks: [
          {
            weekStart: "2026-07-13",
            days: [
              day({ date: "2026-07-13", color: "#196127" }),
              day({ date: "2026-07-14", color: "#196127" }),
              day({ date: "2026-07-15", color: "#196127" }),
            ],
          },
        ],
        summary: { totalDays: 3, totalValue: 0, activeWeeks: 1 },
      };
      // 3 * 0.1 === 0.30000000000000004 in raw IEEE754 arithmetic.
      const legend: LegendEntry[] = [
        { color: "#196127", label: "", countWeight: 0.1 },
      ];

      expect(
        buildSummaryModel(threeDayModel, {
          legend,
          legendMode: "gradient",
          gradientLabel: "Workday",
          colorsList: ["#196127"],
        }).dayTypeParts[0].value,
      ).toBe(0.3);
    });

    it("keeps the blank entry as its own separate part, never folded into the gradient total", () => {
      const sparseModel: ReportModel = {
        startDate: "2026-07-13",
        endDate: "2026-07-17", // 5 calendar days
        weeks: [
          {
            weekStart: "2026-07-13",
            days: [day({ date: "2026-07-13", color: "#196127", value: 8 })], // only 1 logged
          },
        ],
        summary: { totalDays: 1, totalValue: 8, activeWeeks: 1 },
      };
      const legend: LegendEntry[] = [
        { color: "#196127", label: "" },
        { color: EMPTY_CELL_COLOR, label: "Rest day" },
      ];

      expect(
        buildSummaryModel(sparseModel, {
          legend,
          legendMode: "gradient",
          gradientLabel: "Activity",
          colorsList: ["#196127"],
        }).dayTypeParts,
      ).toEqual([
        { label: "Activity", value: 1 },
        { label: "Rest day", value: 4 },
      ]);
    });

    it("excludes a specific color from the gradient total when its includeInSummary is false", () => {
      const legend: LegendEntry[] = [
        { color: "#196127", label: "" },
        { color: "#8b949e", label: "", includeInSummary: false },
      ];

      expect(
        buildSummaryModel(model, {
          legend,
          legendMode: "gradient",
          gradientLabel: "Activity",
          colorsList,
        }).dayTypeParts,
      ).toEqual([{ label: "Activity", value: 2 }]);
    });

    it("omits the combined part entirely when gradientLabel is blank", () => {
      const legend: LegendEntry[] = [{ color: "#196127", label: "" }];

      expect(
        buildSummaryModel(model, {
          legend,
          legendMode: "gradient",
          colorsList: ["#196127"],
        }).dayTypeParts,
      ).toEqual([{ label: "Other", value: 1 }]);
    });

    it("still adds an Other bucket for unmatched colors in gradient mode", () => {
      const legend: LegendEntry[] = [{ color: "#196127", label: "" }];

      expect(
        buildSummaryModel(model, {
          legend,
          legendMode: "gradient",
          gradientLabel: "Activity",
          colorsList: ["#196127"],
        }).dayTypeParts,
      ).toEqual([
        { label: "Activity", value: 2 },
        { label: "Other", value: 1 },
      ]);
    });

    it("positions the combined part according to where the palette colors actually sit in the legend array, not hardcoded first", () => {
      const legend: LegendEntry[] = [
        { color: "#8b949e", label: "Leave" }, // independent, listed first
        { color: "#196127", label: "" }, // palette, listed second
      ];

      // Dragging the gradient group row (see LegendModal) after another
      // category must actually change this order, not just cosmetically in
      // the editor.
      expect(
        buildSummaryModel(model, {
          legend,
          legendMode: "gradient",
          gradientLabel: "Activity",
          colorsList: ["#196127"],
        }).dayTypeParts,
      ).toEqual([
        { label: "Leave", value: 1 },
        { label: "Activity", value: 2 },
      ]);
    });

    it("omits the combined line entirely (not as a zero) when every palette color is excluded from the summary", () => {
      const legend: LegendEntry[] = [
        { color: "#196127", label: "", includeInSummary: false },
        { color: "#8b949e", label: "", includeInSummary: false },
      ];

      expect(
        buildSummaryModel(model, {
          legend,
          legendMode: "gradient",
          gradientLabel: "Activity",
          colorsList: ["#196127", "#8b949e"],
        }).dayTypeParts,
      ).toEqual([]);
    });
  });
});
