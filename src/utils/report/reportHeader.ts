import { ReportModel } from "src/utils/report/reportModel";
import {
  SummaryOptions,
  SummaryPart,
  buildGradientLegendHtml,
  buildLegendHtml,
  buildSummaryModel,
} from "src/utils/report/legend";

/** What both serializers take besides the model. */
export interface ReportOptions extends SummaryOptions {
  title: string;
  generatedAt: string;
  /** Pre-rendered heatmap grid HTML (see buildHeatmapGridHtml), embedded verbatim. */
  heatmapHtml: string;
}

/**
 * The summary line (breakdown, then total on its own line) and legend block
 * that both serializers place under the title. `escape` is the identity for
 * Markdown, which embeds text verbatim.
 */
export function buildReportHeader(
  model: ReportModel,
  options: SummaryOptions,
  escape: (text: string) => string = (text) => text,
): { summaryLine: string; legendHtml: string } {
  const { dayTypeParts, total } = buildSummaryModel(model, options);
  const part = (p: SummaryPart) => `${escape(p.label)}: ${p.value}`;
  const summaryLine = [
    dayTypeParts.map(part).join(" · "),
    total ? part(total) : "",
  ]
    .filter(Boolean)
    .join("<br>");

  const legend = options.legend ?? [];
  const legendHtml =
    options.legendMode === "gradient"
      ? buildGradientLegendHtml(
          options.colorsList ?? [],
          options.gradientLabel ?? "",
          legend,
        )
      : buildLegendHtml(legend);

  return { summaryLine, legendHtml };
}
