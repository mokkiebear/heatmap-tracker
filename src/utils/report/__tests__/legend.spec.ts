import { makeReportModel } from "src/test-utils";
import { ReportDay, ReportModel } from "../reportModel";
import {
  LegendEntry,
  LegendVisibility,
  buildGradientLegendHtml,
  buildLegendHtml,
  buildSummaryModel,
  computeDayTypeCounts,
  getLegendVisibility,
  nextLegendVisibility,
  setLegendVisibility,
  sumCountAs,
} from "../legend";
import { EMPTY_CELL_COLOR } from "../heatmapHtml";

const GREEN = "#196127";
const GRAY = "#8b949e";
const PURPLE = "#a371f7";

const day = (
  date: string,
  color?: string,
  extra: Partial<ReportDay> = {},
): ReportDay => ({ date, weekday: 1, color, ...extra });
const entry = (
  color: string,
  label = "",
  extra: Partial<LegendEntry> = {},
): LegendEntry => ({ color, label, ...extra });
const part = (label: string, value: number) => ({ label, value });
const summaryHidden = { includeInSummary: false };
const legendHidden = { includeInLegend: false };

/** The summary's day-type parts, in gradient mode when given a palette. */
const dayTypes = (
  model: ReportModel,
  legend: LegendEntry[],
  colorsList?: string[],
  gradientLabel = "Activity",
) =>
  buildSummaryModel(
    model,
    colorsList
      ? { legend, legendMode: "gradient", colorsList, gradientLabel }
      : { legend },
  ).dayTypeParts;

describe("computeDayTypeCounts", () => {
  const legend = [entry(GREEN, "Workday"), entry(GRAY, "Leave")];

  it.each([
    ["by legend color", [GREEN, GREEN, GRAY], legend, [2, 1], 0],
    // Fresh entries all have a blank label; keying by label would merge them.
    [
      "by color, not by a label entries share",
      [GREEN, GREEN, GRAY],
      [entry(GREEN), entry(GRAY)],
      [2, 1],
      0,
    ],
    ["ignoring case and surrounding space", [" #8B949E "], legend, [0, 1], 0],
    [
      "as Other when no entry matches, or there is no color",
      ["#d18616", undefined],
      legend,
      [0, 0],
      2,
    ],
    ["as Other when there is no legend", [GREEN], [], [], 1],
  ])("counts days %s", (_, colors, entries, counts, otherCount) => {
    const days = colors.map((color, i) => day(`2026-07-${13 + i}`, color));
    const result = computeDayTypeCounts(days, entries);

    // One pair per entry, in legend order.
    result.counts.forEach((c, i) => expect(c.entry).toBe(entries[i]));
    expect(result.counts.map((c) => c.count)).toEqual(counts);
    expect(result.otherCount).toBe(otherCount);
  });

  it.each([
    ["the range's unlogged days", day("2026-07-13", GREEN), 5, [1, 4]],
    [
      "none without the range's size",
      day("2026-07-13", GREEN),
      undefined,
      [1, 0],
    ],
    [
      "a countAs day as logged, not blank",
      day("2026-07-13", GREEN, { countAs: { Workday: 0.5 } }),
      5,
      [0, 4],
    ],
  ])("counts %s against the blank color", (_, logged, total, counts) => {
    const legendWithBlank = [
      entry(GREEN, "Workday"),
      entry(EMPTY_CELL_COLOR, "Rest day"),
    ];

    expect(
      computeDayTypeCounts([logged], legendWithBlank, total).counts.map(
        (c) => c.count,
      ),
    ).toEqual(counts);
  });
});

describe("buildLegendHtml", () => {
  it("renders a swatch and the escaped label per entry", () => {
    const html = buildLegendHtml([entry(GREEN, "<b>Workday</b>")]);

    expect(html).toContain(`background-color:${GREEN}`);
    expect(html).toContain("&lt;b&gt;Workday&lt;/b&gt;");
    expect(html).not.toContain("<b>Workday</b>");
  });

  it.each([
    ["no entries", []],
    ["only unlabeled entries", [entry(GRAY, "", summaryHidden)]],
    [
      "only entries hidden from the legend",
      [entry(GRAY, "Leave", legendHidden)],
    ],
  ])("is empty for %s", (_, legend) => {
    expect(buildLegendHtml(legend)).toBe("");
  });
});

describe("legend visibility", () => {
  const stored: [LegendVisibility, Partial<LegendEntry>][] = [
    ["shown", {}],
    ["summaryHidden", summaryHidden],
    ["hidden", { ...summaryHidden, ...legendHidden }],
  ];

  it.each(stored)("reads and writes %s as %j", (visibility, flags) => {
    expect(getLegendVisibility(entry(GREEN, "Workday", flags))).toBe(
      visibility,
    );
    // Writing replaces whatever flags the entry had.
    stored.forEach(([, before]) => {
      const written = entry(GREEN, "Workday", before);
      setLegendVisibility(written, visibility);
      expect(written).toEqual(entry(GREEN, "Workday", flags));
    });
  });

  it("reads hidden from includeInLegend: false alone", () => {
    expect(getLegendVisibility(entry(GREEN, "", legendHidden))).toBe("hidden");
  });

  it("cycles shown → summaryHidden → hidden → shown", () => {
    expect(
      stored.map(([visibility]) => nextLegendVisibility(visibility)),
    ).toEqual(["summaryHidden", "hidden", "shown"]);
  });
});

describe("buildGradientLegendHtml", () => {
  const colors = ["#c6e48b", "#7bc96f", "#239a3b", "#196127"];

  it("renders one swatch per palette color in order, then the shared label", () => {
    const html = buildGradientLegendHtml(colors, "Activity");
    const positions = [
      ...colors.map((color) => `background-color:${color}`),
      ">Activity<",
    ].map((text) => html.indexOf(text));

    expect(positions[0]).toBeGreaterThanOrEqual(0);
    positions
      .slice(1)
      .forEach((p, i) => expect(p).toBeGreaterThan(positions[i]));
  });

  it("escapes the shared label, and leaves a blank one out", () => {
    const html = buildGradientLegendHtml(colors, "<b>Activity</b>");

    expect(html).toContain("&lt;b&gt;Activity&lt;/b&gt;");
    expect(html).not.toContain("<b>Activity</b>");
    expect(buildGradientLegendHtml(colors, "   ")).not.toContain(
      '<span style="font-size:0.85em;">',
    );
  });

  it("never puts the blank color in the strip", () => {
    expect(
      buildGradientLegendHtml([...colors, EMPTY_CELL_COLOR], "Activity"),
    ).not.toContain(`background-color:${EMPTY_CELL_COLOR}`);
  });

  it("lists labeled, shown non-palette entries in the same row as the strip", () => {
    const html = buildGradientLegendHtml(colors, "Activity", [
      entry("#8b95a5", "Leave"),
      entry("#f59e0b", "Rest day work"),
      entry("#aaaaaa"),
      entry("#bbbbbb", "Hidden", legendHidden),
    ]);

    expect(html).toContain("background-color:#8b95a5");
    expect(html).toContain(">Leave<");
    expect(html).toContain("background-color:#f59e0b");
    expect(html).toContain(">Rest day work<");
    expect(html).not.toContain("#aaaaaa");
    expect(html).not.toContain("#bbbbbb");
    // One wrapping row, not a second line under the strip.
    expect(
      html.match(
        /flex-wrap:wrap;gap:12px;margin:8px 0 16px;align-items:center;/g,
      ),
    ).toHaveLength(1);
  });

  it("shows non-palette entries without a palette, and nothing without either", () => {
    expect(
      buildGradientLegendHtml([], "Activity", [entry("#8b95a5", "Leave")]),
    ).toContain(">Leave<");
    expect(buildGradientLegendHtml([], "Activity")).toBe("");
  });

  it("places the strip where its palette colors sit in the legend", () => {
    // Dragging the gradient row in the editor must move it in the export.
    const html = buildGradientLegendHtml(["#c6e48b", "#7bc96f"], "Activity", [
      entry("#8b95a5", "Leave"),
      entry("#c6e48b"),
      entry("#7bc96f"),
    ]);

    expect(html.indexOf(">Leave<")).toBeLessThan(html.indexOf(">Activity<"));
  });

  it("leaves the strip out only when every palette entry is hidden from the legend", () => {
    const palette = ["#c6e48b", "#7bc96f"];
    const legend = (second: Partial<LegendEntry>) => [
      entry(palette[0], "", legendHidden),
      entry(palette[1], "", second),
    ];

    expect(
      buildGradientLegendHtml(palette, "Activity", legend(legendHidden)),
    ).toBe("");
    expect(buildGradientLegendHtml(palette, "Activity", legend({}))).toContain(
      ">Activity<",
    );
  });
});

describe("buildSummaryModel", () => {
  // Two workdays and a leave day, 14 in all.
  const model = makeReportModel([
    day("2026-07-13", GREEN, { value: 8 }),
    day("2026-07-14", GRAY, { value: 0 }),
    day("2026-07-15", GREEN, { value: 6 }),
  ]);
  // One logged day, then four blank ones.
  const sparse = makeReportModel([day("2026-07-13", GREEN, { value: 8 })], {
    end: "2026-07-17",
  });
  const workday = entry(GREEN, "Workday");
  const daysLogged = [part("Days logged", 3)];
  const totalValue = part("Total value", 14);

  it.each([
    [{}, daysLogged, totalValue],
    [{ valueLabel: "hours" }, daysLogged, part("Total hours", 14)],
    [{ hideSummary: true }, [], totalValue],
    [{ hideSummary: true, legend: [workday] }, [], totalValue],
    [{ hideTotalValue: true }, daysLogged, null],
    [{ hideAllValues: true }, daysLogged, null],
    [{ hideSummary: true, hideAllValues: true }, [], null],
  ])("with %j gives %j and %j", (options, dayTypeParts, total) => {
    expect(buildSummaryModel(model, options)).toEqual({ dayTypeParts, total });
  });

  it.each([
    [
      "one part per entry",
      model,
      [workday, entry(GRAY, "Leave")],
      [part("Workday", 2), part("Leave", 1)],
    ],
    [
      "Other for the days no entry matches",
      model,
      [workday],
      [part("Workday", 2), part("Other", 1)],
    ],
    [
      "the range's blank days to the blank color",
      sparse,
      [workday, entry(EMPTY_CELL_COLOR, "Rest day")],
      [part("Workday", 1), part("Rest day", 4)],
    ],
    // Hidden and unlabeled entries still claim their days, so none are Other.
    [
      "no part for an entry hidden from the summary",
      model,
      [workday, entry(GRAY, "Leave", summaryHidden)],
      [part("Workday", 2)],
    ],
    [
      "no part for an unlabeled entry",
      model,
      [workday, entry(GRAY, "", summaryHidden)],
      [part("Workday", 2)],
    ],
    [
      "nothing when every entry is hidden",
      model,
      [
        entry(GREEN, "Workday", summaryHidden),
        entry(GRAY, "Leave", summaryHidden),
      ],
      [],
    ],
  ])("breaks the days down by legend: %s", (_, m, legend, parts) => {
    expect(dayTypes(m, legend)).toEqual(parts);
  });

  describe("in gradient mode", () => {
    const palette = [GREEN, GRAY];

    it.each([
      ["sums the palette colors into one part", [entry(GREEN), entry(GRAY)], 3],
      [
        "scales each color by its countWeight",
        [entry(GREEN), entry(GRAY, "", { countWeight: 0.5 })],
        2.5,
      ],
      // 2 × 0.1 + 0.1 is 0.30000000000000004 unrounded.
      [
        "rounds float noise from fractional weights",
        [
          entry(GREEN, "", { countWeight: 0.1 }),
          entry(GRAY, "", { countWeight: 0.1 }),
        ],
        0.3,
      ],
      [
        "leaves out a color hidden from the summary",
        [entry(GREEN), entry(GRAY, "", summaryHidden)],
        2,
      ],
    ])("%s", (_, legend, value) => {
      expect(dayTypes(model, legend, palette)).toEqual([
        part("Activity", value),
      ]);
    });

    it.each([
      // A color outside the palette, like a one-off custom one, keeps its own part.
      [
        "keeps a non-palette color its own part",
        model,
        [entry(GREEN), entry(GRAY, "Custom")],
        [part("Activity", 2), part("Custom", 1)],
      ],
      // A weight there would misstate the raw count of blank days.
      [
        "keeps the blank color its own part, never weighted",
        sparse,
        [
          entry(GREEN),
          entry(EMPTY_CELL_COLOR, "Rest day", { countWeight: 0.5 }),
        ],
        [part("Activity", 1), part("Rest day", 4)],
      ],
      [
        "adds Other for the days no entry matches",
        model,
        [entry(GREEN)],
        [part("Activity", 2), part("Other", 1)],
      ],
      // Dragging the gradient row below another category must move its part.
      [
        "places the part where the palette sits in the legend",
        model,
        [entry(GRAY, "Leave"), entry(GREEN)],
        [part("Leave", 1), part("Activity", 2)],
      ],
    ])("%s", (_, m, legend, parts) => {
      expect(dayTypes(m, legend, [GREEN])).toEqual(parts);
    });

    it("leaves the combined part out without a label, or with every palette color hidden", () => {
      expect(
        buildSummaryModel(model, {
          legend: [entry(GREEN)],
          legendMode: "gradient",
          colorsList: [GREEN],
        }).dayTypeParts,
      ).toEqual([part("Other", 1)]);
      expect(dayTypes(model, [entry(GREEN)], [GREEN], " ")).toEqual([
        part("Other", 1),
      ]);
      expect(
        dayTypes(
          model,
          [entry(GREEN, "", summaryHidden), entry(GRAY, "", summaryHidden)],
          palette,
        ),
      ).toEqual([]);
    });
  });
});

describe("countAs", () => {
  // A work log: a normal day, two half days of leave that stay green, a
  // full day of annual leave counted by its gray, and a full sick day that
  // carries its own countAs.
  const workLog = makeReportModel([
    day("2026-07-13", GREEN, { value: 8 }),
    day("2026-07-14", GREEN, {
      value: 3,
      countAs: { Workday: 0.5, "Annual Leave": 0.5 },
    }),
    day("2026-07-15", GRAY, { value: 0 }),
    day("2026-07-16", PURPLE, { value: 0, countAs: { "Sick Leave": 1 } }),
    day("2026-07-17", GREEN, {
      value: 4,
      countAs: { Workday: 0.5, "sick leave": 0.5 },
    }),
  ]);
  const days = workLog.weeks[0].days;

  it("leaves a countAs day out of the color counts and Other", () => {
    const { counts, otherCount } = computeDayTypeCounts(days, [
      entry(GREEN, "Workday"),
    ]);

    expect(counts[0].count).toBe(1);
    // The gray day is unmatched; the purple one is counted by its countAs.
    expect(otherCount).toBe(1);
  });

  it("counts a day by color when its countAs has no usable share", () => {
    const unusable: ReportDay["countAs"][] = [
      {},
      { Leave: 0 },
      { "  ": 1 },
      { Leave: undefined },
    ];
    const greenDays = unusable.map((countAs, i) =>
      day(`2026-07-${13 + i}`, GREEN, { countAs }),
    );

    expect(
      computeDayTypeCounts(greenDays, [entry(GREEN, "Workday")]).counts[0]
        .count,
    ).toBe(4);
  });

  describe("sumCountAs", () => {
    it("totals shares case-insensitively, keeping the first-seen label and order", () => {
      expect(sumCountAs(days)).toEqual([
        part("Workday", 1),
        part("Annual Leave", 0.5),
        part("Sick Leave", 1.5),
      ]);
    });

    it("trims labels, skips blank ones and non-numbers, and rounds float noise", () => {
      const shares = [
        day("2026-07-13", undefined, { countAs: { " Done ": 0.1, "": 1 } }),
        day("2026-07-14", undefined, {
          countAs: { done: "0.2", Bad: "x" } as unknown as ReportDay["countAs"],
        }),
      ];

      expect(sumCountAs(shares)).toEqual([part("Done", 0.3)]);
    });
  });

  it.each([
    [
      "joins the line of the same label, whatever its case",
      [
        entry(GREEN, "workday"),
        entry(GRAY, "Annual leave"),
        entry(PURPLE, "Sick Leave"),
      ],
      undefined,
      [part("workday", 2), part("Annual leave", 1.5), part("Sick Leave", 1.5)],
    ],
    [
      "adds a line the legend lacks, before Other",
      [entry(GREEN, "Workday")],
      undefined,
      [
        part("Workday", 2),
        part("Annual Leave", 0.5),
        part("Sick Leave", 1.5),
        part("Other", 1),
      ],
    ],
    [
      "is dropped with a category hidden from the summary",
      [
        entry(GREEN, "Workday"),
        entry(GRAY, "Annual Leave"),
        entry(PURPLE, "Sick Leave", summaryHidden),
      ],
      undefined,
      [part("Workday", 2), part("Annual Leave", 1.5)],
    ],
    [
      "joins a shown line over a hidden one of the same label",
      [
        entry(GREEN, "Workday"),
        entry("#000000", "Sick Leave", summaryHidden),
        entry(PURPLE, "Sick Leave"),
        entry(GRAY, "Annual Leave"),
      ],
      undefined,
      [part("Workday", 2), part("Sick Leave", 1.5), part("Annual Leave", 1.5)],
    ],
    // Without a legend every logged day is already counted.
    ["is ignored without a legend", [], undefined, [part("Days logged", 5)]],
    [
      "splits half days between work and leave in gradient mode",
      [
        entry("#7bc96f"),
        entry(GREEN),
        entry(GRAY, "Annual Leave", { valueOverride: 0 }),
        entry(PURPLE, "Sick Leave", { valueOverride: 0 }),
      ],
      ["#7bc96f", GREEN],
      [part("Workday", 2), part("Annual Leave", 1.5), part("Sick Leave", 1.5)],
    ],
    [
      "is dropped with the gradient line when every palette color is hidden",
      [entry(GREEN, "", summaryHidden), entry(GRAY, "Annual Leave")],
      [GREEN],
      [part("Annual Leave", 1.5), part("Sick Leave", 1.5)],
    ],
  ])("a share %s", (_, legend, colorsList, parts) => {
    expect(dayTypes(workLog, legend, colorsList, "Workday")).toEqual(parts);
  });

  it("folds a share named after a palette color's own label into the gradient line", () => {
    const model = makeReportModel([
      day("2026-07-13", GREEN),
      day("2026-07-14", GREEN, { countAs: { Worked: 0.5 } }),
    ]);

    expect(
      dayTypes(model, [entry(GREEN, "Worked")], [GREEN], "Workday"),
    ).toEqual([part("Workday", 1.5)]);
  });

  it("adds a share labeled Other to the Other line rather than a second one", () => {
    const model = makeReportModel([
      day("2026-07-13", GRAY),
      day("2026-07-14", GREEN, { countAs: { other: 0.5 } }),
    ]);

    expect(dayTypes(model, [entry(GREEN, "Workday")])).toEqual([
      part("Workday", 0),
      part("Other", 1.5),
    ]);
  });

  it("rounds float noise left by adding shares to a line", () => {
    const model = makeReportModel([
      day("2026-07-13", GREEN, { countAs: { Done: 0.1 } }),
      day("2026-07-14", GREEN, { countAs: { Done: 0.2 } }),
    ]);

    expect(dayTypes(model, [entry(GRAY, "Done")])).toEqual([part("Done", 0.3)]);
  });
});
