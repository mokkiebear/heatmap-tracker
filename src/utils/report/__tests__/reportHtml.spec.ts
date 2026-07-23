import { ReportModel } from "../reportModel";
import { buildReportHtml } from "../reportHtml";

const model: ReportModel = {
  startDate: "2026-07-13",
  endDate: "2026-07-14",
  weeks: [
    {
      weekStart: "2026-07-13",
      days: [
        {
          date: "2026-07-13",
          weekday: 1,
          value: 8,
          color: "#7bc96f",
          body: "- meeting\n- <script>alert(1)</script>",
        },
        { date: "2026-07-14", weekday: 2, value: undefined, color: undefined, body: undefined },
      ],
    },
  ],
  summary: { totalDays: 2, totalValue: 8, activeWeeks: 1 },
};

describe("buildReportHtml", () => {
  it("produces a self-contained document with the title, summary, and embedded heatmap", () => {
    const html = buildReportHtml(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: '<div class="wlr-heatmap"></div>',
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<title>Work Log Report</title>");
    expect(html).toContain('<div class="wlr-heatmap"></div>');
    expect(html).toContain("Days logged: 2");
    expect(html).toContain("Total value: 8");
    expect(html).toContain("Week of Jul 13, 2026");
    expect(html).toContain('<div class="wlr-meta">Jul 13, 2026 – Jul 14, 2026<br>Report generated 2026-07-17</div>');
  });

  it("drops the weekday from the overall range line (only per-day headings keep it)", () => {
    const html = buildReportHtml(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
    });

    expect(html).not.toContain("Mon, Jul 13, 2026 –");
  });

  it("converts bullet lines into a real <ul><li> list", () => {
    const html = buildReportHtml(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
    });

    expect(html).toContain("<ul>");
    expect(html).toContain("<li>meeting</li>");
  });

  it("escapes note-body text so raw HTML/scripts cannot execute", () => {
    const html = buildReportHtml(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
    });

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("shows a placeholder for days with no note body", () => {
    const html = buildReportHtml(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
    });

    expect(html).toContain("<p>-</p>");
  });

  it("renders the day-type breakdown as one flat '·'-joined line, total on its own line", () => {
    const html = buildReportHtml(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
      valueLabel: "hours",
      legend: [{ color: "#7bc96f", label: "Workday" }],
    });

    expect(html).not.toContain("Days logged");
    expect(html).toContain('<div class="wlr-summary">Workday: 1 · Other: 1<br>Total hours: 8</div>');
  });

  it("omits an excluded category from the day-type line but keeps it correctly out of Other", () => {
    const html = buildReportHtml(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
      legend: [
        { color: "#7bc96f", label: "Workday", includeInSummary: false },
        { color: "#8b949e", label: "Leave" },
      ],
    });

    // "Workday" still appears in the swatch legend (a separate concern from the
    // summary line) — check the summary divs specifically, not the whole doc.
    const summaryText = (html.match(/<div class="wlr-summary">(.*?)<\/div>/g) ?? []).join(" ");
    expect(summaryText).toContain("Leave: 0 · Other: 1");
    expect(summaryText).not.toContain("Workday");
  });

  it("embeds the legend as an inline-styled swatch + label (no dependency on a <style> block)", () => {
    const html = buildReportHtml(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
      legend: [{ color: "#7bc96f", label: "Workday" }],
    });

    expect(html).toContain("background-color:#7bc96f");
    expect(html).toContain(">Workday<");
  });

  it("escapes legend labels in both the summary and the legend block", () => {
    const html = buildReportHtml(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
      legend: [{ color: "#7bc96f", label: "<b>Workday</b>" }],
    });

    expect(html).not.toContain("<b>Workday</b>");
    expect(html).toContain("&lt;b&gt;Workday&lt;/b&gt;");
  });

  it("renders only the total (no blank day-type portion) when every legend entry is excluded", () => {
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

    const html = buildReportHtml(bothMatched, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "MARKER",
      legend: [
        { color: "#7bc96f", label: "Workday", includeInSummary: false },
        { color: "#8b949e", label: "Leave", includeInSummary: false },
      ],
    });

    expect(html).toContain('<div class="wlr-summary">Total value: 8</div>');
  });

  it("omits the wlr-summary div entirely when both the day-type breakdown and the total are hidden", () => {
    const html = buildReportHtml(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "MARKER",
      hideSummary: true,
      hideAllValues: true,
    });

    expect(html).not.toContain('class="wlr-summary"');
  });

  it("omits the day-type breakdown but keeps the total when hideSummary is set", () => {
    const html = buildReportHtml(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
      legend: [{ color: "#7bc96f", label: "Workday" }],
      hideSummary: true,
    });

    expect(html).toContain('<div class="wlr-summary">Total value: 8</div>');
    expect(html).not.toContain("Days logged");
  });

  it("omits the total but keeps the day-type breakdown when hideTotalValue is set", () => {
    const html = buildReportHtml(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
      legend: [{ color: "#7bc96f", label: "Workday" }],
      hideTotalValue: true,
    });

    expect(html).toContain('<div class="wlr-summary">Workday: 1 · Other: 1</div>');
    expect(html).not.toContain("Total value");
  });

  it("hides both the total and each day's own value when hideAllValues is set", () => {
    const html = buildReportHtml(model, {
      title: "Work Log Report",
      generatedAt: "2026-07-17",
      heatmapHtml: "",
      legend: [{ color: "#7bc96f", label: "Workday" }],
      hideAllValues: true,
    });

    expect(html).not.toContain("Total value");
    // The static CSS rule for .wlr-day__value stays in the stylesheet
    // regardless (it's just unused); check no actual span is rendered.
    expect(html).not.toContain('<span class="wlr-day__value">');
    expect(html).toContain("<h3>Mon, Jul 13, 2026</h3>");
  });
});
