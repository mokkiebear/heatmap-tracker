import { DateHelper } from '../date'; // Adjust the import path if needed

const dateHelper = DateHelper.getInstance(); // Singleton instance

describe('getShiftedWeekdays', () => {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  it('should shift weekdays correctly when weekStartDay is 0', () => {
    expect(DateHelper.getShiftedWeekdays(weekdays, 0)).toEqual(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  });

  it('should shift weekdays correctly when weekStartDay is 3', () => {
    expect(DateHelper.getShiftedWeekdays(weekdays, 3)).toEqual(['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday']);
  });

  it('should shift weekdays correctly when weekStartDay is 6', () => {
    expect(DateHelper.getShiftedWeekdays(weekdays, 6)).toEqual(['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  });

  it('should handle an empty weekdays array gracefully', () => {
    expect(DateHelper.getShiftedWeekdays([], 3)).toEqual([]);
  });

  it('should throw an error when weekStartDay is less than 0', () => {
    expect(() => DateHelper.getShiftedWeekdays(weekdays, -1)).toThrow('weekStartDay must be between 0 and 6');
  });

  it('should throw an error when weekStartDay is greater than 6', () => {
    expect(() => DateHelper.getShiftedWeekdays(weekdays, 7)).toThrow('weekStartDay must be between 0 and 6');
  });

  it('should work with non-standard weekday arrays', () => {
    const customWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    expect(DateHelper.getShiftedWeekdays(customWeekdays, 2)).toEqual(['Wed', 'Thu', 'Fri', 'Mon', 'Tue']);
  });

  it('should handle duplicate values in the weekdays array', () => {
    const duplicateWeekdays = ['Sun', 'Sun', 'Mon', 'Tue'];
    expect(DateHelper.getShiftedWeekdays(duplicateWeekdays, 1)).toEqual(['Sun', 'Mon', 'Tue', 'Sun']);
  });

  it('should handle arrays with a single weekday', () => {
    expect(DateHelper.getShiftedWeekdays(['Monday'], 0)).toEqual(['Monday']);
    expect(DateHelper.getShiftedWeekdays(['Monday'], 1)).toEqual(['Monday']);
  });
});

describe('isValidDate', () => {
  test('Valid Date String (ISO Format)', () => {
    expect(dateHelper.isValidDate('2021-12-31')).toBe(true);
  });

  test('Non-Date String', () => {
    expect(dateHelper.isValidDate('not a date')).toBe(false);
  });

  test('Empty String', () => {
    expect(dateHelper.isValidDate('')).toBe(false);
  });
});

describe('getDayOfYear', () => {
  test('Regular Date (Non-Leap Year)', () => {
    expect(DateHelper.getDayOfYear(new Date('2021-03-01'))).toBe(60);
  });

  test('Beginning of the Year', () => {
    expect(DateHelper.getDayOfYear(new Date('2021-01-01'))).toBe(1);
  });

  test('End of the Year (Non-Leap Year)', () => {
    expect(DateHelper.getDayOfYear(new Date('2021-12-31'))).toBe(365);
  });

  test('End of the Year (Leap Year)', () => {
    expect(DateHelper.getDayOfYear(new Date('2020-12-31'))).toBe(366);
  });

  test('Invalid Date Object', () => {
    expect(DateHelper.getDayOfYear(new Date('invalid date'))).toBeNaN();
  });
});

describe('getFirstDayOfYear', () => {
  test('Typical Year Start', () => {
    expect(dateHelper.getFirstDayOfYear(2021)).toEqual(new Date(Date.UTC(2021, 0, 1)));
  });

  test('Leap Year Start', () => {
    expect(dateHelper.getFirstDayOfYear(2020)).toEqual(new Date(Date.UTC(2020, 0, 1)));
  });

  test('Negative Year (Before Common Era)', () => {
    expect(dateHelper.getFirstDayOfYear(-1)).toEqual(new Date(Date.UTC(-1, 0, 1)));
  });
});

describe('getNumberOfEmptyDaysBeforeYearStarts', () => {
  test('Year Starts on Week Start Day', () => {
    expect(dateHelper.getNumberOfEmptyDaysBeforeYearStarts(2023, 0)).toBe(0);
  });

  test('Year Starts One Day After Week Start Day', () => {
    expect(dateHelper.getNumberOfEmptyDaysBeforeYearStarts(2021, 0)).toBe(5);
  });

  test('Week Starts on Monday', () => {
    expect(dateHelper.getNumberOfEmptyDaysBeforeYearStarts(2021, 1)).toBe(4);
  });
});

describe('getLastDayOfYear', () => {
  test('Typical Year End', () => {
    expect(dateHelper.getLastDayOfYear(2021)).toEqual(new Date(Date.UTC(2021, 11, 31)));
  });

  test('Leap Year End', () => {
    expect(dateHelper.getLastDayOfYear(2020)).toEqual(new Date(Date.UTC(2020, 11, 31)));
  });

  test('Far Future Year', () => {
    expect(dateHelper.getLastDayOfYear(3000)).toEqual(new Date(Date.UTC(3000, 11, 31)));
  });
});

describe('formatDateToISO8601', () => {
  it('should return null when the input is null', () => {
    expect(DateHelper.formatDateToISO8601(null)).toBeNull();
  });

  it('should return null when the input is undefined', () => {
    expect(DateHelper.formatDateToISO8601(undefined as unknown as Date)).toBeNull();
  });

  it('should return null when the input is NaN', () => {
    expect(DateHelper.formatDateToISO8601(NaN as any)).toBeNull();
  });

  it('should return a properly formatted date for a valid Date object', () => {
    const date = new Date('2025-04-15T10:30:00Z');
    expect(DateHelper.formatDateToISO8601(date)).toBe('2025-04-15');
  });

  it('should handle dates in different timezones and still return the correct UTC date', () => {
    const date = new Date('2025-04-15T23:59:59-05:00'); // Date with a -05:00 offset
    expect(DateHelper.formatDateToISO8601(date)).toBe('2025-04-16'); // Adjusted to UTC
  });

  it('should correctly format a date at the start of the year', () => {
    const date = new Date('2025-01-01T00:00:00Z');
    expect(DateHelper.formatDateToISO8601(date)).toBe('2025-01-01');
  });

  it('should correctly format a date at the end of the year', () => {
    const date = new Date('2025-12-31T23:59:59Z');
    expect(DateHelper.formatDateToISO8601(date)).toBe('2025-12-31');
  });

  it('should handle leap years correctly', () => {
    const date = new Date('2024-02-29T12:00:00Z'); // 2024 is a leap year
    expect(DateHelper.formatDateToISO8601(date)).toBe('2024-02-29');
  });

  it('should throw no errors when working with historic dates', () => {
    const date = new Date('1900-01-01T00:00:00Z'); // A very old date
    expect(DateHelper.formatDateToISO8601(date)).toBe('1900-01-01');
  });

  it('should handle future dates correctly', () => {
    const date = new Date('3000-01-01T00:00:00Z'); // A future date
    expect(DateHelper.formatDateToISO8601(date)).toBe('3000-01-01');
  });

  it('should return null when the input is not a Date object', () => {
    expect(DateHelper.formatDateToISO8601({} as unknown as Date)).toBeNull();
  });

  it('should correctly format dates in local time', () => {
    const localDate = new Date('2025-04-15T00:00:00'); // Local time
    const utcDate = new Date(localDate.toISOString());
    expect(DateHelper.formatDateToISO8601(localDate)).toBe(DateHelper.formatDateToISO8601(utcDate));
  });
});

describe('isToday', () => {
  it('should return true for today\'s day of the year', () => {
    const todaysDay = DateHelper.getDayOfYear(new Date());
    expect(dateHelper.isToday(todaysDay)).toBe(true);
  });

  it('should return false for yesterday\'s day of the year', () => {
    const todaysDay = DateHelper.getDayOfYear(new Date());
    expect(dateHelper.isToday(todaysDay - 1)).toBe(false);
  });

  it('should return false for tomorrow\'s day of the year', () => {
    const todaysDay = DateHelper.getDayOfYear(new Date());
    expect(dateHelper.isToday(todaysDay + 1)).toBe(false);
  });

  it('should return false for null input', () => {
    expect(dateHelper.isToday(null as unknown as number)).toBe(false);
  });

  it('should return false for undefined input', () => {
    expect(dateHelper.isToday(undefined as unknown as number)).toBe(false);
  });

  it('should return false for NaN input', () => {
    expect(dateHelper.isToday(NaN)).toBe(false);
  });

  it('should return false for negative day numbers', () => {
    expect(dateHelper.isToday(-1)).toBe(false);
  });

  it('should return false for day numbers greater than 366', () => {
    expect(dateHelper.isToday(367)).toBe(false);
  });

  it('should handle leap years correctly', () => {
    const leapYearDate = new Date('2024-02-29');
    const dayOfYear = DateHelper.getDayOfYear(leapYearDate);
    expect(dateHelper.isToday(dayOfYear)).toBe(false); // Only true if tested on Feb 29, 2024
  });

  it('should handle dates in different timezones', () => {
    const utcDate = new Date('2025-01-01T00:00:00Z'); // Jan 1 in UTC
    const localDay = DateHelper.getDayOfYear(utcDate);
    expect(dateHelper.isToday(localDay)).toBe(false); // Only true if local time matches UTC
  });
});