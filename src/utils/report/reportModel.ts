import { ColorsList, Entry, LegendEntry } from "src/types";
import { addDays, formatDateToISO8601, parseUTCDate } from "src/utils/date";
import { resolveDisplayValue } from "src/utils/report/legendMatch";

export interface ReportDay {
  date: string;
  weekday: number;
  value?: number;
  color?: string;
  body?: string;
}

export interface ReportWeek {
  weekStart: string;
  days: ReportDay[];
}

export interface ReportSummary {
  totalDays: number;
  totalValue: number;
  activeWeeks: number;
}

export interface ReportModel {
  startDate: string;
  endDate: string;
  weeks: ReportWeek[];
  summary: ReportSummary;
}

export interface BuildReportModelParams {
  /** Entries keyed by ISO date, already color/intensity-mapped (see fillEntriesWithIntensityByDate). */
  entriesByDate: Record<string, Entry>;
  colorsList: ColorsList;
  /** Note body text (frontmatter stripped) keyed by vault-relative file path. */
  bodiesByPath: Record<string, string>;
  startDate: string;
  endDate: string;
  weekStartDay: number;
  /** When a day's color matches an entry with `valueOverride` set, that fixed value replaces the day's own raw value. */
  legend?: LegendEntry[];
}

/** The Date (UTC midnight) of the first day of the week containing `date`. */
export function getWeekStartDate(date: Date, weekStartDay: number): Date {
  const diff = (date.getUTCDay() - weekStartDay + 7) % 7;
  return addDays(date, -diff);
}

/** The earliest/latest ISO date among entries that actually have logged data. */
export function computeDataRange(
  entriesByDate: Record<string, Entry>,
): { start: string; end: string } | null {
  const dates = Object.keys(entriesByDate).sort();
  if (dates.length === 0) return null;
  return { start: dates[0], end: dates[dates.length - 1] };
}

/**
 * Builds the report's day-by-day/week-by-week data from already-resolved
 * entries and note bodies. Days without an entry are skipped (a blank day
 * means nothing was logged); weeks with no days are likewise omitted. Pure
 * function — no Obsidian dependency, callers resolve entries/bodies first.
 */
export function buildReportModel({
  entriesByDate,
  colorsList,
  bodiesByPath,
  startDate,
  endDate,
  weekStartDay,
  legend = [],
}: BuildReportModelParams): ReportModel {
  const start = parseUTCDate(startDate);
  const end = parseUTCDate(endDate);

  const weeks: ReportWeek[] = [];
  const weekByKey = new Map<string, ReportWeek>();

  let totalDays = 0;
  let totalValue = 0;

  for (let date = start; date.getTime() <= end.getTime(); date = addDays(date, 1)) {
    const dateKey = formatDateToISO8601(date);
    if (!dateKey) continue;

    const entry = entriesByDate[dateKey];
    if (!entry) continue;

    const color =
      entry.customColor ??
      (entry.intensity !== undefined ? colorsList[entry.intensity - 1] : undefined);
    const value = resolveDisplayValue(entry.value, color, legend);
    const body = entry.filePath
      ? bodiesByPath[entry.filePath]
      : typeof entry.content === "string"
        ? entry.content
        : undefined;

    const day: ReportDay = {
      date: dateKey,
      weekday: date.getUTCDay(),
      value,
      color,
      body,
    };

    totalDays += 1;
    totalValue += value ?? 0;

    const weekStartKey =
      formatDateToISO8601(getWeekStartDate(date, weekStartDay)) ?? dateKey;

    let week = weekByKey.get(weekStartKey);
    if (!week) {
      week = { weekStart: weekStartKey, days: [] };
      weekByKey.set(weekStartKey, week);
      weeks.push(week);
    }
    week.days.push(day);
  }

  return {
    startDate,
    endDate,
    weeks,
    summary: {
      totalDays,
      totalValue,
      activeWeeks: weeks.length,
    },
  };
}
