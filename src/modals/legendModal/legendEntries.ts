import {
  LegendEntry,
  LegendVisibility,
  getLegendVisibility,
} from "src/utils/report/legend";
import { normalizeColor } from "src/utils/report/legendMatch";
import { EMPTY_CELL_COLOR } from "src/utils/report/heatmapHtml";

export type LegendDisplayMode = "separate" | "gradient";

export function isBlankColor(color: string): boolean {
  return normalizeColor(color) === normalizeColor(EMPTY_CELL_COLOR);
}

export const VISIBILITY_ICON: Record<LegendVisibility, string> = {
  shown: "eye",
  summaryHidden: "eye-off",
  hidden: "eye-closed",
};

export const VISIBILITY_TITLE: Record<LegendVisibility, string> = {
  shown: "Shown in legend and summary - click to hide from summary",
  summaryHidden: "Shown in legend only, not summary - click to hide entirely",
  hidden: "Hidden entirely - click to show again",
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
 *
 * `baseline` is every color used ANYWHERE in the calendar, not just the
 * export's current range (`buildRefreshBaseline`), so a color only drops out
 * once it no longer appears at all.
 */
export function mergeLegendWithDefaults(
  entries: LegendEntry[],
  defaults: LegendEntry[],
): LegendEntry[] {
  const isInDefaults = (color: string) =>
    defaults.some((d) => normalizeColor(d.color) === normalizeColor(color));
  const kept = entries.filter((entry) => isInDefaults(entry.color));
  const keptColors = new Set(kept.map((entry) => normalizeColor(entry.color)));
  const added = defaults.filter(
    (d) => !keptColors.has(normalizeColor(d.color)),
  );
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
    .map((color) =>
      entries.find(
        (entry) => normalizeColor(entry.color) === normalizeColor(color),
      ),
    )
    .filter((entry): entry is LegendEntry => entry !== undefined);
}

/**
 * Moves `dragged` (one entry for a normal row, or every palette-color entry
 * at once for the gradient group row) to sit immediately before the first
 * entry of `target` that isn't itself part of `dragged` — matching the
 * drop-target highlight's own documented behavior ("dropping lands the
 * dragged row(s) just before this one"). A no-op (returns `entries`
 * unchanged) when `dragged` and `target` overlap at all (dropped on itself).
 * Works by entry identity, not index, so it applies equally whether one row
 * or an entire contiguous block is moving.
 */
export function reorderLegendEntries(
  entries: LegendEntry[],
  dragged: LegendEntry[],
  target: LegendEntry[],
): LegendEntry[] {
  const draggedSet = new Set(dragged);
  if (target.some((entry) => draggedSet.has(entry))) return entries;

  const rest = entries.filter((entry) => !draggedSet.has(entry));
  const anchor = target.find((entry) => rest.includes(entry));
  const insertIndex = anchor ? rest.indexOf(anchor) : rest.length;

  return [
    ...rest.slice(0, insertIndex),
    ...dragged,
    ...rest.slice(insertIndex),
  ];
}
