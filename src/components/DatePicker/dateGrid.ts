import { formatDateToISO8601, getDaysInMonth, getToday, parseUTCDate } from "src/utils/date";

export interface DateParts {
  year: number;
  /** 0-indexed, matching `Date`'s own convention. */
  month: number;
  day: number;
}

export interface DayCell {
  iso: string;
  day: number;
  /** False for the previous/next month's overflow days that pad out the grid. */
  inMonth: boolean;
}

export function toISO(year: number, month: number, day: number): string {
  return formatDateToISO8601(new Date(Date.UTC(year, month, day))) as string;
}

/** Lenient parse for a value this component already produced itself (see `toISO`). */
export function parseISO(iso: string): DateParts | null {
  if (!iso) return null;
  const date = parseUTCDate(iso);
  if (isNaN(date.getTime())) return null;
  return { year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDate() };
}

/**
 * Strict parse for a user-typed value: only a well-formed `yyyy-mm-dd`, and
 * only when it's a real calendar date (rejects `2026-02-30` etc. instead of
 * letting `Date`'s own rollover silently turn it into a different date).
 */
export function parseTypedISO(text: string): string | null {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return toISO(year, month - 1, day);
}

export function todayParts(): DateParts {
  const today = getToday();
  return { year: today.getUTCFullYear(), month: today.getUTCMonth(), day: today.getUTCDate() };
}

/**
 * A 6-week (42-cell) day grid for `year`/`month`, padded with the
 * previous/next month's overflow days. The leading blank count is based on
 * `weekStartDay` (not always Sunday), so the grid's columns match whatever
 * week-start convention the rest of the report is using.
 */
export function buildDayGrid(year: number, month: number, weekStartDay: number): DayCell[] {
  const cells: DayCell[] = [];

  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const leadingBlanks = (firstWeekday - weekStartDay + 7) % 7;
  const daysThisMonth = getDaysInMonth(year, month);

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysPrevMonth = getDaysInMonth(prevYear, prevMonth);

  for (let i = leadingBlanks - 1; i >= 0; i--) {
    const day = daysPrevMonth - i;
    cells.push({ iso: toISO(prevYear, prevMonth, day), day, inMonth: false });
  }
  for (let day = 1; day <= daysThisMonth; day++) {
    cells.push({ iso: toISO(year, month, day), day, inMonth: true });
  }

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ iso: toISO(nextYear, nextMonth, nextDay), day: nextDay, inMonth: false });
    nextDay++;
  }

  return cells;
}
