import { ColorsList, Entry, IntensityConfig } from "src/types";
import {
  fillEntriesWithIntensity,
  getEntriesIntensities,
  getIntensitiesInfo,
  getIntensitiesRanges,
  getMinMaxIntensities,
} from "../intensity";

const createConfig = (overrides: Partial<IntensityConfig> = {}): IntensityConfig => ({
  scaleStart: undefined,
  scaleEnd: undefined,
  defaultIntensity: 1,
  showOutOfRange: false,
  ...overrides,
});

describe("getEntriesIntensities", () => {
  it("should return unique intensity values while ignoring undefined entries", () => {
    const entries: Entry[] = [
      { date: "2024-01-01", intensity: 7 },
      { date: "2024-01-02" },
      { date: "2024-01-03", intensity: 7 },
      { date: "2024-01-04", intensity: 3 },
    ];

    expect(getEntriesIntensities(entries)).toEqual([7, 3]);
  });

  it('should handle 0 intensity values correctly', () => {
    const entries: Entry[] = [
      { date: "2024-01-01", intensity: null as any },
      { date: "2024-01-02", intensity: 5 },
      { date: "2024-01-03", intensity: 0 },
    ];

    expect(getEntriesIntensities(entries)).toEqual([5, 0]);
  });
});

describe("getIntensitiesRanges", () => {
  it("should split the interval evenly between the provided boundaries", () => {
    expect(getIntensitiesRanges(3, 0, 90)).toEqual([
      { min: 0, max: 30, intensity: 1 },
      { min: 30, max: 60, intensity: 2 },
      { min: 60, max: 90, intensity: 3 },
    ]);
  });

  it("should support negative ranges", () => {
    expect(getIntensitiesRanges(4, -10, 10)).toEqual([
      { min: -10, max: -5, intensity: 1 },
      { min: -5, max: 0, intensity: 2 },
      { min: 0, max: 5, intensity: 3 },
      { min: 5, max: 10, intensity: 4 },
    ]);
  });
});

describe("getMinMaxIntensities", () => {
  it("should derive the min and max from the provided intensities", () => {
    const config = createConfig();

    expect(getMinMaxIntensities([5, 10, 1], config)).toEqual([1, 10]);
  });

  it("should prefer configuration overrides and fall back to defaults when no intensities exist", () => {
    const overridden = createConfig({ scaleStart: -5, scaleEnd: 5 });
    expect(getMinMaxIntensities([2, 3], overridden)).toEqual([-5, 5]);

    const noIntensities = createConfig();
    expect(getMinMaxIntensities([], noIntensities)).toEqual([1, 5]);
  });
});

describe("getIntensitiesInfo", () => {
  it("should return ranges derived from the entry intensities", () => {
    const colors: ColorsList = ["#111", "#222"];
    const intensities = [10, 40, 70];
    const config = createConfig();

    expect(getIntensitiesInfo(intensities, config, colors)).toEqual(
      [
        { min: 10, max: 40, intensity: 1 },
        { min: 40, max: 70, intensity: 2 }
      ]
    );
  });

  it("should respect custom scale boundaries when provided", () => {
    const colors: ColorsList = ["#111", "#222", "#333"];
    const config = createConfig({ scaleStart: 0, scaleEnd: 100 });
    const intensities = [10, 20];

    const ranges = getIntensitiesInfo(intensities, config, colors);

    expect(ranges[0].min).toBe(0);
    expect(ranges[ranges.length - 1].max).toBe(100);
  });
});

describe("fillEntriesWithIntensity", () => {
  it("should map entries to the generated intensity buckets and keep original values", () => {
    const colors: ColorsList = ["#111", "#222", "#333"];
    const config = createConfig({ defaultIntensity: 50 });
    const entries: Entry[] = [
      { date: "2024-01-01", intensity: 0, content: "low" },
      { date: "2024-01-02", intensity: 50 },
      { date: "2024-01-03", content: "uses default" },
    ];

    const result = fillEntriesWithIntensity(entries, config, colors);

    expect(result[1]).toEqual({
      ...entries[0],
      value: 0,
      intensity: 1,
    });
    expect(result[2]).toEqual({
      ...entries[1],
      value: 50,
      intensity: 3,
    });
    expect(result[3]).toEqual({
      ...entries[2],
      value: undefined,
      intensity: 3,
    });
  });

  it("should handle out-of-range values according to configuration", () => {
    const colors: ColorsList = ["#111", "#222", "#333", "#444"];
    const entries: Entry[] = [
      { date: "2024-01-10", intensity: 10 },
      { date: "2024-01-11" },
    ];

    const baseConfig = createConfig({
      scaleStart: 0,
      scaleEnd: 20,
      defaultIntensity: 80,
    });

    const hideOutOfRange = fillEntriesWithIntensity(entries, baseConfig, colors);
    expect(hideOutOfRange[11].intensity).toBeUndefined();

    const showOutOfRange = fillEntriesWithIntensity(entries, { ...baseConfig, showOutOfRange: true }, colors);

    expect(showOutOfRange[10].intensity).toBe(2);
    expect(showOutOfRange[11].intensity).toBe(4);
    expect(showOutOfRange[11].value).toBeUndefined();
  });
});


describe('some examples', () => {
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

    expect(result).toEqual([
      { min: -10, max: -6.666666666666666, intensity: 1 },
      { min: -6.666666666666666, max: -3.333333333333333, intensity: 2 },
      { min: -3.333333333333333, max: 0, intensity: 3 },
      { min: 0, max: 3.333333333333334, intensity: 4 },
      { min: 3.333333333333334, max: 6.666666666666668, intensity: 5 },
      { min: 6.666666666666668, max: 10, intensity: 6 }
    ]);
  });
});