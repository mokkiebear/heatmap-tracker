import { makeReportModel } from "src/test-utils";
import { LegendEntry } from "src/types";
import { buildReportHeader } from "../reportHeader";
import { escapeHtml } from "../heatmapHtml";

const GREEN = "#7bc96f";
const GRAY = "#8b95a5";

const model = makeReportModel([
  {
    date: "2026-07-13",
    weekday: 1,
    value: 3,
    color: GREEN,
    countAs: { Workday: 0.5, "Annual Leave": 0.5 },
  },
  { date: "2026-07-14", weekday: 2, value: 0, color: GRAY },
]);

const legend: LegendEntry[] = [
  { color: GREEN, label: "Workday" },
  { color: GRAY, label: "Annual Leave" },
];

describe("buildReportHeader", () => {
  it("joins the breakdown with ' · ' and puts the total on its own line", () => {
    expect(
      buildReportHeader(model, { legend, valueLabel: "hours" }).summaryLine,
    ).toBe("Workday: 0.5 · Annual Leave: 1.5<br>Total hours: 3");
  });

  it("drops whichever half is hidden, and the whole line when both are", () => {
    expect(
      buildReportHeader(model, { legend, hideSummary: true }).summaryLine,
    ).toBe("Total value: 3");
    expect(
      buildReportHeader(model, { legend, hideTotalValue: true }).summaryLine,
    ).toBe("Workday: 0.5 · Annual Leave: 1.5");
    expect(
      buildReportHeader(model, {
        legend,
        hideSummary: true,
        hideAllValues: true,
      }).summaryLine,
    ).toBe("");
  });

  it("escapes labels only when given an escape function", () => {
    const tagged: LegendEntry[] = [{ color: GRAY, label: "<b>Leave</b>" }];

    expect(buildReportHeader(model, { legend: tagged }).summaryLine).toContain(
      "<b>Leave</b>: 1",
    );
    expect(
      buildReportHeader(model, { legend: tagged }, escapeHtml).summaryLine,
    ).toContain("&lt;b&gt;Leave&lt;/b&gt;: 1");
  });

  it("draws a swatch per entry, or one gradient strip in gradient mode", () => {
    const separate = buildReportHeader(model, { legend }).legendHtml;
    const gradient = buildReportHeader(model, {
      legend,
      legendMode: "gradient",
      gradientLabel: "Worked",
      colorsList: [GREEN],
    }).legendHtml;

    expect(separate).toContain(">Workday<");
    expect(gradient).toContain(">Worked<");
    expect(gradient).not.toContain(">Workday<");
    expect(gradient).toContain(">Annual Leave<");
  });
});
