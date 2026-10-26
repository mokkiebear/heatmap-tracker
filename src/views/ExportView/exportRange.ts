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

function startOfUnit(date: Date, unit: RangeUnit, weekStartDay: number): Date {
  switch (unit) {
    case "day":
      return date;
    case "week":
      return getWeekStartDate(date, weekStartDay);
    case "month":
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    case "quarter": {
      const month = date.getUTCMonth();
      return new Date(Date.UTC(date.getUTCFullYear(), month - (month % 3), 1));
    }
    case "year":
      return getFirstDayOfYear(date.getUTCFullYear());
  }
}

const MONTHS_PER_UNIT = { month: 1, quarter: 3, year: 12 } as const;

/** Moves a period's first day (from `startOfUnit`) by `count` periods. */
function shiftByUnits(periodStart: Date, unit: RangeUnit, count: number): Date {
  if (unit === "day") return addDays(periodStart, count);
  if (unit === "week") return addDays(periodStart, 7 * count);

  const month = periodStart.getUTCMonth() + MONTHS_PER_UNIT[unit] * count;
  return new Date(Date.UTC(periodStart.getUTCFullYear(), month, 1));
}

export const isPeriodsAgo = (bound: number) =>
  Number.isInteger(bound) && bound >= 0;

function parseFixedDate(value: string): Date | null {
  const date = parseUTCDate(value);
  return isNaN(date.getTime()) ? null : date;
}

interface BoundContext {
  unit: RangeUnit;
  today: Date;
  weekStartDay: number;
}

/** A range's first day: the start of the period `bound` ago, or the fixed date. */
function boundStart(
  bound: RangeBound,
  { unit, today, weekStartDay }: BoundContext,
): Date | null {
  if (typeof bound === "string") return parseFixedDate(bound);
  if (!isPeriodsAgo(bound)) return null;
  return shiftByUnits(startOfUnit(today, unit, weekStartDay), unit, -bound);
}

/** A range's last day: today for the current period, the end of the period `bound` ago, or the fixed date. */
function boundEnd(
  bound: RangeBound,
  { unit, today, weekStartDay }: BoundContext,
): Date | null {
  if (typeof bound === "string") return parseFixedDate(bound);
  if (!isPeriodsAgo(bound)) return null;
  if (bound === 0) return today;
  const nextStart = shiftByUnits(
    startOfUnit(today, unit, weekStartDay),
    unit,
    1 - bound,
  );
  return addDays(nextStart, -1);
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
  const start = boundStart(rule.from, bounds);
  const end = boundEnd(rule.to, bounds);
  if (!start || !end || start > end) return null;
  return span(start, end);
}
