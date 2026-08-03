import { ReportDay, ReportModel } from "src/utils/report/reportModel";
import { EMPTY_CELL_COLOR, escapeHtml } from "src/utils/report/heatmapHtml";
import { normalizeColor } from "src/utils/report/legendMatch";
import { parseUTCDate } from "src/utils/date";
import { LegendEntry } from "src/types";

export type { LegendEntry } from "src/types";

export interface DayTypeCount {
  entry: LegendEntry;
  count: number;
}

/**
 * Matches each day's already-resolved color against the legend (case-
 * insensitive, trimmed). Days with no color, or a color not in the legend,
 * fall into `otherCount`. Blank days (no entry at all — never present in
 * `days`) are counted against whichever legend entry uses `EMPTY_CELL_COLOR`,
 * when `totalDaysInRange` is given.
 *
 * Counted by color internally (not by label) and returned as one
 * `{entry, count}` pair per input entry, in input order — legend entries are
 * frequently auto-populated with a blank label before the user customizes
 * them (see `LegendModal`), so multiple entries sharing the same (blank)
 * label must not collide into a single counted bucket the way keying by
 * label would cause.
 */
export function computeDayTypeCounts(
  days: ReportDay[],
  legend: LegendEntry[],
  totalDaysInRange?: number,
): { counts: DayTypeCount[]; otherCount: number } {
  const countByColor = new Map<string, number>();
  legend.forEach((entry) => {
    countByColor.set(normalizeColor(entry.color), 0);
  });

  let otherCount = 0;
  days.forEach((day) => {
    const normalized = day.color ? normalizeColor(day.color) : undefined;
    if (normalized !== undefined && countByColor.has(normalized)) {
      countByColor.set(normalized, (countByColor.get(normalized) ?? 0) + 1);
    } else {
      otherCount += 1;
    }
  });

  if (totalDaysInRange !== undefined) {
    const blankNormalized = normalizeColor(EMPTY_CELL_COLOR);
    if (countByColor.has(blankNormalized)) {
      countByColor.set(
        blankNormalized,
        (countByColor.get(blankNormalized) ?? 0) + Math.max(0, totalDaysInRange - days.length),
      );
    }
  }

  const counts: DayTypeCount[] = legend.map((entry) => ({
    entry,
    count: countByColor.get(normalizeColor(entry.color)) ?? 0,
  }));

  return { counts, otherCount };
}

/**
 * A category's three-state legend/summary visibility, cycled by the eye
 * button in `LegendModal` (unrelated to whether its color is a true
 * intensity-palette color, which is a separate "does it belong to the
 * gradient" concern — see `LegendModal.paletteEntriesInOrder`):
 * - "shown": appears in both the legend and the summary count (default).
 * - "summaryHidden": still appears in the legend, but its count is omitted
 *   from the summary line.
 * - "hidden": omitted from both entirely.
 * There's deliberately no fourth "counted but not shown" state — that
 * wouldn't make sense to a reader of the exported report.
 */
export type LegendVisibility = "shown" | "summaryHidden" | "hidden";

export function getLegendVisibility(entry: LegendEntry): LegendVisibility {
  if (entry.includeInLegend === false) return "hidden";
  if (entry.includeInSummary === false) return "summaryHidden";
  return "shown";
}

/** Mutates `entry` so `getLegendVisibility(entry) === visibility` afterwards. */
export function setLegendVisibility(entry: LegendEntry, visibility: LegendVisibility): void {
  if (visibility === "shown") {
    entry.includeInSummary = undefined;
    entry.includeInLegend = undefined;
  } else if (visibility === "summaryHidden") {
    entry.includeInSummary = false;
    entry.includeInLegend = undefined;
  } else {
    entry.includeInSummary = false;
    entry.includeInLegend = false;
  }
}

/** shown -> summaryHidden -> hidden -> shown -> ... */
export function nextLegendVisibility(visibility: LegendVisibility): LegendVisibility {
  if (visibility === "shown") return "summaryHidden";
  if (visibility === "summaryHidden") return "hidden";
  return "shown";
}

/**
 * Renders the legend as a small swatch+label list, for embedding under the
 * heatmap. Fully inline-styled (no `<style>` block / class-based CSS) for
 * the same reason as the grid itself — robust against Obsidian's own theme
 * CSS when embedded raw in a Markdown note. Entries left without a label
 * (kept in `legend` only so their color still matches/counts correctly — see
 * `LegendModal`) are skipped here, since there'd be nothing to show next to
 * the swatch — as is any entry explicitly hidden from the legend entirely
 * (`getLegendVisibility(entry) === "hidden"`).
 */
export function buildLegendHtml(legend: LegendEntry[]): string {
  const labeled = legend.filter((entry) => entry.label.trim() !== "" && entry.includeInLegend !== false);
  if (labeled.length === 0) return "";

  const items = labeled
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

/**
 * Renders the gradient-mode legend: a GitHub-contribution-graph-style swatch
 * strip covering every configured intensity color, low-to-high (including
 * ones not currently used in this range), with the shared label beside it,
 * vertically centered against the strip. (Earlier versions also tried
 * captioning the strip with "Less"/"More" underneath, but there was no font
 * size small enough to fit both words under as few as two swatches without
 * either truncating or overlapping - dropped rather than keep chasing a size
 * that doesn't reliably exist.) The swatches themselves always render in
 * `colorsList`'s own given order (the palette's true low-to-high intensity
 * order) regardless of `legend`'s order - that part is never reordered.
 *
 * `legend` is the FULL legend array (not pre-filtered) so this can place the
 * combined gradient item at the same position its palette colors actually
 * occupy there, exactly mirroring `LegendModal.renderGradientGroupRow`'s own
 * squashing - dragging the gradient group row before/after another category
 * now actually changes the exported legend's order too, not just the
 * editor's own display. Every matched color that ISN'T a true intensity-
 * palette color (the blank/background color, or a custom color used on
 * individual days outside the palette) renders as its own swatch+label item
 * at its own position, in the same flex row as the gradient strip. The whole
 * gradient item (strip + label) is omitted entirely when every palette-color
 * entry has been explicitly hidden (`includeInLegend: false` on all of
 * them - see the gradient group row's own eye button, which always applies
 * to every palette color at once); with no legend info at all for the
 * palette colors, it defaults to shown, like any other color would.
 */
export function buildGradientLegendHtml(
  colorsList: string[],
  gradientLabel: string,
  legend: LegendEntry[] = [],
): string {
  const SWATCH_SIZE = 10;
  const SWATCH_GAP = 2;

  const blankNormalized = normalizeColor(EMPTY_CELL_COLOR);
  const intensityColors = colorsList.filter((color) => normalizeColor(color) !== blankNormalized);
  const paletteColors = new Set(intensityColors.map(normalizeColor));

  const paletteEntries = legend.filter((entry) => paletteColors.has(normalizeColor(entry.color)));
  const gradientHidden =
    paletteEntries.length > 0 && paletteEntries.every((entry) => entry.includeInLegend === false);

  let gradientItem = "";
  if (intensityColors.length > 0 && !gradientHidden) {
    const swatches = intensityColors
      .map(
        (color) =>
          `<span style="display:inline-block;width:${SWATCH_SIZE}px;height:${SWATCH_SIZE}px;border-radius:2px;background-color:${escapeHtml(
            color,
          )};"></span>`,
      )
      .join("");
    const label = gradientLabel.trim();

    gradientItem =
      `<div style="display:flex;align-items:center;gap:8px;">` +
      `<div style="display:flex;gap:${SWATCH_GAP}px;">${swatches}</div>` +
      (label ? `<span style="font-size:0.85em;">${escapeHtml(label)}</span>` : "") +
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
    if (entry.label.trim() === "" || entry.includeInLegend === false) return;
    items.push(
      `<div style="display:flex;align-items:center;gap:4px;">` +
        `<span style="display:inline-block;width:${SWATCH_SIZE}px;height:${SWATCH_SIZE}px;border-radius:2px;background-color:${escapeHtml(
          entry.color,
        )};"></span>` +
        `<span style="font-size:0.85em;">${escapeHtml(entry.label)}</span></div>`,
    );
  });
  // No palette-color entries turned up in `legend` at all (e.g. an empty
  // legend, or the caller genuinely just wants the strip) - append rather
  // than lose it entirely.
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
  /**
   * "separate" (default): one summary part per non-blank legend entry.
   * "gradient": every entry whose color is actually in `colorsList` (the
   * configured intensity palette) is combined into one part labeled
   * `gradientLabel`; any other matched color — the blank/background color,
   * or a custom color used on individual days outside the palette — stays
   * its own independent part either way.
   */
  legendMode?: "separate" | "gradient";
  /** Shared label for the combined gradient part, when legendMode is "gradient". */
  gradientLabel?: string;
  /** The configured intensity palette — determines which colors count toward the gradient's combined total when legendMode is "gradient". */
  colorsList?: string[];
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
 * With a legend: one part per non-blank legend entry with
 * `includeInSummary !== false` in "separate" mode, or in "gradient" mode,
 * one combined part for every entry whose color is actually in
 * `colorsList` (the true intensity palette) — any other matched color (the
 * blank/background color, or a custom color used on individual days outside
 * the palette) always stays its own independent part instead, in both
 * modes (+ "Other" for unmatched days — always shown when non-zero,
 * regardless of which specific entries are hidden). In gradient mode, each
 * palette entry's day count is scaled by its own `countWeight` (default 1)
 * before being summed — e.g. a lighter "half day" color set to 0.5
 * contributes half a day per match instead of a full one; independent
 * parts are never weighted. Without a legend: falls back to a flat "Days
 * logged" count. Hidden entries' days still count correctly toward
 * matching/`otherCount`/the gradient total — they're just not displayed as
 * their own line. `dayTypeParts` is empty (not a blank placeholder line)
 * whenever there's nothing to show — every legend entry excluded, or
 * `hideSummary` set — so callers can omit the line entirely instead of
 * rendering it blank.
 */
export function buildSummaryModel(model: ReportModel, options: SummaryOptions = {}): SummaryModel {
  const valueLabel = options.valueLabel?.trim() || "value";
  const legend = options.legend ?? [];
  const legendMode = options.legendMode ?? "separate";

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

      if (legendMode === "gradient") {
        const paletteColors = new Set((options.colorsList ?? []).map(normalizeColor));
        const gradientLabel = options.gradientLabel?.trim();

        let gradientTotal = 0;
        let anyPaletteIncluded = false;
        // Where the combined part gets spliced in, once totalling is done -
        // the position of the first palette-color entry actually encountered
        // in `counts` (which follows the legend's own array order), so
        // dragging the gradient group row before/after other categories (see
        // `LegendModal.renderGradientGroupRow`) actually changes where the
        // combined line lands, instead of it always being hardcoded first.
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
            // Not a true intensity-palette color — the blank/background
            // color, or a custom color used on individual days outside the
            // palette — stays its own independent line instead of folding
            // into the combined total.
            parts.push({ label: entry.label, value: count });
          }
        });
        // Guards against float noise from non-power-of-2 weights (e.g. 0.3),
        // not against any real precision need — a handful of summed terms.
        gradientTotal = Math.round(gradientTotal * 100) / 100;

        // Omitted entirely (not shown as "0") when nothing actually
        // contributes - e.g. every palette color has been toggled to
        // summary-hidden/fully-hidden via the gradient group row's eye
        // button - mirroring how an individual excluded entry drops its
        // whole line in separate mode, rather than showing a zero.
        if (gradientLabel && anyPaletteIncluded) {
          const insertAt = gradientPosition === -1 ? parts.length : gradientPosition;
          parts.splice(insertAt, 0, { label: gradientLabel, value: gradientTotal });
        }
        dayTypeParts.push(...parts);
      } else {
        counts.forEach(({ entry, count }) => {
          if (entry.includeInSummary === false) return;
          if (entry.label.trim() === "") return;
          dayTypeParts.push({ label: entry.label, value: count });
        });
      }
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
