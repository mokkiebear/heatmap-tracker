import { ColorsList, Entry } from "src/types";
import { parseUTCDate } from "src/utils/date";
import { EMPTY_CELL_COLOR } from "src/utils/report/heatmapHtml";
import { LegendEntry } from "src/utils/report/legend";
import { normalizeColor } from "src/utils/report/legendMatch";
import {
  ReportModel,
  buildReportModel,
  computeDataRange,
} from "src/utils/report/reportModel";

/**
 * Every color the calendar can ever show — every configured intensity color
 * (in their natural low→high order), then any other custom colors actually
 * used in the current range but outside that palette, then the blank/
 * no-entry color last. There's no manual "Add row" anymore (see
 * `LegendModal`), so this is the complete, automatic source of truth for
 * what the legend editor offers.
 *
 * A color not currently used in this range defaults to excluded from the
 * summary/gradient total (and so, per `buildSummaryModel`/`buildLegendHtml`,
 * hidden from the rendered legend/summary too) until the user explicitly
 * turns it back on — otherwise a freshly auto-populated legend would
 * immediately clutter the export with zero-count categories that have never
 * actually happened yet. The blank color follows the same rule based on
 * whether the range has any gap (unlogged) days at all.
 */
export function buildDefaultLegendEntries(
  model: ReportModel | null,
  colorsList: ColorsList,
): LegendEntry[] {
  const usedColors = new Set<string>();
  let loggedDayCount = 0;
  model?.weeks.forEach((week) =>
    week.days.forEach((day) => {
      loggedDayCount += 1;
      if (day.color) usedColors.add(day.color);
    }),
  );

  const extraCustomColors = [...usedColors].filter(
    (color) => !colorsList.includes(color),
  );
  const totalDaysInRange = model
    ? Math.round(
        (parseUTCDate(model.endDate).getTime() -
          parseUTCDate(model.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1
    : 0;
  const hasBlankDays = totalDaysInRange > loggedDayCount;

  return [...colorsList, ...extraCustomColors, EMPTY_CELL_COLOR].map(
    (color) => {
      const isBlank =
        normalizeColor(color) === normalizeColor(EMPTY_CELL_COLOR);
      const isUsed = isBlank ? hasBlankDays : usedColors.has(color);
      return { color, label: "", includeInSummary: isUsed ? undefined : false };
    },
  );
}

/**
 * The "Refresh" merge target — every color used ANYWHERE in `entriesByDate`
 * (already unfiltered by the export's own start/end date pickers - see
 * `ExportView`'s own `entriesByDate`, built straight from `allFilteredEntries`),
 * not just within whichever narrower range is currently selected. Without
 * this, refreshing while viewing a short range would treat a color that's
 * only used outside that range as "gone", dropping its label/weight/
 * visibility customizations instead of just leaving them dormant until the
 * range includes one of its days again. `weekStartDay` doesn't affect which
 * colors turn up, only how days would be grouped into weeks - irrelevant
 * here, so a fixed value keeps this callable without any component state.
 */
export function buildRefreshBaseline(
  entriesByDate: Record<string, Entry>,
  colorsList: ColorsList,
): LegendEntry[] {
  const fullRange = computeDataRange(entriesByDate);
  if (!fullRange) return buildDefaultLegendEntries(null, colorsList);

  const fullModel = buildReportModel({
    entriesByDate,
    colorsList,
    bodiesByPath: {},
    startDate: fullRange.start,
    endDate: fullRange.end,
    weekStartDay: 1,
  });
  return buildDefaultLegendEntries(fullModel, colorsList);
}
