import { ColorsList, Entry, LegendEntry } from "src/types";
import { addDays, formatDateToISO8601, parseUTCDate } from "src/utils/date";
import { getEntryColor } from "src/utils/colors";
import { resolveDisplayValue } from "src/utils/report/legendMatch";

export interface ReportDay {
  date: string;
  weekday: number;
  value?: number;
  color?: string;
  body?: string;
  /** `body` rendered by Obsidian's Markdown renderer (math, code, callouts); the HTML report prefers it over `body`. */
  bodyHtml?: string;
  /** The entry's own `countAs` shares, which replace its color-based day count in the summary (see `buildSummaryModel`). */
  countAs?: Entry["countAs"];
}

export interface ReportWeek {
  weekStart: string;
  days: ReportDay[];
}

export interface ReportSummary {
  totalDays: number;
  totalValue: number;
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
  /** Rendered HTML for the same notes, keyed by path (see renderBodiesToHtml). */
  bodyHtmlByPath?: Record<string, string>;
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

/** Calendar days from `start` to `end` (ISO dates), both included. */
export function daysInRange(start: string, end: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return (
    Math.round(
      (parseUTCDate(end).getTime() - parseUTCDate(start).getTime()) / msPerDay,
    ) + 1
  );
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
 * The report's days, grouped by week, from already-resolved entries and note
 * bodies. Days with nothing logged, and weeks with no such days, are left out.
 */
export function buildReportModel({
  entriesByDate,
  colorsList,
  bodiesByPath,
  bodyHtmlByPath = {},
  startDate,
  endDate,
  weekStartDay,
  legend = [],
}: BuildReportModelParams): ReportModel {
  const start = parseUTCDate(startDate);
  const end = parseUTCDate(endDate);

  const weeks: ReportWeek[] = [];
  let totalDays = 0;
  let totalValue = 0;

  for (
    let date = start;
    date.getTime() <= end.getTime();
    date = addDays(date, 1)
  ) {
    const dateKey = formatDateToISO8601(date) as string;
    const entry = entriesByDate[dateKey];
    if (!entry) continue;

    const color = getEntryColor(entry, colorsList);
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
      bodyHtml: entry.filePath ? bodyHtmlByPath[entry.filePath] : undefined,
      countAs: entry.countAs,
    };

    totalDays += 1;
    totalValue += value ?? 0;

    const weekStart = formatDateToISO8601(
      getWeekStartDate(date, weekStartDay),
    ) as string;
    const lastWeek = weeks[weeks.length - 1];
    if (lastWeek?.weekStart === weekStart) lastWeek.days.push(day);
    else weeks.push({ weekStart, days: [day] });
  }

  return { startDate, endDate, weeks, summary: { totalDays, totalValue } };
}
