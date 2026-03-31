export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function getDayOfYear(date: Date): number {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);

  const current = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );

  const diff = current - startOfYear;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function getShiftedWeekdays(weekdays: string[], weekStartDay: number): string[] {
  if (weekStartDay < 0 || weekStartDay > 6) {
    throw new Error('weekStartDay must be between 0 and 6');
  }

  return weekdays.slice(weekStartDay).concat(weekdays.slice(0, weekStartDay));
}

export function getFirstDayOfYear(year: number): Date {
  return new Date(Date.UTC(year, 0, 1));
}

export function getNumberOfEmptyDaysBeforeYearStarts(year: number, weekStartDay: number): number {
  if (isNaN(weekStartDay) || weekStartDay < 0 || weekStartDay > 6) {
    throw new Error('weekStartDay must be a number between 0 and 6');
  }

  if (isNaN(year)) {
    throw new Error('year must be a number');
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
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function formatDateToISO8601(date: Date | null): string | null {
  if (date === null || date === undefined) {
    return null;
  }

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getFullYear(date: string) {
  return new Date(date).getUTCFullYear();
}

export function getCurrentFullYear() {
  return new Date().getUTCFullYear();
}

export function isSameDate(d1: Date, d2: Date): boolean {
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  );
}

export function parseUTCDate(dateStr: string): Date {
  const match = dateStr.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
  }
  const date = new Date(dateStr);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
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

export function resolveDateRange(
  startDate?: string,
  endDate?: string,
  daysToShow?: number,
  monthsToShow?: number,
): DateRange | null {
  if (monthsToShow !== undefined && monthsToShow >= 0) {
    const today = getToday();
    const endOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
    const startOfRange = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - monthsToShow, 1));
    return { start: startOfRange, end: endOfMonth };
  }

  if (daysToShow !== undefined && daysToShow > 0) {
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