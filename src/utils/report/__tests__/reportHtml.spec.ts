import { makeReportModel } from "src/test-utils";
import { ReportOptions } from "../reportHeader";
import { ReportModel } from "../reportModel";
import { buildReportHtml } from "../reportHtml";

const model = makeReportModel([
  {
    date: "2026-07-13",
    weekday: 1,
    value: 8,
    color: "#7bc96f",
    body: "- meeting\n- <script>alert(1)</script>",
  },
  {
    date: "2026-07-14",
    weekday: 2,
    value: undefined,
    color: undefined,
    body: undefined,
  },
]);

const html = (overrides: Partial<ReportOptions> = {}, report = model) =>
  buildReportHtml(report, {
    title: "Work Log Report",
    generatedAt: "2026-07-17",
    heatmapHtml: '<div class="wlr-heatmap"></div>',
    ...overrides,
  });

describe("buildReportHtml", () => {
  it("produces a self-contained document with the title, summary, and embedded heatmap", () => {
    const doc = html();

    expect(doc).toContain("<!doctype html>");
    expect(doc).toContain("<title>Work Log Report</title>");
    expect(doc).toContain('<div class="wlr-heatmap"></div>');
    expect(doc).toContain("Days logged: 2");
    expect(doc).toContain("Total value: 8");
    expect(doc).toContain("Week of Jul 13, 2026");
    // The range line drops the weekday that per-day headings keep.
    expect(doc).toContain(
      '<div class="wlr-meta">Jul 13, 2026 – Jul 14, 2026<br>Report generated 2026-07-17</div>',
    );
  });

  it("renders a body nothing rendered as escaped text: bullets as a list, '-' when empty", () => {
    const doc = html();

    expect(doc).toContain(
      "<ul><li>meeting</li><li>&lt;script&gt;alert(1)&lt;/script&gt;</li></ul>",
    );
    expect(doc).not.toContain("<script>alert(1)</script>");
    expect(doc).not.toContain('<div class="wlr-body');
    expect(doc).toContain("<p>-</p>");
  });

  it("closes the list around plain lines and drops blank ones", () => {
    const body = "intro\n- a\n* b\nmiddle\n\n• c\n  outro  ";
    const doc = html(
      {},
      makeReportModel([{ date: "2026-07-13", weekday: 1, body }]),
    );

    expect(doc).toContain(
      "<p>intro</p><ul><li>a</li><li>b</li></ul><p>middle</p><ul><li>c</li></ul><p>outro</p>",
    );
  });

  it("embeds the legend as inline-styled swatches, escaping labels in it and the summary", () => {
    const doc = html({
      legend: [{ color: "#7bc96f", label: "<b>Workday</b>" }],
    });

    expect(doc).toContain("background-color:#7bc96f");
    expect(doc).not.toContain("<b>Workday</b>");
    expect(doc.match(/&lt;b&gt;Workday&lt;\/b&gt;/g)).toHaveLength(2);
  });

  it("omits the wlr-summary div entirely when both the day-type breakdown and the total are hidden", () => {
    expect(html({ hideSummary: true, hideAllValues: true })).not.toContain(
      'class="wlr-summary"',
    );
  });

  it("hides both the total and each day's own value when hideAllValues is set", () => {
    const doc = html({
      legend: [{ color: "#7bc96f", label: "Workday" }],
      hideAllValues: true,
    });

    expect(doc).not.toContain("Total value");
    expect(doc).toContain("<h3>Mon, Jul 13, 2026</h3>");
  });
});

describe("buildReportHtml with rendered note bodies", () => {
  const withBodyHtml = (bodyHtml: string): ReportModel =>
    makeReportModel([{ ...model.weeks[0].days[0], bodyHtml }]);

  it("embeds the Obsidian-rendered HTML (math, code, callouts) instead of the escaped text", () => {
    const rendered =
      '<div class="callout" data-callout="tip"></div><span class="katex"></span><pre><code class="language-js"></code></pre>';
    const doc = html({}, withBodyHtml(rendered));

    expect(doc).toContain(
      `<div class="wlr-body markdown-rendered">${rendered}`,
    );
    expect(doc).not.toContain("&lt;script&gt;");
  });

  it("ships the stylesheet those class names need", () => {
    const doc = html({}, withBodyHtml("<p>x</p>"));

    expect(doc).toContain(".wlr-body .callout");
    expect(doc).toContain(".wlr-body .token.keyword");
  });

  it("links the KaTeX stylesheet only when a note contains math", () => {
    const link =
      /<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/katex@[\d.]+\/dist\/katex\.min\.css"/;

    expect(
      html({}, withBodyHtml('<p><span class="katex">x</span></p>')),
    ).toMatch(link);
    expect(html({}, withBodyHtml("<p>x</p>"))).not.toMatch(link);
  });
});
