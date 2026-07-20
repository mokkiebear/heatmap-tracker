import { ReportDay, ReportModel } from "src/utils/report/reportModel";
import { EMPTY_CELL_COLOR, escapeHtml } from "src/utils/report/heatmapHtml";
import { normalizeColor } from "src/utils/report/legendMatch";
import { parseUTCDate } from "src/utils/date";
import { LegendEntry } from "src/types";

export type { LegendEntry } from "src/types";

/**
 * Matches each day's already-resolved color against the legend (case-
 * insensitive, trimmed). Days with no color, or a color not in the legend,
 * fall into `otherCount`. Blank days (no entry at all — never present in
 * `days`) are counted against whichever legend entry uses `EMPTY_CELL_COLOR`,
 * when `totalDaysInRange` is given.
 */
export function computeDayTypeCounts(
  days: ReportDay[],
  legend: LegendEntry[],
  totalDaysInRange?: number,
): { counts: Record<string, number>; otherCount: number } {
  const counts: Record<string, number> = {};
  legend.forEach((entry) => {
    counts[entry.label] = 0;
  });

  const byColor = new Map(legend.map((entry) => [normalizeColor(entry.color), entry.label]));

  let otherCount = 0;
  days.forEach((day) => {
    const label = day.color ? byColor.get(normalizeColor(day.color)) : undefined;
    if (label !== undefined) {
      counts[label] += 1;
    } else {
      otherCount += 1;
    }
  });

  const blankLabel = byColor.get(normalizeColor(EMPTY_CELL_COLOR));
  if (blankLabel !== undefined && totalDaysInRange !== undefined) {
    counts[blankLabel] += Math.max(0, totalDaysInRange - days.length);
  }

  return { counts, otherCount };
}

/**
 * Renders the legend as a small swatch+label list, for embedding under the
 * heatmap. Fully inline-styled (no `<style>` block / class-based CSS) for
 * the same reason as the grid itself — robust against Obsidian's own theme
 * CSS when embedded raw in a Markdown note.
 */
export function buildLegendHtml(legend: LegendEntry[]): string {
  if (legend.length === 0) return "";

  const items = legend
    .map(
      (entry) =>
        `<div style="display:flex;align-items:center;gap:4px;">` +
        `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background-color:${escapeHtml(
          entry.color,
        )};"></span>` +
        `<span style="font-size:0.85em;">${escapeHtml(entry.label)}</span></div>`,
    )
    .join("");

  return `<div style="display:flex;flex-wrap:wrap;gap:12px;margin:8px 0 16px;">${items}</div>`;
}

export interface SummaryPart {
  label: string;
  value: number;
}

export interface SummaryOptions {
  valueLabel?: string;
  legend?: LegendEntry[];
  /** Omits the day-count/day-type breakdown entirely (both the legend breakdown and the no-legend "Days logged" fallback). */
  hideSummary?: boolean;
  /** Omits the "Total <value label>" part. */
  hideTotalValue?: boolean;
  /** Omits every value part — the total, on top of whatever `hideTotalValue` already does. */
  hideAllValues?: boolean;
}

export interface SummaryModel {
  /** Day-type/day-count parts (e.g. "Workday: 22", "Rest day: 1", "Other: 1"), rendered as one flat list. Empty when there's nothing to show. */
  dayTypeParts: SummaryPart[];
  /** The "Total <value label>: N" part, or null when hidden or nothing to show. */
  total: SummaryPart | null;
}

/**
 * Builds the report's summary as a day-type breakdown plus a total, shared by
 * the Markdown and HTML serializers so the breakdown logic isn't duplicated.
 * With a legend: one part per legend entry with `includeInSummary !== false`
 * (+ "Other" for unmatched days — always shown when non-zero, regardless of
 * which specific entries are hidden). Without a legend: falls back to a flat
 * "Days logged" count. Hidden entries' days still count correctly toward
 * matching/`otherCount` — they're just not displayed as their own line.
 * `dayTypeParts` is empty (not a blank placeholder line) whenever there's
 * nothing to show — every legend entry excluded, or `hideSummary` set — so
 * callers can omit the line entirely instead of rendering it blank.
 */
export function buildSummaryModel(model: ReportModel, options: SummaryOptions = {}): SummaryModel {
  const valueLabel = options.valueLabel?.trim() || "value";
  const legend = options.legend ?? [];

  const dayTypeParts: SummaryPart[] = [];

  if (!options.hideSummary) {
    if (legend.length > 0) {
      const allDays = model.weeks.flatMap((week) => week.days);
      const totalDaysInRange =
        Math.round(
          (parseUTCDate(model.endDate).getTime() - parseUTCDate(model.startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1;
      const { counts, otherCount } = computeDayTypeCounts(allDays, legend, totalDaysInRange);

      legend.forEach((entry) => {
        if (entry.includeInSummary === false) return;
        dayTypeParts.push({ label: entry.label, value: counts[entry.label] ?? 0 });
      });
      if (otherCount > 0) {
        dayTypeParts.push({ label: "Other", value: otherCount });
      }
    } else {
      dayTypeParts.push({ label: "Days logged", value: model.summary.totalDays });
    }
  }

  const total: SummaryPart | null =
    options.hideTotalValue || options.hideAllValues
      ? null
      : { label: `Total ${valueLabel}`, value: model.summary.totalValue };

  return { dayTypeParts, total };
}
