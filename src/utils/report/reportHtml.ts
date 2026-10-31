import i18n from "src/localization/i18n";
import katex from "katex";
import { ReportDay, ReportModel } from "src/utils/report/reportModel";
import { escapeHtml } from "src/utils/report/heatmapHtml";
import { formatDayLabel, formatWeekLabel } from "src/utils/report/dateLabels";
import { REPORT_BODY_CSS } from "src/utils/report/reportBodyCss";
import {
  ReportOptions,
  buildReportHeader,
} from "src/utils/report/reportHeader";

/** Converts a note body's bullet lines into a real <ul>, plain lines into <p>. */
function bulletsToHtml(body: string): string {
  return (
    body
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const bullet = line.match(/^[-*•]\s+(.*)$/);
        return bullet
          ? `<li>${escapeHtml(bullet[1])}</li>`
          : `<p>${escapeHtml(line)}</p>`;
      })
      .join("")
      // Escaped text has no "<", so each run of items is a whole list.
      .replace(/(?:<li>[^<]*<\/li>)+/g, (items) => `<ul>${items}</ul>`)
  );
}

function renderDay(day: ReportDay, hideAllValues: boolean): string {
  const valueLabel =
    !hideAllValues && day.value !== undefined
      ? ` <span class="wlr-day__value">(${escapeHtml(String(day.value))})</span>`
      : "";
  // Obsidian-rendered HTML keeps math, code and callouts; the bullet fallback
  // covers entries with no note behind them and notes that failed to render.
  const bodyHtml = day.bodyHtml?.trim()
    ? `<div class="wlr-body markdown-rendered">${day.bodyHtml}</div>`
    : day.body?.trim()
      ? bulletsToHtml(day.body)
      : "<p>-</p>";

  return `<section class="wlr-day"><h3>${escapeHtml(formatDayLabel(day.date))}${valueLabel}</h3>${bodyHtml}</section>`;
}

/**
 * Serializes a ReportModel to a full, self-contained HTML document (inline
 * styles, no external assets) suitable for opening standalone or emailing.
 */
export function buildReportHtml(
  model: ReportModel,
  options: ReportOptions,
): string {
  const { title, generatedAt, heatmapHtml, hideAllValues = false } = options;
  const { summaryLine, legendHtml } = buildReportHeader(
    model,
    options,
    escapeHtml,
  );

  const weeksHtml = model.weeks
    .map(
      (week) =>
        `<section class="wlr-week"><h2>${escapeHtml(
          i18n.t("report.document.weekOf", {
            date: formatWeekLabel(week.weekStart),
          }),
        )}</h2>${week.days.map((day) => renderDay(day, hideAllValues)).join("")}</section>`,
    )
    .join("");

  const hasMath = model.weeks.some((week) =>
    week.days.some((day) => day.bodyHtml?.includes('class="katex')),
  );
  const katexCss = hasMath
    ? `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@${katex.version}/dist/katex.min.css" />\n`
    : "";

  return `<!doctype html>
<html lang="${escapeHtml(i18n.language)}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
${katexCss}<style>
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
${REPORT_BODY_CSS}</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="wlr-meta">${escapeHtml(formatWeekLabel(model.startDate))} – ${escapeHtml(
    formatWeekLabel(model.endDate),
  )}<br>${escapeHtml(
    i18n.t("report.document.generated", { date: generatedAt }),
  )}</div>
  ${summaryLine ? `<div class="wlr-summary">${summaryLine}</div>` : ""}
  ${heatmapHtml}
  ${legendHtml}
  ${weeksHtml}
</body>
</html>`;
}
