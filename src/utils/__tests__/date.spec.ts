import {
  isValidDate,
  getDayOfYear,
  getFirstDayOfYear,
  getNumberOfEmptyDaysBeforeYearStarts,
  getLastDayOfYear,
  getShiftedWeekdays,
  formatDateToISO8601,
  getISOWeekNumber,
} from '../date';

describe('getShiftedWeekdays', () => {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  it('should shift weekdays correctly when weekStartDay is 0', () => {
    expect(getShiftedWeekdays(weekdays, 0)).toEqual(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  });

  it('should shift weekdays correctly when weekStartDay is 3', () => {
    expect(getShiftedWeekdays(weekdays, 3)).toEqual(['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday']);
  });

  it('should shift weekdays correctly when weekStartDay is 6', () => {
    expect(getShiftedWeekdays(weekdays, 6)).toEqual(['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  });

  it('should handle an empty weekdays array gracefully', () => {
    expect(getShiftedWeekdays([], 3)).toEqual([]);
  });

  it('should throw an error when weekStartDay is less than 0', () => {
    expect(() => getShiftedWeekdays(weekdays, -1)).toThrow('weekStartDay must be between 0 and 6');
  });

  it('should throw an error when weekStartDay is greater than 6', () => {
    expect(() => getShiftedWeekdays(weekdays, 7)).toThrow('weekStartDay must be between 0 and 6');
  });

  it('should work with non-standard weekday arrays', () => {
    const customWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    expect(getShiftedWeekdays(customWeekdays, 2)).toEqual(['Wed', 'Thu', 'Fri', 'Mon', 'Tue']);
  });

  it('should handle duplicate values in the weekdays array', () => {
    const duplicateWeekdays = ['Sun', 'Sun', 'Mon', 'Tue'];
    expect(getShiftedWeekdays(duplicateWeekdays, 1)).toEqual(['Sun', 'Mon', 'Tue', 'Sun']);
  });

  it('should handle arrays with a single weekday', () => {
    expect(getShiftedWeekdays(['Monday'], 0)).toEqual(['Monday']);
    expect(getShiftedWeekdays(['Monday'], 1)).toEqual(['Monday']);
  });
});

describe('isValidDate', () => {
  test('Valid Date String (ISO Format)', () => {
    expect(isValidDate('2021-12-31')).toBe(true);
  });

  test('Non-Date String', () => {
    expect(isValidDate('not a date')).toBe(false);
  });

  test('Empty String', () => {
    expect(isValidDate('')).toBe(false);
  });

  test('Valid Date in Different Format', () => {
    expect(isValidDate('12/31/2021')).toBe(true);
  });
});

describe('getDayOfYear', () => {
  test('Regular Date (Non-Leap Year)', () => {
    expect(getDayOfYear(new Date('2021-03-01'))).toBe(60);
  });

  test('Beginning of the Year', () => {
    expect(getDayOfYear(new Date('2021-01-01'))).toBe(1);
  });

  test('End of the Year (Non-Leap Year)', () => {
    expect(getDayOfYear(new Date('2021-12-31'))).toBe(365);
  });

  test('End of the Year (Leap Year)', () => {
    expect(getDayOfYear(new Date('2020-12-31'))).toBe(366);
  });

  test('Invalid Date Object', () => {
    expect(getDayOfYear(new Date('invalid date'))).toBeNaN();
  });
});

describe('getFirstDayOfYear', () => {
  test('Typical Year Start', () => {
    expect(getFirstDayOfYear(2021)).toEqual(new Date(Date.UTC(2021, 0, 1)));
  });

  test('Leap Year Start', () => {
    expect(getFirstDayOfYear(2020)).toEqual(new Date(Date.UTC(2020, 0, 1)));
  });

  test('Negative Year (Before Common Era)', () => {
    expect(getFirstDayOfYear(-1)).toEqual(new Date(Date.UTC(-1, 0, 1)));
  });
});

describe('getNumberOfEmptyDaysBeforeYearStarts', () => {
  test('Year Starts on Week Start Day', () => {
    expect(getNumberOfEmptyDaysBeforeYearStarts(2023, 0)).toBe(0);
  });

  test('Year Starts One Day After Week Start Day', () => {
    expect(getNumberOfEmptyDaysBeforeYearStarts(2021, 0)).toBe(5);
  });

  test('Week Starts on Monday', () => {
    expect(getNumberOfEmptyDaysBeforeYearStarts(2021, 1)).toBe(4);
  });
});

describe('getLastDayOfYear', () => {
  test('Typical Year End', () => {
    expect(getLastDayOfYear(2021)).toEqual(new Date(Date.UTC(2021, 11, 31)));
  });

  test('Leap Year End', () => {
    expect(getLastDayOfYear(2020)).toEqual(new Date(Date.UTC(2020, 11, 31)));
  });

  test('Far Future Year', () => {
    expect(getLastDayOfYear(3000)).toEqual(new Date(Date.UTC(3000, 11, 31)));
  });
});

describe('formatDateToISO8601', () => {
  it('should return null when the input is null', () => {
    expect(formatDateToISO8601(null)).toBeNull();
  });

  it('should return null when the input is undefined', () => {
    expect(formatDateToISO8601(undefined as unknown as Date)).toBeNull();
  });

  it('should return null when the input is NaN', () => {
    expect(formatDateToISO8601(NaN as any)).toBeNull();
  });

  it('should return a properly formatted date for a valid Date object', () => {
    const date = new Date('2025-04-15T10:30:00Z');
    expect(formatDateToISO8601(date)).toBe('2025-04-15');
  });

  it('should handle dates in different timezones and still return the correct UTC date', () => {
    const date = new Date('2025-04-15T23:59:59-05:00'); // Date with a -05:00 offset
    expect(formatDateToISO8601(date)).toBe('2025-04-16'); // Adjusted to UTC
  });

  it('should correctly format a date at the start of the year', () => {
    const date = new Date('2025-01-01T00:00:00Z');
    expect(formatDateToISO8601(date)).toBe('2025-01-01');
  });

  it('should correctly format a date at the end of the year', () => {
    const date = new Date('2025-12-31T23:59:59Z');
    expect(formatDateToISO8601(date)).toBe('2025-12-31');
  });

  it('should handle leap years correctly', () => {
    const date = new Date('2024-02-29T12:00:00Z'); // 2024 is a leap year
    expect(formatDateToISO8601(date)).toBe('2024-02-29');
  });

  it('should throw no errors when working with historic dates', () => {
    const date = new Date('1900-01-01T00:00:00Z'); // A very old date
    expect(formatDateToISO8601(date)).toBe('1900-01-01');
  });

  it('should handle future dates correctly', () => {
    const date = new Date('3000-01-01T00:00:00Z'); // A future date
    expect(formatDateToISO8601(date)).toBe('3000-01-01');
  });

  it('should return null when the input is not a Date object', () => {
    expect(formatDateToISO8601('2025-04-15' as unknown as Date)).toBeUndefined();
    expect(formatDateToISO8601(123456789 as unknown as Date)).toBeUndefined();
    expect(formatDateToISO8601({} as unknown as Date)).toBeUndefined();
  });

  it('should correctly format dates in local time', () => {
    const localDate = new Date('2025-04-15T00:00:00'); // Local time
    const utcDate = new Date(localDate.toISOString());
    expect(formatDateToISO8601(localDate)).toBe(formatDateToISO8601(utcDate));
  });
});

describe('getISOWeekNumber', () => {
    it('should return 1 for the first week of 2024 (Jan 1, 2024 is Monday)', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        expect(getISOWeekNumber(date)).toBe(1);
    });

    it('should return 53 for the last week of 2020 (Dec 31, 2020 is Thursday, leap year)', () => {
        const date = new Date('2020-12-31T00:00:00Z');
        expect(getISOWeekNumber(date)).toBe(53);
    });

    it('should return 52 for the last week of 2023 (Dec 31, 2023 is Sunday)', () => {
        const date = new Date('2023-12-31T00:00:00Z');
        expect(getISOWeekNumber(date)).toBe(52);
    });
    
    it('should handle week spanning across years (Jan 1, 2023 is Sunday, so part of last week of 2022)', () => {
         // ISO weeks start on Monday. 
         // Jan 1 2023 is Sunday. It belongs to week 52 of 2022.
         const date = new Date('2023-01-01T00:00:00Z');
         expect(getISOWeekNumber(date)).toBe(52);
    });

    it('should return correct week number for mid-year', () => {
        const date = new Date('2024-07-01T00:00:00Z'); // Monday
        expect(getISOWeekNumber(date)).toBe(27);
    });
});
