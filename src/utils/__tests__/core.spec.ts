import {
  clamp,
  mapRange,
  isValidDate,
  getDayOfYear,
  getFirstDayOfYear,
  getNumberOfEmptyDaysBeforeYearStarts,
  getLastDayOfYear,
  getIntensitiesRanges,
} from '../core';

describe('clamp', () => {
  test('Input Within Range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  test('Input Less Than Minimum', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  test('Input Greater Than Maximum', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  test('Input Equals Minimum', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  test('Input Equals Maximum', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('mapRange', () => {
  test('Map Value Within Input Range', () => {
    expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
  });

  test('Map Value Below Input Range (Clamped to Output Minimum)', () => {
    expect(mapRange(-5, 0, 10, 0, 100)).toBe(0);
  });

  test('Map Value Above Input Range (Clamped to Output Maximum)', () => {
    expect(mapRange(15, 0, 10, 0, 100)).toBe(100);
  });

  test('Zero Input Range (Division by Zero Handling)', () => {
    expect(mapRange(5, 5, 5, 0, 100)).toBeNaN();
  });

  test('Reverse Input Range (inMin Greater Than inMax)', () => {
    expect(mapRange(5, 10, 0, 0, 100)).toBe(50);
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

describe('get123', () => {
  test('5 - 1 - 10', () => {
    const result = getIntensitiesRanges(5, 1, 10);

    expect(result).toEqual([
      { min: 1, max: 2.8, intensity: 1 },
      { min: 2.8, max: 4.6, intensity: 2 },
      { min: 4.6, max: 6.4, intensity: 3 },
      { min: 6.4, max: 8.2, intensity: 4 },
      { min: 8.2, max: 10, intensity: 5 }
    ]);
  });

  test('11 - 1 - 10000', () => {
    const result = getIntensitiesRanges(11, 1, 10000);

    expect(result).toEqual([
      { min: 1, max: 910, intensity: 1 },
      { min: 910, max: 1819, intensity: 2 },
      { min: 1819, max: 2728, intensity: 3 },
      { min: 2728, max: 3637, intensity: 4 },
      { min: 3637, max: 4546, intensity: 5 },
      { min: 4546, max: 5455, intensity: 6 },
      { min: 5455, max: 6364, intensity: 7 },
      { min: 6364, max: 7273, intensity: 8 },
      { min: 7273, max: 8182, intensity: 9 },
      { min: 8182, max: 9091, intensity: 10 },
      { min: 9091, max: 10000, intensity: 11 }
    ]);
  });

  test('5 - 5 - 5', () => {
    const result = getIntensitiesRanges(5, 5, 5);

    expect(result).toEqual([
      { min: 5, max: 5, intensity: 1 },
      { min: 5, max: 5, intensity: 2 },
      { min: 5, max: 5, intensity: 3 },
      { min: 5, max: 5, intensity: 4 },
      { min: 5, max: 5, intensity: 5 }
    ]);
  });

  test('6 - -10 - 10', () => {
    const result = getIntensitiesRanges(6, -10, 10);

    console.log(result);
    expect(result).toEqual( [
      { min: -10, max: -6.666666666666666, intensity: 1 },
      { min: -6.666666666666666, max: -3.333333333333333, intensity: 2 },
      { min: -3.333333333333333, max: 0, intensity: 3 },
      { min: 0, max: 3.333333333333334, intensity: 4 },
      { min: 3.333333333333334, max: 6.666666666666668, intensity: 5 },
      { min: 6.666666666666668, max: 10, intensity: 6 }
    ]);
  });
});