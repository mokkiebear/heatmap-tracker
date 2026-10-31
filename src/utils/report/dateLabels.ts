import i18n from "src/localization/i18n";
import { parseUTCDate } from "src/utils/date";

// All three follow the plugin language.
const DATE: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

/** e.g. "Mon, Jul 13, 2026", for a tracked day, where the weekday helps. */
export function formatDayLabel(dateStr: string): string {
  return parseUTCDate(dateStr).toLocaleDateString(i18n.language, {
    ...DATE,
    weekday: "short",
    timeZone: "UTC",
  });
}

/** e.g. "Jul 13, 2026", for week and range boundaries. */
export function formatWeekLabel(dateStr: string): string {
  return parseUTCDate(dateStr).toLocaleDateString(i18n.language, {
    ...DATE,
    timeZone: "UTC",
  });
}

/**
 * e.g. "Jul 13, 2026", for when the report was generated. A moment, not a
 * stored log date, so it is the viewer's local date rather than UTC's.
 */
export function formatGeneratedAt(date: Date): string {
  return date.toLocaleDateString(i18n.language, DATE);
}
