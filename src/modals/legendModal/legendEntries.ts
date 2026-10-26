import i18n from "src/localization/i18n";
import {
  LegendEntry,
  LegendVisibility,
  getLegendVisibility,
} from "src/utils/report/legend";
import { matchLegendEntry, normalizeColor } from "src/utils/report/legendMatch";
import { EMPTY_CELL_COLOR } from "src/utils/report/heatmapHtml";

export function isBlankColor(color: string): boolean {
  return normalizeColor(color) === normalizeColor(EMPTY_CELL_COLOR);
}

export const VISIBILITY_ICON: Record<LegendVisibility, string> = {
  shown: "eye",
  summaryHidden: "eye-off",
  hidden: "eye-closed",
};

export const VISIBILITY_TITLE: Record<LegendVisibility, () => string> = {
  shown: () => i18n.t("report.legendEditor.shown"),
  summaryHidden: () => i18n.t("report.legendEditor.summaryHidden"),
  hidden: () => i18n.t("report.legendEditor.hidden"),
};

/** The shared visibility if every entry agrees, otherwise "shown" as a neutral starting point for the next click. */
export function aggregateVisibility(entries: LegendEntry[]): LegendVisibility {
  const visibilities = entries.map(getLegendVisibility);
  const first = visibilities[0] ?? "shown";
  return visibilities.every((v) => v === first) ? first : "shown";
}

/**
 * Merges `entries` with a default baseline, preserving their customizations
 * and relative order — appending brand-new colors and dropping ones the
 * baseline no longer has. This is the "Refresh" button's whole job.
 */
export function mergeLegendWithDefaults(
  entries: LegendEntry[],
  defaults: LegendEntry[],
): LegendEntry[] {
  const kept = entries.filter((entry) =>
    matchLegendEntry(entry.color, defaults),
  );
  const added = defaults.filter((d) => !matchLegendEntry(d.color, kept));
  return [...kept, ...added];
}

/**
 * `entries` whose color is in `colorsList` (the intensity palette), in the
 * palette's own low-to-high order rather than `entries`' possibly
 * drag-reordered one. Exactly the set gradient mode squashes into one row;
 * anything else (a per-day custom color, the blank color) keeps its own row.
 */
export function paletteEntriesInOrder(
  entries: LegendEntry[],
  colorsList: string[],
): LegendEntry[] {
  return colorsList
    .map((color) => matchLegendEntry(color, entries))
    .filter((entry): entry is LegendEntry => entry !== undefined);
}
