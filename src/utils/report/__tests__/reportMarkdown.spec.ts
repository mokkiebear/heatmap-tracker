import { makeReportModel } from "src/test-utils";
import { ReportOptions } from "../reportHeader";
import { buildReportMarkdown } from "../reportMarkdown";

const model = makeReportModel([
  {
    date: "2026-07-13",
    weekday: 1,
    value: 8,
    color: "#7bc96f",
    body: "- meeting\n- wrote code",
  },
  {
    date: "2026-07-14",
    weekday: 2,
    value: undefined,
    color: undefined,
    body: undefined,
  },
]);

const markdown = (overrides: Partial<ReportOptions> = {}) =>
  buildReportMarkdown(model, {
    title: "Work Log Report",
    generatedAt: "2026-07-17",
    heatmapHtml: '<div class="wlr-heatmap"></div>',
    ...overrides,
  });

describe("buildReportMarkdown", () => {
  it("includes the title, summary, embedded heatmap, and week/day structure", () => {
    const md = markdown();

    expect(md).toContain("# Work Log Report");
    expect(md).toContain("Jul 13, 2026 – Jul 14, 2026");
    // Only per-day headings keep the weekday, not the range line.
    expect(md).not.toContain("Mon, Jul 13, 2026 –");
    expect(md).toContain("Report generated 2026-07-17");
    expect(md).toContain("Days logged: 2");
    expect(md).toContain("Total value: 8");
    expect(md).toContain('<div class="wlr-heatmap"></div>');
    expect(md).toContain("## Week of Jul 13, 2026");
    expect(md).toContain("### Mon, Jul 13, 2026 (8)");
    // Bodies stay verbatim Markdown.
    expect(md).toContain("- meeting\n- wrote code");
  });

  it("falls back to a placeholder when a day has no note body", () => {
    expect(markdown()).toContain("\n### Tue, Jul 14, 2026\n\n-\n");
  });

  it("embeds the legend as an inline-styled swatch + label (no dependency on a <style> block)", () => {
    const md = markdown({ legend: [{ color: "#7bc96f", label: "Workday" }] });

    expect(md).toContain("background-color:#7bc96f");
    expect(md).toContain(">Workday<");
  });

  it("hides both the total and each day's own value when hideAllValues is set", () => {
    const md = markdown({
      legend: [{ color: "#7bc96f", label: "Workday" }],
      hideAllValues: true,
    });

    expect(md).not.toContain("Total value");
    expect(md).toContain("\n### Mon, Jul 13, 2026\n");
  });

  it("omits the summary line entirely when both dayTypeParts and the total are hidden", () => {
    // The heatmap follows the caption directly, with no empty summary line.
    expect(
      markdown({
        heatmapHtml: "MARKER",
        hideSummary: true,
        hideAllValues: true,
      }),
    ).toContain("Report generated 2026-07-17*\n\nMARKER\n");
  });
});
