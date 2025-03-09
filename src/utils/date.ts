import moment from 'moment';

export class DateHelper {
  private static instance: DateHelper;
  private momentFormat: string;

  private constructor(momentFormat: string) {
    this.momentFormat = momentFormat;
  }

  static getInstance(momentFormat = "YYYY-MM-DD"): DateHelper {
    if (!DateHelper.instance) {
      DateHelper.instance = new DateHelper(momentFormat);
    }
    return DateHelper.instance;
  }

  isValidDate(dateString: string): boolean {
    return moment(dateString, this.momentFormat, true).isValid();
  }

  static getDayOfYear(date: Date): number {
    return moment(date).dayOfYear();
  }

  static getShiftedWeekdays(weekdays: string[], weekStartDay: number): string[] {
    if (weekStartDay < 0 || weekStartDay > 6) {
      throw new Error('weekStartDay must be between 0 and 6');
    }

    return weekdays.slice(weekStartDay).concat(weekdays.slice(0, weekStartDay));
  }

  getFirstDayOfYear(year: number): Date {
    return moment.utc({ year, month: 0, day: 1 }).toDate();
  }

  getNumberOfEmptyDaysBeforeYearStarts(year: number, weekStartDay: number): number {
    if (isNaN(weekStartDay) || weekStartDay < 0 || weekStartDay > 6) {
      throw new Error('weekStartDay must be a number between 0 and 6');
    }

    if (isNaN(year)) {
      throw new Error('year must be a number');
    }

    const firstDayOfYear = moment.utc({ year, month: 0, day: 1 });
    const firstWeekday = firstDayOfYear.day();
    return (firstWeekday - weekStartDay + 7) % 7;
  }

  getLastDayOfYear(year: number): Date {
    return moment.utc({ year, month: 11, day: 31 }).toDate();
  }

  isToday(day: number): boolean {
    return day === moment().dayOfYear();
  }

  static formatDateToISO8601(date: Date | string | null): string | null {
    return date instanceof Date ? moment.utc(date).format('YYYY-MM-DD') : null;
  }

  getFullYear(date: string): number {
    return moment.utc(date, this.momentFormat).year();
  }

  static getCurrentFullYear(): number {
    return moment().year();
  }
}