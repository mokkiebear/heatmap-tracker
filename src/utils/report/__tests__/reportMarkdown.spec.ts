import { ReportModel } from "../reportModel";
import { buildReportMarkdown } from "../reportMarkdown";

const model: ReportModel = {
  startDate: "2026-07-13",
  endDate: "2026-07-14",
  weeks: [
    {
      weekStart: "2026-07-13",
      days: [
        { date: "2026-07-13", weekday: 1, value: 8, color: "#7bc96f", body: "- meeting\n- wrote code" },
        { date: "2026-07-14", weekday: 2, value: undefined, color: undefined, body: undefined },
      ],
    },
  ],
  summary: { totalDays: 2, totalValue: 8, activeWeeks: 1 },
};

describe("buildReportMarkdown", () => {
  it("includes the title, summary, embedded heatmap, and week/day structure", () => {
    const markdown = buildReportMarkdown(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: '<div class="wlr-heatmap"></div>',
    });

    expect(markdown).toContain("# Work Log Report");
    expect(markdown).toContain("Jul 13, 2026 – Jul 14, 2026");
    expect(markdown).toContain("Report generated 2026-07-17");
    expect(markdown).toContain("Days logged: 2");
    expect(markdown).toContain("Total value: 8");
    expect(markdown).toContain('<div class="wlr-heatmap"></div>');
    expect(markdown).toContain("## Week of Jul 13, 2026");
    expect(markdown).toContain("### Mon, Jul 13, 2026 (8)");
    expect(markdown).toContain("- meeting\n- wrote code");
  });

  it("drops the weekday from the overall range line (only per-day headings keep it)", () => {
    const markdown = buildReportMarkdown(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
    });

    expect(markdown).not.toContain("Mon, Jul 13, 2026 –");
    expect(markdown).toContain("Jul 13, 2026 – Jul 14, 2026");
  });

  it("keeps note bodies verbatim as markdown (no HTML escaping)", () => {
    const markdown = buildReportMarkdown(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
    });

    expect(markdown).toContain("- meeting\n- wrote code");
  });

  it("falls back to a placeholder when a day has no note body", () => {
    const markdown = buildReportMarkdown(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
    });

    expect(markdown).toContain("### Tue, Jul 14, 2026");
    const lines = markdown.split("\n");
    const headingIndex = lines.findIndex((line) => line === "### Tue, Jul 14, 2026");
    expect(lines[headingIndex + 2]).toBe("-");
  });

  it("renders the day-type breakdown flat '·'-joined, with the total on the same line after a <br> (not a paragraph break)", () => {
    const markdown = buildReportMarkdown(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
      valueLabel: "hours",
      legend: [{ color: "#7bc96f", label: "Workday" }],
    });

    expect(markdown).not.toContain("Days logged");
    const lines = markdown.split("\n");
    expect(lines).toContain("Workday: 1 · Other: 1<br>Total hours: 8");
  });

  it("omits an excluded category from the day-type line but keeps it correctly out of Other", () => {
    const markdown = buildReportMarkdown(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
      valueLabel: "hours",
      legend: [
        { color: "#7bc96f", label: "Workday", includeInSummary: false },
        { color: "#8b949e", label: "Leave" },
      ],
    });

    // Workday's day (Jul 13) matches and is excluded from display; Jul 14 has no
    // color at all, so it's genuinely unmatched and still counted as Other.
    // "Workday" still appears in the embedded swatch legend (a separate
    // concern) — check the day-type summary line specifically, not the whole doc.
    const lines = markdown.split("\n");
    expect(lines).toContain("Leave: 0 · Other: 1<br>Total hours: 8");
    expect(lines).not.toContain("Workday: 1 · Leave: 0 · Other: 1<br>Total hours: 8");
  });

  it("embeds the legend as an inline-styled swatch + label (no dependency on a <style> block)", () => {
    const markdown = buildReportMarkdown(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
      legend: [{ color: "#7bc96f", label: "Workday" }],
    });

    expect(markdown).toContain("background-color:#7bc96f");
    expect(markdown).toContain(">Workday<");
  });

  it("drops the summary line entirely (no blank placeholder) when every legend entry is excluded", () => {
    // Both days match a legend color (no "Other" bucket to keep the
    // breakdown line alive), and both entries are excluded from the summary.
    const bothMatched: ReportModel = {
      ...model,
      weeks: [
        {
          weekStart: "2026-07-13",
          days: [
            { date: "2026-07-13", weekday: 1, value: 8, color: "#7bc96f", body: undefined },
            { date: "2026-07-14", weekday: 2, value: undefined, color: "#8b949e", body: undefined },
          ],
        },
      ],
    };

    const markdown = buildReportMarkdown(bothMatched, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "MARKER",
      legend: [
        { color: "#7bc96f", label: "Workday", includeInSummary: false },
        { color: "#8b949e", label: "Leave", includeInSummary: false },
      ],
    });

    const lines = markdown.split("\n");
    // The total is shown alone, immediately after the meta caption's own
    // blank-line separator — no stray blank summary line in between.
    const metaIndex = lines.findIndex((line) => line.includes("Report generated"));
    expect(lines[metaIndex + 1]).toBe("");
    expect(lines[metaIndex + 2]).toBe("Total value: 8");
    expect(lines[metaIndex + 3]).toBe("");
    expect(lines[metaIndex + 4]).toBe("MARKER");
  });

  it("omits the day-type breakdown but keeps the total when hideSummary is set", () => {
    const markdown = buildReportMarkdown(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
      legend: [{ color: "#7bc96f", label: "Workday" }],
      hideSummary: true,
    });

    const lines = markdown.split("\n");
    expect(lines).toContain("Total value: 8");
    // "Workday" still appears in the embedded swatch legend (a separate
    // concern) — hideSummary only omits the day-type breakdown line itself.
    expect(lines).not.toContain("Workday: 1<br>Total value: 8");
    expect(markdown).not.toContain("Days logged");
  });

  it("omits the total but keeps the day-type breakdown when hideTotalValue is set", () => {
    const markdown = buildReportMarkdown(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
      legend: [{ color: "#7bc96f", label: "Workday" }],
      hideTotalValue: true,
    });

    const lines = markdown.split("\n");
    expect(lines).toContain("Workday: 1 · Other: 1");
    expect(markdown).not.toContain("Total value");
  });

  it("hides both the total and each day's own value when hideAllValues is set", () => {
    const markdown = buildReportMarkdown(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
      legend: [{ color: "#7bc96f", label: "Workday" }],
      hideAllValues: true,
    });

    expect(markdown).not.toContain("Total value");
    expect(markdown).toContain("### Mon, Jul 13, 2026");
    expect(markdown).not.toContain("### Mon, Jul 13, 2026 (8)");
  });

  it("omits the summary line entirely when both dayTypeParts and the total are hidden", () => {
    const markdown = buildReportMarkdown(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "MARKER",
      hideSummary: true,
      hideAllValues: true,
    });

    const lines = markdown.split("\n");
    // Right after the meta caption's blank-line separator comes the heatmap
    // marker directly — no stray empty summary line in between.
    const metaIndex = lines.findIndex((line) => line.includes("Report generated"));
    expect(lines[metaIndex + 1]).toBe("");
    expect(lines[metaIndex + 2]).toBe("MARKER");
  });
});
