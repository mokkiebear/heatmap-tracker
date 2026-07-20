import { ReportDay, ReportModel } from "../reportModel";
import { buildLegendHtml, buildSummaryModel, computeDayTypeCounts, LegendEntry } from "../legend";
import { EMPTY_CELL_COLOR } from "../heatmapHtml";

function day(overrides: Partial<ReportDay> & { date: string }): ReportDay {
  return { weekday: 1, ...overrides };
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

    expect(counts).toEqual({ Workday: 2, Leave: 1 });
    expect(otherCount).toBe(0);
  });

  it("matches case-insensitively and ignores surrounding whitespace", () => {
    const days = [day({ date: "2026-07-13", color: " #196127 ".trim().toUpperCase() })];
    const { counts, otherCount } = computeDayTypeCounts(days, legend);

    expect(counts.Workday).toBe(1);
    expect(otherCount).toBe(0);
  });

  it("buckets unmatched colors and undefined colors into otherCount", () => {
    const days = [
      day({ date: "2026-07-13", color: "#d18616" }),
      day({ date: "2026-07-14", color: undefined }),
    ];

    const { counts, otherCount } = computeDayTypeCounts(days, legend);

    expect(counts).toEqual({ Workday: 0, Leave: 0 });
    expect(otherCount).toBe(2);
  });

  it("buckets everything as other when the legend is empty", () => {
    const days = [day({ date: "2026-07-13", color: "#196127" })];
    const { counts, otherCount } = computeDayTypeCounts(days, []);

    expect(counts).toEqual({});
    expect(otherCount).toBe(1);
  });

  it("counts unlogged (blank) days against the legend entry using EMPTY_CELL_COLOR", () => {
    const days = [day({ date: "2026-07-13", color: "#196127" })];
    const legendWithBlank: LegendEntry[] = [
      { color: "#196127", label: "Workday" },
      { color: EMPTY_CELL_COLOR, label: "Rest day" },
    ];

    const { counts } = computeDayTypeCounts(days, legendWithBlank, 5);

    expect(counts.Workday).toBe(1);
    expect(counts["Rest day"]).toBe(4);
  });

  it("does not add a blank count when totalDaysInRange is omitted", () => {
    const days = [day({ date: "2026-07-13", color: "#196127" })];
    const legendWithBlank: LegendEntry[] = [{ color: EMPTY_CELL_COLOR, label: "Rest day" }];

    const { counts } = computeDayTypeCounts(days, legendWithBlank);

    expect(counts["Rest day"]).toBe(0);
  });
});

describe("buildLegendHtml", () => {
  it("returns an empty string for an empty legend", () => {
    expect(buildLegendHtml([])).toBe("");
  });

  it("renders a swatch + escaped label per entry", () => {
    const html = buildLegendHtml([{ color: "#196127", label: "<b>Workday</b>" }]);

    expect(html).toContain("background-color:#196127");
    expect(html).toContain("&lt;b&gt;Workday&lt;/b&gt;");
    expect(html).not.toContain("<b>Workday</b>");
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
    expect(buildSummaryModel(model, { valueLabel: "hours", legend }).dayTypeParts).toEqual([
      { label: "Workday", value: 2 },
    ]);
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
    expect(buildSummaryModel(model, { hideSummary: true }).dayTypeParts).toEqual([]);
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
    expect(buildSummaryModel(model, { hideSummary: true, hideAllValues: true })).toEqual({
      dayTypeParts: [],
      total: null,
    });
  });
});
