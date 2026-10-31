import { ColorsList, Entry } from "src/types";
import { getEntryColor } from "src/utils/colors";
import { EMPTY_CELL_COLOR } from "src/utils/report/heatmapHtml";
import { LegendEntry } from "src/utils/report/legend";
import { computeDataRange, daysInRange } from "src/utils/report/reportModel";

/**
 * The legend editor's starting rows and its Refresh/Reset target: every color
 * the calendar can show, i.e. the palette low→high, then custom colors in use,
 * then the blank color. Built from all logged data rather than the export's
 * selected range, so a color used only outside that range keeps its row and
 * customizations. A color not in use (for the blank color: no gap days)
 * starts out excluded from the summary, so a fresh legend doesn't fill the
 * export with zero counts.
 */
export function buildRefreshBaseline(
  entriesByDate: Record<string, Entry>,
  colorsList: ColorsList,
): LegendEntry[] {
  const dates = Object.keys(entriesByDate).sort();
  const usedColors = new Set(
    dates
      .map((date) => getEntryColor(entriesByDate[date], colorsList))
      .filter((color): color is string => Boolean(color)),
  );
  const range = computeDataRange(entriesByDate);
  const hasBlankDays =
    range !== null && daysInRange(range.start, range.end) > dates.length;
  const customColors = [...usedColors].filter(
    (color) => !colorsList.includes(color),
  );

  return [...colorsList, ...customColors, EMPTY_CELL_COLOR].map((color) => {
    const isUsed =
      color === EMPTY_CELL_COLOR ? hasBlankDays : usedColors.has(color);
    return { color, label: "", includeInSummary: isUsed ? undefined : false };
  });
}
