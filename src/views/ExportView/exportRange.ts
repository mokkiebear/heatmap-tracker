import { Entry, RangeBound, RangeRule, RangeUnit } from "src/types";
import {
  addDays,
  formatDateToISO8601,
  getFirstDayOfYear,
  getLastDayOfYear,
  parseUTCDate,
} from "src/utils/date";
import {
  computeDataRange,
  getWeekStartDate,
} from "src/utils/report/reportModel";

export interface DateSpan {
  start: string;
  end: string;
}

/** A `DateSpan` from two dates, blank when either fails to format. */
function span(start: Date, end: Date): DateSpan {
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

const MONTHS_PER_UNIT = { month: 1, quarter: 3, year: 12 } as const;

/** The first day of the period `offset` periods after the one holding `today`. */
function periodStart(
  today: Date,
  unit: RangeUnit,
  weekStartDay: number,
  offset: number,
): Date {
  if (unit === "day") return addDays(today, offset);
  if (unit === "week") {
    return addDays(getWeekStartDate(today, weekStartDay), 7 * offset);
  }
  const months = MONTHS_PER_UNIT[unit];
  const month = today.getUTCMonth();
  return new Date(
    Date.UTC(
      today.getUTCFullYear(),
      month - (month % months) + months * offset,
      1,
    ),
  );
}

export const isPeriodsAgo = (bound: number) =>
  Number.isInteger(bound) && bound >= 0;

/**
 * A range's first or last day: the fixed date, or the start or end of the
 * period `bound` ago, where the current period ends today.
 */
function boundDate(
  bound: RangeBound,
  end: "from" | "to",
  {
    unit,
    today,
    weekStartDay,
  }: { unit: RangeUnit; today: Date; weekStartDay: number },
): Date | null {
  if (typeof bound === "string") {
    const date = parseUTCDate(bound);
    return isNaN(date.getTime()) ? null : date;
  }
  if (!isPeriodsAgo(bound)) return null;
  if (end === "from") return periodStart(today, unit, weekStartDay, -bound);
  if (bound === 0) return today;
  return addDays(periodStart(today, unit, weekStartDay, 1 - bound), -1);
}

/**
 * The range a preset rule covers as of `today`, or null when it isn't a
 * valid range (a bad date, or a start after the end). Relative ends anchor to
 * the real current date, not the heatmap's (possibly year-navigated) year.
 */
export function resolveRangeRule(
  rule: RangeRule,
  context: {
    today: Date;
    weekStartDay: number;
    entriesByDate: Record<string, Entry>;
  },
): DateSpan | null {
  if (rule.kind === "logged") {
    return computeDataRange(context.entriesByDate);
  }

  const bounds = { ...context, unit: rule.unit };
  const start = boundDate(rule.from, "from", bounds);
  const end = boundDate(rule.to, "to", bounds);
  if (!start || !end || start > end) return null;
  return span(start, end);
}
