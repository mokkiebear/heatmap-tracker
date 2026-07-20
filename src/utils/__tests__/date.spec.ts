import {
  isValidDate,
  getDayOfYear,
  getFirstDayOfYear,
  getNumberOfEmptyDaysBeforeYearStarts,
  getLastDayOfYear,
  getShiftedWeekdays,
  formatDateToISO8601,
  getISOWeekNumber,
  resolveDateRange,
  getToday,
  getCurrentFullYear,
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

  test('Date String with Weekday Suffix (e.g. Daily Notes YYYY-MM-DD-dddd format)', () => {
    expect(isValidDate('2026-06-24-Wednesday')).toBe(true);
  });

  test('Null Date', () => {
    expect(isValidDate(null as unknown as string)).toBe(false);
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
    expect(formatDateToISO8601('2025-04-15' as unknown as Date)).toBeNull();
    expect(formatDateToISO8601(123456789 as unknown as Date)).toBeNull();
    expect(formatDateToISO8601({} as unknown as Date)).toBeNull();
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

// Simulates a "now" instant whose local calendar date differs from its UTC
// calendar date (e.g. evening in a negative-UTC-offset timezone), without
// depending on the test runner's actual OS timezone. Only the argless `new
// Date()` form (what getToday/getCurrentFullYear call to read "now") is
// faked; every other Date usage (Date.UTC, `new Date(timestamp)`) is passed
// through to the real constructor so the rest of the date machinery -
// including the assertions' own date reconstruction - stays correct.
function withFakeNow(fakeNow: { local: [number, number, number]; utc: [number, number, number] }, run: () => void) {
  const RealDate = global.Date;
  const [localYear, localMonth, localDate] = fakeNow.local;
  const [utcYear, utcMonth, utcDate] = fakeNow.utc;

  class FakeNow extends RealDate {
    getFullYear() { return localYear; }
    getMonth() { return localMonth; }
    getDate() { return localDate; }
    getUTCFullYear() { return utcYear; }
    getUTCMonth() { return utcMonth; }
    getUTCDate() { return utcDate; }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockDate = function (...args: any[]) {
    if (args.length === 0) return new FakeNow();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (RealDate as any)(...args);
  };
  MockDate.UTC = RealDate.UTC;
  MockDate.now = RealDate.now;
  MockDate.parse = RealDate.parse;
  // Share the real prototype so `instanceof Date` still holds for anything
  // this mock constructs (including plain RealDate/FakeNow instances).
  MockDate.prototype = RealDate.prototype;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.Date = MockDate as any;

  try {
    run();
  } finally {
    global.Date = RealDate;
  }
}

describe('getToday', () => {
  it('uses the local calendar date, not the UTC calendar date, when they differ', () => {
    // 11:30 PM local on Jul 17 with the UTC clock already past midnight into
    // Jul 18 (e.g. evening in a negative-UTC-offset timezone). "Today"
    // should still be Jul 17.
    withFakeNow({ local: [2026, 6, 17], utc: [2026, 6, 18] }, () => {
      expect(formatDateToISO8601(getToday())).toBe('2026-07-17');
    });
  });

  it('agrees with the UTC calendar date when local time is ahead of UTC', () => {
    // 1:30 AM local on Jul 18 while the UTC clock still reads Jul 17 (e.g. a
    // positive-UTC-offset timezone just after local midnight).
    withFakeNow({ local: [2026, 6, 18], utc: [2026, 6, 17] }, () => {
      expect(formatDateToISO8601(getToday())).toBe('2026-07-18');
    });
  });
});

describe('getCurrentFullYear', () => {
  it("uses the local year, not the UTC year, on New Year's Eve", () => {
    // 11:30 PM local on Dec 31, 2026 with the UTC clock already into Jan 1, 2027.
    withFakeNow({ local: [2026, 11, 31], utc: [2027, 0, 1] }, () => {
      expect(getCurrentFullYear()).toBe(2026);
    });
  });
});

describe('resolveDateRange', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns null when nothing is set', () => {
    expect(resolveDateRange(undefined, undefined, undefined, undefined)).toBeNull();
  });

  it('resolves startDate/endDate when only those are set', () => {
    const range = resolveDateRange('2025-01-01', '2025-01-31', undefined, undefined);
    expect(formatDateToISO8601(range!.start)).toBe('2025-01-01');
    expect(formatDateToISO8601(range!.end)).toBe('2025-01-31');
  });

  it('ignores an inverted startDate/endDate pair', () => {
    expect(resolveDateRange('2025-02-01', '2025-01-01', undefined, undefined)).toBeNull();
  });

  it('daysToShow takes precedence over startDate/endDate', () => {
    const range = resolveDateRange('2025-01-01', '2025-01-31', 7, undefined);
    expect(formatDateToISO8601(range!.start)).toBe('2025-06-09');
    expect(formatDateToISO8601(range!.end)).toBe('2025-06-15');
  });

  it('monthsToShow takes precedence over daysToShow and startDate/endDate', () => {
    const range = resolveDateRange('2025-01-01', '2025-01-31', 7, 2);
    expect(formatDateToISO8601(range!.start)).toBe('2025-04-01');
    expect(formatDateToISO8601(range!.end)).toBe('2025-06-30');
  });

  it('monthsToShow: 0 shows only the current month', () => {
    const range = resolveDateRange(undefined, undefined, undefined, 0);
    expect(formatDateToISO8601(range!.start)).toBe('2025-06-01');
    expect(formatDateToISO8601(range!.end)).toBe('2025-06-30');
  });
});
