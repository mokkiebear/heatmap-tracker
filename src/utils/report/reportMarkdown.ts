import { ReportModel } from "src/utils/report/reportModel";
import { formatDayLabel, formatWeekLabel } from "src/utils/report/dateLabels";
import { LegendEntry, buildGradientLegendHtml, buildLegendHtml, buildSummaryModel } from "src/utils/report/legend";

export interface ReportMarkdownOptions {
  title: string;
  generatedAt: string;
  /** Pre-rendered heatmap grid HTML (see buildHeatmapGridHtml), embedded as a raw HTML block. */
  heatmapHtml: string;
  /** Renames "Total value" in the summary line, e.g. "hours". */
  valueLabel?: string;
  /** Drives both the embedded legend and the summary's day-type breakdown. */
  legend?: LegendEntry[];
  /** "separate" (default) or "gradient" — see buildSummaryModel/buildGradientLegendHtml. */
  legendMode?: "separate" | "gradient";
  /** Shared label for the gradient's combined swatch strip, when legendMode is "gradient". */
  gradientLabel?: string;
  /** Full intensity color palette, low→high — renders the gradient strip regardless of which colors are actually used in this range. */
  colorsList?: string[];
  /** Omits the day-count/day-type breakdown line entirely. */
  hideSummary?: boolean;
  /** Omits the "Total <value label>" line. */
  hideTotalValue?: boolean;
  /** Omits every value — the total line and each day's own "(N)" next to its heading. */
  hideAllValues?: boolean;
}

/**
 * Serializes a ReportModel to a Markdown document. The heatmap is embedded
 * as a raw HTML block (not a live heatmap-tracker codeblock) so it still
 * renders in Obsidian reading view and survives "Export to PDF".
 */
export function buildReportMarkdown(
  model: ReportModel,
  {
    title,
    generatedAt,
    heatmapHtml,
    valueLabel,
    legend = [],
    legendMode = "separate",
    gradientLabel = "",
    colorsList = [],
    hideSummary,
    hideTotalValue,
    hideAllValues,
  }: ReportMarkdownOptions,
): string {
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push("");
  // A `<br>` (not a blank line) keeps these two lines tight — a blank line
  // between them renders as a full paragraph break, too much space for what's
  // really one two-line caption.
  lines.push(
    `*${formatWeekLabel(model.startDate)} – ${formatWeekLabel(model.endDate)}*<br>*Report generated ${generatedAt}*`,
  );
  lines.push("");
  const { dayTypeParts, total } = buildSummaryModel(model, {
    valueLabel,
    legend,
    legendMode,
    gradientLabel,
    colorsList,
    hideSummary,
    hideTotalValue,
    hideAllValues,
  });
  const dayTypeLine = dayTypeParts.map((p) => `${p.label}: ${p.value}`).join(" · ");
  const totalLine = total ? `${total.label}: ${total.value}` : "";
  const summaryLine = dayTypeLine && totalLine ? `${dayTypeLine}<br>${totalLine}` : dayTypeLine || totalLine;
  if (summaryLine) {
    lines.push(summaryLine);
    lines.push("");
  }
  lines.push(heatmapHtml);
  lines.push("");
  const legendHtml =
    legendMode === "gradient" ? buildGradientLegendHtml(colorsList, gradientLabel, legend) : buildLegendHtml(legend);
  if (legendHtml) {
    lines.push(legendHtml);
    lines.push("");
  }

  model.weeks.forEach((week) => {
    lines.push(`## Week of ${formatWeekLabel(week.weekStart)}`);
    lines.push("");

    week.days.forEach((day) => {
      const dayValueLabel = !hideAllValues && day.value !== undefined ? ` (${day.value})` : "";
      lines.push(`### ${formatDayLabel(day.date)}${dayValueLabel}`);
      lines.push("");
      lines.push(day.body?.trim() || "-");
      lines.push("");
    });
  });

  return lines.join("\n");
}
