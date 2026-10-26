import {
  ReportDay,
  ReportModel,
  daysInRange,
} from "src/utils/report/reportModel";
import { EMPTY_CELL_COLOR, escapeHtml } from "src/utils/report/heatmapHtml";
import { normalizeColor } from "src/utils/report/legendMatch";
import { LegendDisplayMode, LegendEntry } from "src/types";
import i18n from "src/localization/i18n";

export type { LegendEntry } from "src/types";

export interface DayTypeCount {
  entry: LegendEntry;
  count: number;
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

/** Strips float noise from summed fractional counts (0.1 + 0.2), nothing more. */
function roundCount(count: number): number {
  return Math.round(count * 100) / 100;
}

/**
 * A day's usable `countAs` shares: trimmed, non-blank labels with a finite,
 * non-zero count. Shares go through `Number()` because data that failed
 * validation is still rendered as-is. A day with none of these is counted by
 * its color as usual — so `{ "Sick Leave": page.sick_leave }` on a note
 * without that property doesn't make the day vanish from the breakdown.
 */
function countAsShares(day: ReportDay): SummaryPart[] {
  return Object.entries(day.countAs ?? {}).flatMap(([label, share]) => {
    const value = Number(share);
    return label.trim() !== "" && Number.isFinite(value) && value !== 0
      ? [{ label: label.trim(), value }]
      : [];
  });
}

/**
 * Totals every day's `countAs` shares by label (case-insensitive, trimmed),
 * keeping each label as first written, in the order first seen.
 */
export function sumCountAs(days: ReportDay[]): SummaryPart[] {
  const totals = new Map<string, SummaryPart>();
  days.forEach((day) => {
    countAsShares(day).forEach(({ label, value }) => {
      const key = normalizeLabel(label);
      const total = totals.get(key);
      if (total) total.value += value;
      else totals.set(key, { label, value });
    });
  });
  return [...totals.values()].map((total) => ({
    ...total,
    value: roundCount(total.value),
  }));
}

/**
 * Days per legend entry, in legend order, matched by color (case-insensitive,
 * trimmed) rather than label, since several entries can share a blank label.
 * Days matching no entry go to `otherCount`. The range's days with nothing
 * logged count toward the `EMPTY_CELL_COLOR` entry. A day with `countAs`
 * shares is left out (see `sumCountAs`) but still counts as logged.
 */
export function computeDayTypeCounts(
  days: ReportDay[],
  legend: LegendEntry[],
  totalDaysInRange = days.length,
): { counts: DayTypeCount[]; otherCount: number } {
  const countByColor = new Map(
    legend.map((entry) => [normalizeColor(entry.color), 0]),
  );

  let otherCount = 0;
  days.forEach((day) => {
    if (countAsShares(day).length > 0) return;
    const normalized = day.color ? normalizeColor(day.color) : undefined;
    if (normalized !== undefined && countByColor.has(normalized)) {
      countByColor.set(normalized, (countByColor.get(normalized) ?? 0) + 1);
    } else {
      otherCount += 1;
    }
  });

  const blank = normalizeColor(EMPTY_CELL_COLOR);
  const blankCount = countByColor.get(blank);
  if (blankCount !== undefined) {
    const unlogged = Math.max(0, totalDaysInRange - days.length);
    countByColor.set(blank, blankCount + unlogged);
  }

  const counts: DayTypeCount[] = legend.map((entry) => ({
    entry,
    count: countByColor.get(normalizeColor(entry.color)) ?? 0,
  }));

  return { counts, otherCount };
}

/**
 * A category's visibility, cycled by the legend editor's eye button: "shown"
 * (legend and summary, the default), "summaryHidden" (legend only) or
 * "hidden" (neither). There is no "counted but not shown" state; it would
 * mean nothing to a reader of the report.
 */
export type LegendVisibility = "shown" | "summaryHidden" | "hidden";

export function getLegendVisibility(entry: LegendEntry): LegendVisibility {
  if (entry.includeInLegend === false) return "hidden";
  if (entry.includeInSummary === false) return "summaryHidden";
  return "shown";
}

/** Mutates `entry` so `getLegendVisibility(entry) === visibility` afterwards. */
export function setLegendVisibility(
  entry: LegendEntry,
  visibility: LegendVisibility,
): void {
  entry.includeInSummary = visibility === "shown" ? undefined : false;
  entry.includeInLegend = visibility === "hidden" ? false : undefined;
}

/** shown -> summaryHidden -> hidden -> shown -> ... */
export function nextLegendVisibility(
  visibility: LegendVisibility,
): LegendVisibility {
  if (visibility === "shown") return "summaryHidden";
  if (visibility === "summaryHidden") return "hidden";
  return "shown";
}

const SWATCH_SIZE = 10;

const swatchHtml = (color: string) =>
  `<span style="display:inline-block;width:${SWATCH_SIZE}px;height:${SWATCH_SIZE}px;border-radius:2px;background-color:${escapeHtml(
    color,
  )};"></span>`;

const legendItemHtml = (entry: LegendEntry) =>
  `<div style="display:flex;align-items:center;gap:4px;">${swatchHtml(entry.color)}` +
  `<span style="font-size:0.85em;">${escapeHtml(entry.label)}</span></div>`;

const isListed = (entry: LegendEntry) =>
  entry.label.trim() !== "" && entry.includeInLegend !== false;

/**
 * The legend as a swatch + label list under the heatmap. Inline-styled, like
 * the grid, so Obsidian's theme CSS can't restyle it inside a Markdown note.
 * Unlabeled entries (kept only so their color still counts) and entries
 * hidden from the legend are skipped.
 */
export function buildLegendHtml(legend: LegendEntry[]): string {
  const items = legend.filter(isListed).map(legendItemHtml).join("");
  if (!items) return "";

  return `<div style="display:flex;flex-wrap:wrap;gap:12px;margin:8px 0 16px;">${items}</div>`;
}

/**
 * The gradient-mode legend: one strip of every palette color, low→high in
 * `colorsList` order whatever the legend's order, with the shared label
 * beside it. The strip sits where the first palette entry sits in `legend`,
 * so moving the gradient row in the editor moves it in the export; every
 * other listed color is its own item. The strip is left out when every
 * palette entry is hidden from the legend.
 */
export function buildGradientLegendHtml(
  colorsList: string[],
  gradientLabel: string,
  legend: LegendEntry[] = [],
): string {
  const blankNormalized = normalizeColor(EMPTY_CELL_COLOR);
  const intensityColors = colorsList.filter(
    (color) => normalizeColor(color) !== blankNormalized,
  );
  const paletteColors = new Set(intensityColors.map(normalizeColor));

  const paletteEntries = legend.filter((entry) =>
    paletteColors.has(normalizeColor(entry.color)),
  );
  const gradientHidden =
    paletteEntries.length > 0 &&
    paletteEntries.every((entry) => entry.includeInLegend === false);

  let gradientItem = "";
  if (intensityColors.length > 0 && !gradientHidden) {
    const swatches = intensityColors.map(swatchHtml).join("");
    const label = gradientLabel.trim();

    gradientItem =
      `<div style="display:flex;align-items:center;gap:8px;">` +
      `<div style="display:flex;gap:2px;">${swatches}</div>` +
      (label
        ? `<span style="font-size:0.85em;">${escapeHtml(label)}</span>`
        : "") +
      `</div>`;
  }

  const items: string[] = [];
  let gradientInserted = false;
  legend.forEach((entry) => {
    if (paletteColors.has(normalizeColor(entry.color))) {
      if (!gradientInserted && gradientItem) {
        items.push(gradientItem);
        gradientInserted = true;
      }
      return;
    }
    if (isListed(entry)) items.push(legendItemHtml(entry));
  });
  // No palette entry in `legend` to place it by: the strip still shows, last.
  if (!gradientInserted && gradientItem) items.push(gradientItem);

  if (items.length === 0) return "";

  return `<div style="display:flex;flex-wrap:wrap;gap:12px;margin:8px 0 16px;align-items:center;">${items.join("")}</div>`;
}

export interface SummaryPart {
  label: string;
  value: number;
}

export interface SummaryOptions {
  valueLabel?: string;
  legend?: LegendEntry[];
  /** Default "separate". In "gradient" mode the `colorsList` colors combine into one part, `gradientLabel`. */
  legendMode?: LegendDisplayMode;
  gradientLabel?: string;
  colorsList?: string[];
  /** Omits the day breakdown, "Days logged" included. */
  hideSummary?: boolean;
  hideTotalValue?: boolean;
  /** Omits every value part, the total included. */
  hideAllValues?: boolean;
}

export interface SummaryModel {
  /** Day-type parts, e.g. "Workday: 22", "Other: 1". */
  dayTypeParts: SummaryPart[];
  /** The "Total <value label>" part, or null when hidden. */
  total: SummaryPart | null;
}

/**
 * The report's summary: a day-type breakdown and a total.
 * - With a legend: one part per shown, labeled entry. In gradient mode the
 *   palette colors combine into one part, each count scaled by its
 *   `countWeight`. Days matching no entry go to "Other", shown when non-zero.
 *   Hidden entries still claim their days; they just get no line.
 * - A day with `countAs` shares skips its color: each share joins the shown
 *   part with the same label (a palette color's own label names the gradient
 *   part), is dropped if that category is hidden, or becomes a new part.
 * - Without a legend: a flat "Days logged" count, and `countAs` is ignored,
 *   since its shares would only restate days already counted there.
 * `dayTypeParts` is empty, not a blank line, when there is nothing to show.
 */
export function buildSummaryModel(
  model: ReportModel,
  options: SummaryOptions = {},
): SummaryModel {
  const valueLabel =
    options.valueLabel?.trim() || i18n.t("report.valueLabelPlaceholder");
  const otherLabel = i18n.t("report.document.other");
  const legend = options.legend ?? [];
  const legendMode = options.legendMode ?? "separate";

  const dayTypeParts: SummaryPart[] = [];

  if (!options.hideSummary) {
    if (legend.length > 0) {
      const allDays = model.weeks.flatMap((week) => week.days);
      const totalDaysInRange = daysInRange(model.startDate, model.endDate);
      const { counts, otherCount } = computeDayTypeCounts(
        allDays,
        legend,
        totalDaysInRange,
      );
      // Where a `countAs` share lands besides a part carrying its exact label
      // (see the merge below): `aliases` maps other names for a part onto it,
      // `hiddenLabels` holds categories the user hid from the summary, whose
      // shares are dropped with them rather than resurfacing as a new line.
      const aliases = new Map<string, SummaryPart>();
      const hiddenLabels = new Set<string>();
      legend.forEach((entry) => {
        if (entry.includeInSummary === false && entry.label.trim() !== "") {
          hiddenLabels.add(normalizeLabel(entry.label));
        }
      });

      if (legendMode === "gradient") {
        const paletteColors = new Set(
          (options.colorsList ?? []).map(normalizeColor),
        );
        const gradientLabel = options.gradientLabel?.trim();

        let gradientTotal = 0;
        let anyPaletteIncluded = false;
        // The combined part goes where the first palette entry sits in the
        // legend, so it follows the gradient row's place in the editor.
        let gradientPosition = -1;
        const parts: SummaryPart[] = [];

        counts.forEach(({ entry, count }) => {
          const isPaletteColor = paletteColors.has(normalizeColor(entry.color));
          if (isPaletteColor) {
            if (gradientPosition === -1) gradientPosition = parts.length;
            if (entry.includeInSummary === false) return;
            anyPaletteIncluded = true;
            gradientTotal += count * (entry.countWeight ?? 1);
          } else {
            if (entry.includeInSummary === false) return;
            if (entry.label.trim() === "") return;
            parts.push({ label: entry.label, value: count });
          }
        });
        gradientTotal = roundCount(gradientTotal);

        // With every palette color hidden the line goes, not shows a zero.
        if (gradientLabel && anyPaletteIncluded) {
          const insertAt =
            gradientPosition === -1 ? parts.length : gradientPosition;
          const gradientPart = { label: gradientLabel, value: gradientTotal };
          parts.splice(insertAt, 0, gradientPart);
          // A palette color's own label (left over from separate mode, say)
          // names the combined line it folds into here.
          counts.forEach(({ entry }) => {
            if (
              paletteColors.has(normalizeColor(entry.color)) &&
              entry.includeInSummary !== false &&
              entry.label.trim() !== ""
            ) {
              aliases.set(normalizeLabel(entry.label), gradientPart);
            }
          });
        } else if (gradientLabel && gradientPosition !== -1) {
          // Every palette color is hidden, so the combined line is too.
          hiddenLabels.add(normalizeLabel(gradientLabel));
        }
        dayTypeParts.push(...parts);
      } else {
        counts.forEach(({ entry, count }) => {
          if (entry.includeInSummary === false) return;
          if (entry.label.trim() === "") return;
          dayTypeParts.push({ label: entry.label, value: count });
        });
      }

      // Days with their own `countAs` shares were left out of the color
      // counts above; their shares join the line of the same label, so half
      // a day of leave lands on the same "Annual Leave" line as the
      // full-day leave counted by color. Shares are never `countWeight`ed.
      let other = otherCount;
      sumCountAs(allDays).forEach((share) => {
        const key = normalizeLabel(share.label);
        const part =
          dayTypeParts.find((p) => normalizeLabel(p.label) === key) ??
          aliases.get(key);
        if (part) {
          part.value = roundCount(part.value + share.value);
        } else if (hiddenLabels.has(key)) {
          return;
        } else if (key === "other" || key === normalizeLabel(otherLabel)) {
          other += share.value;
        } else {
          dayTypeParts.push(share);
        }
      });
      other = roundCount(other);

      if (other > 0) {
        dayTypeParts.push({ label: otherLabel, value: other });
      }
    } else {
      dayTypeParts.push({
        label: i18n.t("report.document.daysLogged"),
        value: model.summary.totalDays,
      });
    }
  }

  const total: SummaryPart | null =
    options.hideTotalValue || options.hideAllValues
      ? null
      : {
          label: i18n.t("report.document.total", { valueLabel }),
          value: model.summary.totalValue,
        };

  return { dayTypeParts, total };
}
