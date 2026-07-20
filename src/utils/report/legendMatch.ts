import { LegendEntry } from "src/types";

export function normalizeColor(color: string): string {
  return color.trim().toLowerCase();
}

/** The legend entry whose color matches (case/whitespace-insensitive), if any. */
export function matchLegendEntry(color: string | undefined, legend: LegendEntry[]): LegendEntry | undefined {
  if (!color) return undefined;
  const normalized = normalizeColor(color);
  return legend.find((entry) => normalizeColor(entry.color) === normalized);
}

/**
 * A day's reported value: the matching legend entry's fixed `valueOverride`
 * if set, otherwise the day's own raw value. Lets a category like "Leave"
 * always report as 0 hours regardless of whatever placeholder intensity its
 * entries carry for coloring purposes.
 */
export function resolveDisplayValue(
  rawValue: number | undefined,
  color: string | undefined,
  legend: LegendEntry[],
): number | undefined {
  const match = matchLegendEntry(color, legend);
  return match?.valueOverride !== undefined ? match.valueOverride : rawValue;
}
