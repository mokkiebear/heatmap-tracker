export function isValidDate(dateString: string): boolean {
  return !isNaN(parseUTCDate(dateString).getTime());
}

export function getDayOfYear(date: Date): number {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);

  const current = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );

  const diff = current - startOfYear;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function getISOWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function assertWeekStartDay(weekStartDay: number): void {
  if (!Number.isInteger(weekStartDay) || weekStartDay < 0 || weekStartDay > 6) {
    throw new Error("weekStartDay must be between 0 and 6");
  }
}

export function getShiftedWeekdays(
  weekdays: string[],
  weekStartDay: number,
): string[] {
  assertWeekStartDay(weekStartDay);

  return weekdays.slice(weekStartDay).concat(weekdays.slice(0, weekStartDay));
}

export function getFirstDayOfYear(year: number): Date {
  return new Date(Date.UTC(year, 0, 1));
}

export function getNumberOfEmptyDaysBeforeYearStarts(
  year: number,
  weekStartDay: number,
): number {
  assertWeekStartDay(weekStartDay);

  // Bounded to what `formatDateToISO8601` can represent; without an upper bound
  // a year like 1e21 produces an Invalid Date and NaN padding downstream.
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new Error("year must be a number between 1 and 9999");
  }

  const firstDayOfYear = getFirstDayOfYear(year);
  const firstWeekday = firstDayOfYear.getUTCDay();
  return (firstWeekday - weekStartDay + 7) % 7;
}

export function getLastDayOfYear(year: number): Date {
  return new Date(Date.UTC(year, 11, 31));
}

export function getToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function formatDateToISO8601(date: Date | null): string | null {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }

  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getFullYear(date: string) {
  return parseUTCDate(date).getUTCFullYear();
}

export function getCurrentFullYear() {
  return new Date().getFullYear();
}

export function isSameDate(d1: Date, d2: Date): boolean {
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  );
}

const MONTH_NAMES: Readonly<Record<string, number>> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/**
 * Builds a UTC date from calendar components, rejecting components that don't
 * survive a round-trip. `Date.UTC` rolls overflow forward (Feb 30 becomes
 * March 1), which would land a typo'd date on an unrelated box.
 */
function makeUTCDate(year: number, month: number, day: number): Date {
  const date = new Date(Date.UTC(year, month, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return new Date(NaN);
  }

  return date;
}

/**
 * Parses a user-written entry date into UTC midnight of the calendar day the
 * user actually wrote.
 *
 * Every accepted format is matched explicitly here rather than being handed to
 * `new Date(string)`. Outside of the ISO format the spec mandates, `new Date`
 * is engine-defined: V8 (desktop Obsidian / Electron) accepts `"01-31-2025"`
 * and `"Jan 5, 2024"`, while JavaScriptCore (Obsidian on iOS) returns Invalid
 * Date for some of them. The same note then rendered a populated heatmap on
 * desktop and an empty one on mobile (#29). Parsing in-house makes the result
 * identical on both platforms.
 *
 * Accepted:
 * - `YYYY-MM-DD` / `YYYY/M/D`, optionally followed by a time — the calendar
 *   date wins over any time or offset.
 * - `MM-DD-YYYY` / `MM/DD/YYYY` / `MM.DD.YYYY` — month first, matching what
 *   desktop used to do. If the first component can't be a month but the second
 *   can (`31-01-2025`), it's read as day-first instead.
 * - `Jan 5, 2024`, `5 Jan 2024`, `January 5 2024` — English month names.
 *
 * Anything else returns an Invalid Date, on every platform.
 */
export function parseUTCDate(dateStr: string): Date {
  // Entry dates reach this from unvalidated user data, so a missing one is a
  // real input, not a type violation.
  if (!dateStr || typeof dateStr !== "string") {
    return new Date(NaN);
  }

  const input = dateStr.trim();

  // `YYYY-MM-DD`, anywhere in the string, so a full timestamp
  // ("2025-04-15T23:59:59-05:00") is read as the day the user wrote.
  const isoMatch = input.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (isoMatch) {
    return makeUTCDate(
      parseInt(isoMatch[1], 10),
      parseInt(isoMatch[2], 10) - 1,
      parseInt(isoMatch[3], 10),
    );
  }

  // Year-last numeric: `MM-DD-YYYY` and friends.
  const yearLastMatch = input.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (yearLastMatch) {
    const first = parseInt(yearLastMatch[1], 10);
    const second = parseInt(yearLastMatch[2], 10);
    const year = parseInt(yearLastMatch[3], 10);

    // Month-first by default (what V8 did, so existing desktop notes keep
    // rendering the same way), but `31-01-2025` can only be day-first.
    const dayFirst = first > 12 && second <= 12;

    return dayFirst
      ? makeUTCDate(year, second - 1, first)
      : makeUTCDate(year, first - 1, second);
  }

  // `Jan 5, 2024` / `January 5 2024`
  const monthFirstMatch = input.match(
    /^([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/i,
  );
  if (monthFirstMatch) {
    const month = MONTH_NAMES[monthFirstMatch[1].slice(0, 3).toLowerCase()];
    if (month === undefined) {
      return new Date(NaN);
    }

    return makeUTCDate(
      parseInt(monthFirstMatch[3], 10),
      month,
      parseInt(monthFirstMatch[2], 10),
    );
  }

  // `5 Jan 2024` / `5th January, 2024`
  const dayFirstMatch = input.match(
    /^(\d{1,2})(?:st|nd|rd|th)?\.?\s+([a-z]{3,9})\.?,?\s+(\d{4})$/i,
  );
  if (dayFirstMatch) {
    const month = MONTH_NAMES[dayFirstMatch[2].slice(0, 3).toLowerCase()];
    if (month === undefined) {
      return new Date(NaN);
    }

    return makeUTCDate(
      parseInt(dayFirstMatch[3], 10),
      month,
      parseInt(dayFirstMatch[1], 10),
    );
  }

  return new Date(NaN);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Resolves the four date-range params (`startDate`/`endDate`, `daysToShow`,
 * `monthsToShow`) into a single {@link DateRange}. This is the single place
 * that decides which param wins when more than one is set — nothing else in
 * the codebase should re-implement this precedence.
 *
 * Precedence (highest to lowest):
 * 1. `monthsToShow` — current month plus N previous months.
 * 2. `daysToShow` — last N days ending today.
 * 3. `startDate` + `endDate` — explicit range (both required, `start` <= `end`).
 *
 * Returns `null` when none of the params resolve to a valid range, in which
 * case callers fall back to showing the full `year`.
 */
export function resolveDateRange(
  startDate?: string,
  endDate?: string,
  daysToShow?: number,
  monthsToShow?: number,
): DateRange | null {
  if (
    monthsToShow !== undefined &&
    Number.isInteger(monthsToShow) &&
    monthsToShow >= 0
  ) {
    const today = getToday();
    const endOfMonth = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0),
    );
    const startOfRange = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - monthsToShow, 1),
    );
    return { start: startOfRange, end: endOfMonth };
  }

  if (
    daysToShow !== undefined &&
    Number.isInteger(daysToShow) &&
    daysToShow > 0
  ) {
    const today = getToday();
    return {
      start: addDays(today, -(daysToShow - 1)),
      end: today,
    };
  }

  if (startDate && endDate) {
    const start = parseUTCDate(startDate);
    const end = parseUTCDate(endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
      return { start, end };
    }
  }

  return null;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** A single calendar period the user can page through (see `layout`). */
export type CalendarPeriod = "month" | "week";

/** The whole calendar month or week containing `date`. */
export function getCalendarPeriodRange(
  date: Date,
  period: CalendarPeriod,
  weekStartDay: number,
): DateRange {
  if (period === "week") {
    assertWeekStartDay(weekStartDay);

    const start = addDays(date, -((date.getUTCDay() - weekStartDay + 7) % 7));
    return { start, end: addDays(start, 6) };
  }

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return {
    start: new Date(Date.UTC(year, month, 1)),
    end: new Date(Date.UTC(year, month + 1, 0)),
  };
}

/**
 * A date inside the period `delta` periods away from the one containing
 * `date`. Month steps land on the 1st on purpose: keeping the day-of-month
 * would make Jan 31 + 1 month overflow into March.
 */
export function shiftCalendarPeriod(
  date: Date,
  period: CalendarPeriod,
  delta: number,
): Date {
  return period === "week"
    ? addDays(date, delta * 7)
    : new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
}
