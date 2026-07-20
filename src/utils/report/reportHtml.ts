import { ReportDay, ReportModel } from "src/utils/report/reportModel";
import { escapeHtml } from "src/utils/report/heatmapHtml";
import { formatDayLabel, formatWeekLabel } from "src/utils/report/dateLabels";
import { LegendEntry, buildLegendHtml, buildSummaryModel } from "src/utils/report/legend";

export interface ReportHtmlOptions {
  title: string;
  generatedAt: string;
  /** Pre-rendered heatmap grid HTML (see buildHeatmapGridHtml), embedded verbatim. */
  heatmapHtml: string;
  /** Renames "Total value" in the summary line, e.g. "hours". */
  valueLabel?: string;
  /** Drives both the embedded legend and the summary's day-type breakdown. */
  legend?: LegendEntry[];
  /** Omits the day-count/day-type breakdown line entirely. */
  hideSummary?: boolean;
  /** Omits the "Total <value label>" line. */
  hideTotalValue?: boolean;
  /** Omits every value — the total line and each day's own "(N)" next to its heading. */
  hideAllValues?: boolean;
}

/** Converts a note body's bullet lines into a real <ul>, plain lines into <p>. */
function bulletsToHtml(body: string): string {
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const html: string[] = [];
  let inList = false;

  for (const line of lines) {
    const bulletMatch = line.match(/^[-*•]\s+(.*)$/);

    if (bulletMatch) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${escapeHtml(bulletMatch[1])}</li>`);
    } else {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<p>${escapeHtml(line)}</p>`);
    }
  }

  if (inList) html.push("</ul>");

  return html.join("");
}

function renderDay(day: ReportDay, hideAllValues: boolean): string {
  const valueLabel =
    !hideAllValues && day.value !== undefined
      ? ` <span class="wlr-day__value">(${escapeHtml(String(day.value))})</span>`
      : "";
  const bodyHtml = day.body?.trim() ? bulletsToHtml(day.body) : "<p>-</p>";

  return `<section class="wlr-day"><h3>${escapeHtml(formatDayLabel(day.date))}${valueLabel}</h3>${bodyHtml}</section>`;
}

/**
 * Serializes a ReportModel to a full, self-contained HTML document (inline
 * styles, no external assets) suitable for opening standalone or emailing.
 */
export function buildReportHtml(
  model: ReportModel,
  {
    title,
    generatedAt,
    heatmapHtml,
    valueLabel,
    legend = [],
    hideSummary,
    hideTotalValue,
    hideAllValues = false,
  }: ReportHtmlOptions,
): string {
  const { dayTypeParts, total } = buildSummaryModel(model, {
    valueLabel,
    legend,
    hideSummary,
    hideTotalValue,
    hideAllValues,
  });
  const dayTypeLine = dayTypeParts.map((p) => `${escapeHtml(p.label)}: ${p.value}`).join(" · ");
  const totalLine = total ? `${escapeHtml(total.label)}: ${total.value}` : "";
  const summaryLine = dayTypeLine && totalLine ? `${dayTypeLine}<br>${totalLine}` : dayTypeLine || totalLine;
  const legendHtml = buildLegendHtml(legend);

  const weeksHtml = model.weeks
    .map(
      (week) =>
        `<section class="wlr-week"><h2>Week of ${escapeHtml(
          formatWeekLabel(week.weekStart),
        )}</h2>${week.days.map((day) => renderDay(day, hideAllValues)).join("")}</section>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; color: #1f2328; background: #ffffff; }
  @media (prefers-color-scheme: dark) { body { color: #e6edf3; background: #0d1117; } }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  .wlr-meta { color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem; }
  .wlr-summary { margin-bottom: 1rem; }
  .wlr-week { margin-bottom: 1.5rem; }
  .wlr-week h2 { font-size: 1.1rem; border-bottom: 1px solid currentColor; padding-bottom: 0.25rem; }
  .wlr-day { margin: 0.75rem 0 0.75rem 0.5rem; }
  .wlr-day h3 { font-size: 0.95rem; margin-bottom: 0.25rem; }
  .wlr-day__value { font-weight: normal; color: #6b7280; }
  ul { margin: 0.25rem 0; padding-left: 1.25rem; }
  p { margin: 0.25rem 0; }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="wlr-meta">${escapeHtml(formatWeekLabel(model.startDate))} – ${escapeHtml(
    formatWeekLabel(model.endDate),
  )}<br>Report generated ${escapeHtml(generatedAt)}</div>
  ${summaryLine ? `<div class="wlr-summary">${summaryLine}</div>` : ""}
  ${heatmapHtml}
  ${legendHtml}
  ${weeksHtml}
</body>
</html>`;
}
