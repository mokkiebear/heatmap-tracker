import { Entry } from "src/types";
import {
  formatDateToISO8601,
  getFirstDayOfYear,
  getLastDayOfYear,
  getToday,
} from "src/utils/date";
import { computeDataRange } from "src/utils/report/reportModel";

export interface DateSpan {
  start: string;
  end: string;
}

/** A `DateSpan` from two dates, blank when either fails to format. */
export function span(start: Date, end: Date): DateSpan {
  return {
    start: formatDateToISO8601(start) ?? "",
    end: formatDateToISO8601(end) ?? "",
  };
}

/**
 * Defaults to the heatmap's active date range if one is configured
 * (monthsToShow/daysToShow/startDate+endDate); otherwise defaults to the
 * span actually covered by logged data (not the full calendar year, which
 * would mostly be empty for a partial year of logs); falls back to the full
 * year only when there's no data at all.
 */
export function defaultRange(
  currentYear: number,
  dateRange: { start: Date; end: Date } | null,
  entriesByDate: Record<string, Entry>,
): DateSpan {
  if (dateRange) return span(dateRange.start, dateRange.end);

  const dataRange = computeDataRange(entriesByDate);
  if (dataRange) return dataRange;

  return span(getFirstDayOfYear(currentYear), getLastDayOfYear(currentYear));
}

export interface RangePreset {
  key: string;
  span: () => DateSpan | null;
}

/**
 * Date-relative presets anchor to the real current date, not the heatmap's
 * (possibly year-navigated) `currentYear` — "last year"/"last month" only
 * make sense relative to today.
 */
export function buildPresets(
  entriesByDate: Record<string, Entry>,
): RangePreset[] {
  return [
    {
      key: "presetAllLoggedData",
      span: () => computeDataRange(entriesByDate),
    },
    {
      key: "presetLastYear",
      span: () => {
        const lastYear = getToday().getUTCFullYear() - 1;
        return span(getFirstDayOfYear(lastYear), getLastDayOfYear(lastYear));
      },
    },
    {
      key: "presetYearToDate",
      span: () => {
        const today = getToday();
        return span(getFirstDayOfYear(today.getUTCFullYear()), today);
      },
    },
    {
      key: "presetLastMonth",
      span: () => {
        const today = getToday();
        return span(
          new Date(
            Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1),
          ),
          new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0)),
        );
      },
    },
    {
      key: "presetMonthToDate",
      span: () => {
        const today = getToday();
        return span(
          new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)),
          today,
        );
      },
    },
  ];
}
