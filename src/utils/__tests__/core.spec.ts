import { DEFAULT_TRACKER_DATA } from 'src/constants/defaultTrackerData';
import { clamp, getEntriesForYear, mapRange, mergeTrackerData, } from '../core';
import { Entry } from 'src/types';

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

describe('mergeTrackerData', () => {
  it('should return default config when no user config is provided', () => {
    const result = mergeTrackerData(DEFAULT_TRACKER_DATA, null as any);

    expect(result).toEqual(DEFAULT_TRACKER_DATA);
  });

  it('should return correct config', () => {
    const userConfig = {
      year: 2021,
      entries: [
        { date: '2021-01-01', customColor: '#7bc96f', intensity: 5, content: '' },
      ],
      showCurrentDayBorder: false,
      intensityScaleStart: 2,
      intensityScaleEnd: 8,
      defaultEntryIntensity: 2,
      colorScheme: {
        paletteName: 'danger',
        customColors: ['#fff33b', '#fdc70c', '#f3903f', '#ed683c', '#e93e3a'],
      },
    };

    const expected = {
      ...userConfig,
      intensityConfig: {
        defaultIntensity: 2,
        scaleEnd: 8,
        scaleStart: 2,
        showOutOfRange: true,
      },
      insights: [],
      basePath: undefined,
      disableFileCreation: false,
      heatmapTitle: undefined,
      heatmapSubtitle: undefined,
      ui: {
        defaultView: 'heatmap-tracker',
        hideTabs: false,
        hideYear: false,
        hideTitle: false,
        hideSubtitle: false,
      }
    };

    const result = mergeTrackerData(DEFAULT_TRACKER_DATA, userConfig as any);

    expect(result).toEqual(expected);
  });

  it('should return intensityConfig', () => {
    const userConfig = {
      year: 2021,
      entries: [
        { date: '2021-01-01', customColor: '#7bc96f', intensity: 5, content: '' },
      ],
      showCurrentDayBorder: false,
      intensityScaleStart: 2,
      intensityScaleEnd: 8,
      defaultEntryIntensity: 2,
      colorScheme: {
        paletteName: 'danger',
        customColors: ['#fff33b', '#fdc70c', '#f3903f', '#ed683c', '#e93e3a'],
      },
    };

    const result = mergeTrackerData(DEFAULT_TRACKER_DATA, userConfig as any);

    expect(result).toEqual(expect.objectContaining({
      intensityConfig: {
        defaultIntensity: 2,
        scaleEnd: 8,
        scaleStart: 2,
        showOutOfRange: true,
      }
    }));
  });

  it('should return deprecated intensity parameters', () => {
    const userConfig = {
      year: 2021,
      entries: [
        { date: '2021-01-01', customColor: '#7bc96f', intensity: 5, content: '' },
      ],
      showCurrentDayBorder: false,
      intensityScaleStart: 2,
      intensityScaleEnd: 8,
      defaultEntryIntensity: 2,
      colorScheme: {
        paletteName: 'danger',
        customColors: ['#fff33b', '#fdc70c', '#f3903f', '#ed683c', '#e93e3a'],
      },
    };

    const result = mergeTrackerData(DEFAULT_TRACKER_DATA, userConfig as any);

    expect(result.defaultEntryIntensity).toBeDefined();
    expect(result.intensityScaleStart).toBeDefined();
    expect(result.intensityScaleEnd).toBeDefined();
  });

  describe('colorScheme', () => {
    it(
      'should return default colorScheme if user did not provide one'
      , () => {
        const userConfig = {
          year: 2021,
          entries: [
            { date: '2021-01-01', customColor: '#7bc96f', intensity: 5, content: '' },
          ],
          showCurrentDayBorder: false,
          intensityScaleStart: 2,
          intensityScaleEnd: 8,
          defaultEntryIntensity: 2,
        };

        const result = mergeTrackerData(DEFAULT_TRACKER_DATA, userConfig as any);

        expect(result.colorScheme).toEqual(DEFAULT_TRACKER_DATA.colorScheme);
        expect(result.colorScheme.paletteName).toEqual('default');
        expect(result.colorScheme.customColors).toBeUndefined();
      });

    it(
      'should return default colorScheme when user set it to null'
      , () => {
        const userConfig = {
          year: 2021,
          entries: [
            { date: '2021-01-01', customColor: '#7bc96f', intensity: 5, content: '' },
          ],
          showCurrentDayBorder: false,
          intensityScaleStart: 2,
          intensityScaleEnd: 8,
          defaultEntryIntensity: 2,
          colorScheme: null,
        };

        const result = mergeTrackerData(DEFAULT_TRACKER_DATA, userConfig as any);

        expect(result.colorScheme).toEqual(DEFAULT_TRACKER_DATA.colorScheme);
        expect(result.colorScheme.paletteName).toEqual('default');
        expect(result.colorScheme.customColors).toBeUndefined();
      });
  });
});

describe('getEntriesForYear', () => {
  it('should return only entries for the given year', () => {
    const entries: Entry[] = [
      { date: '2025-01-01T00:00:00Z' },
      { date: '2025-12-31T23:59:59Z' },
      { date: '2024-06-15T00:00:00Z' },
    ];
    expect(getEntriesForYear(entries, 2025)).toEqual([
      { date: '2025-01-01T00:00:00Z' },
      { date: '2025-12-31T23:59:59Z' },
    ]);
  });

  it('should return an empty array if no entries match the year', () => {
    const entries: Entry[] = [
      { date: '2024-01-01T00:00:00Z' },
      { date: '2023-12-31T23:59:59Z' },
    ];
    expect(getEntriesForYear(entries, 2025)).toEqual([]);
  });

  it('should handle invalid dates gracefully', () => {
    const entries: Entry[] = [
      { date: 'Invalid Date' },
      { date: null as unknown as string },
      { date: '2025-01-01T00:00:00Z' },
    ];
    expect(getEntriesForYear(entries, 2025)).toEqual([{ date: '2025-01-01T00:00:00Z' }]);
  });

  it('should handle entries with null or undefined dates', () => {
    const entries: Entry[] = [
      { date: null as unknown as string },
      { date: undefined as unknown as string },
      { date: '2025-01-01T00:00:00Z' },
    ];
    expect(getEntriesForYear(entries, 2025)).toEqual([{ date: '2025-01-01T00:00:00Z' }]);
  });

  it('should handle leap years correctly', () => {
    const entries: Entry[] = [
      { date: '2024-02-29T00:00:00Z' }, // Leap day
      { date: '2025-02-28T00:00:00Z' },
    ];
    expect(getEntriesForYear(entries, 2024)).toEqual([{ date: '2024-02-29T00:00:00Z' }]);
  });

  it.skip('should handle entries in different timezones correctly', () => {
    const entries: Entry[] = [
      { date: '2025-01-01T00:00:00+05:00' }, // Timezone offset
      { date: '2025-12-31T23:59:59-08:00' },
      { date: '2026-01-01T00:00:00Z' },
    ];
    expect(getEntriesForYear(entries, 2025)).toEqual([
      { date: '2025-01-01T00:00:00+05:00' },
      { date: '2025-12-31T23:59:59-08:00' },
    ]);
  });

  it('should return an empty array for an empty entries list', () => {
    const entries: Entry[] = [];
    expect(getEntriesForYear(entries, 2025)).toEqual([]);
  });

  it('should return an empty array if the year is invalid', () => {
    const entries: Entry[] = [
      { date: '2025-01-01T00:00:00Z' },
      { date: '2025-12-31T23:59:59Z' },
    ];
    expect(getEntriesForYear(entries, NaN)).toEqual([]);
  });
});