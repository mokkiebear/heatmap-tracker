import i18n from "src/localization/i18n";
import { ReportModel } from "src/utils/report/reportModel";
import { formatDayLabel, formatWeekLabel } from "src/utils/report/dateLabels";
import {
  ReportOptions,
  buildReportHeader,
} from "src/utils/report/reportHeader";

/**
 * Serializes a ReportModel to a Markdown document. The heatmap is embedded
 * as a raw HTML block (not a live heatmap-tracker codeblock) so it still
 * renders in Obsidian reading view and survives "Export to PDF".
 */
export function buildReportMarkdown(
  model: ReportModel,
  options: ReportOptions,
): string {
  const { title, generatedAt, heatmapHtml, hideAllValues } = options;
  const { summaryLine, legendHtml } = buildReportHeader(model, options);
  const blocks = [
    `# ${title}`,
    // A `<br>`, not a blank line, keeps the two-line caption tight.
    `*${formatWeekLabel(model.startDate)} – ${formatWeekLabel(model.endDate)}*<br>*${i18n.t("report.document.generated", { date: generatedAt })}*`,
  ];
  if (summaryLine) blocks.push(summaryLine);
  blocks.push(heatmapHtml);
  if (legendHtml) blocks.push(legendHtml);

  model.weeks.forEach((week) => {
    blocks.push(
      `## ${i18n.t("report.document.weekOf", { date: formatWeekLabel(week.weekStart) })}`,
    );
    week.days.forEach((day) => {
      const value =
        !hideAllValues && day.value !== undefined ? ` (${day.value})` : "";
      blocks.push(
        `### ${formatDayLabel(day.date)}${value}`,
        day.body?.trim() || "-",
      );
    });
  });

  return `${blocks.join("\n\n")}\n`;
}
