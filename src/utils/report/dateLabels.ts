import { parseUTCDate } from "src/utils/date";

/** e.g. "Mon, Jul 13, 2026" — used for specific tracked days, where the weekday is informative. */
export function formatDayLabel(dateStr: string): string {
  return parseUTCDate(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** e.g. "Jul 13, 2026" — used for week/range boundaries, where the weekday is redundant. */
export function formatWeekLabel(dateStr: string): string {
  return parseUTCDate(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * e.g. "Jul 13, 2026" — for the "Report generated" timestamp specifically.
 * Unlike `formatWeekLabel`/`formatDayLabel` (which format *stored* log dates
 * and must stay pinned to UTC to avoid shifting them), this formats the
 * actual moment the report was generated, so it should reflect the viewer's
 * own local calendar date rather than UTC's.
 */
export function formatGeneratedAt(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
