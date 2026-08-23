import { DEFAULT_TRACKER_DATA } from "src/constants/defaultTrackerData";
import {
  clamp,
  getBoxes,
  getEntriesForYear,
  mapRange,
  mergeTrackerData,
} from "../core";
import { Entry, TrackerData, TrackerSettings } from "src/types";

describe("clamp", () => {
  test("Input Within Range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  test("Input Less Than Minimum", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  test("Input Greater Than Maximum", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  test("Input Equals Minimum", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  test("Input Equals Maximum", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe("mapRange", () => {
  test("Map Value Within Input Range", () => {
    expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
  });

  test("Map Value Below Input Range (Clamped to Output Minimum)", () => {
    expect(mapRange(-5, 0, 10, 0, 100)).toBe(0);
  });

  test("Map Value Above Input Range (Clamped to Output Maximum)", () => {
    expect(mapRange(15, 0, 10, 0, 100)).toBe(100);
  });

  test("Zero Input Range (Division by Zero Handling)", () => {
    // Previously NaN, which `clamp` passed straight through to callers. Every
    // input collapses onto one point when the input range has no width, so the
    // output range's start is the only meaningful answer.
    expect(mapRange(5, 5, 5, 0, 100)).toBe(0);
    expect(mapRange(0, 5, 5, 1, 5)).toBe(1);
  });

  test("Reverse Input Range (inMin Greater Than inMax)", () => {
    expect(mapRange(5, 10, 0, 0, 100)).toBe(50);
  });
});

describe("mergeTrackerData", () => {
  it("should return default config when no user config is provided", () => {
    const result = mergeTrackerData(DEFAULT_TRACKER_DATA, null as any);

    expect(result).toEqual(DEFAULT_TRACKER_DATA);
  });

  it("should return correct config", () => {
    const userConfig = {
      year: 2021,
      entries: [
        {
          date: "2021-01-01",
          customColor: "#7bc96f",
          intensity: 5,
          content: "",
        },
      ],
      showCurrentDayBorder: false,
      colorScheme: {
        paletteName: "danger",
        customColors: ["#fff33b", "#fdc70c", "#f3903f", "#ed683c", "#e93e3a"],
      },
    };

    const expected = {
      ...userConfig,
      intensityConfig: {
        defaultIntensity: 4,
        scaleEnd: undefined,
        scaleStart: undefined,
        showOutOfRange: true,
        excludeFalsy: undefined,
      },
      insights: [],
      basePath: undefined,
      disableFileCreation: false,
      heatmapTitle: undefined,
      heatmapSubtitle: undefined,
      ui: {
        defaultView: "heatmap-tracker",
        hideTabs: false,
        hideYear: false,
        hideTitle: false,
        hideSubtitle: false,
      },
    };

    const result = mergeTrackerData(DEFAULT_TRACKER_DATA, userConfig as any);

    expect(result).toEqual(expected);
  });

  it("should return intensityConfig as provided by the user", () => {
    const userConfig = {
      year: 2021,
      entries: [
        {
          date: "2021-01-01",
          customColor: "#7bc96f",
          intensity: 5,
          content: "",
        },
      ],
      showCurrentDayBorder: false,
      intensityConfig: {
        scaleStart: 2,
        scaleEnd: 8,
        defaultIntensity: 2,
      },
      colorScheme: {
        paletteName: "danger",
        customColors: ["#fff33b", "#fdc70c", "#f3903f", "#ed683c", "#e93e3a"],
      },
    };

    const result = mergeTrackerData(DEFAULT_TRACKER_DATA, userConfig as any);

    expect(result).toEqual(
      expect.objectContaining({
        intensityConfig: expect.objectContaining({
          defaultIntensity: 2,
          scaleEnd: 8,
          scaleStart: 2,
        }),
      }),
    );
  });

  it("should migrate deprecated intensityScaleStart/intensityScaleEnd/defaultEntryIntensity into intensityConfig and drop them", () => {
    const userConfig = {
      year: 2021,
      entries: [
        {
          date: "2021-01-01",
          customColor: "#7bc96f",
          intensity: 5,
          content: "",
        },
      ],
      showCurrentDayBorder: false,
      intensityScaleStart: 2,
      intensityScaleEnd: 8,
      defaultEntryIntensity: 2,
      colorScheme: {
        paletteName: "danger",
        customColors: ["#fff33b", "#fdc70c", "#f3903f", "#ed683c", "#e93e3a"],
      },
    };

    const result = mergeTrackerData(DEFAULT_TRACKER_DATA, userConfig as any);

    expect(result).toEqual(
      expect.objectContaining({
        intensityConfig: expect.objectContaining({
          defaultIntensity: 2,
          scaleEnd: 8,
          scaleStart: 2,
        }),
      }),
    );
    expect((result as any).defaultEntryIntensity).toBeUndefined();
    expect((result as any).intensityScaleStart).toBeUndefined();
    expect((result as any).intensityScaleEnd).toBeUndefined();
  });

  it("should prefer intensityConfig over deprecated fields when both are provided", () => {
    const userConfig = {
      year: 2021,
      entries: [],
      showCurrentDayBorder: false,
      intensityScaleStart: 2,
      intensityScaleEnd: 8,
      defaultEntryIntensity: 2,
      intensityConfig: {
        scaleStart: 100,
        scaleEnd: 800,
        defaultIntensity: 3,
      },
    };

    const result = mergeTrackerData(DEFAULT_TRACKER_DATA, userConfig as any);

    expect(result.intensityConfig).toEqual(
      expect.objectContaining({
        defaultIntensity: 3,
        scaleEnd: 800,
        scaleStart: 100,
      }),
    );
  });

  describe("colorScheme", () => {
    it("should return default colorScheme if user did not provide one", () => {
      const userConfig = {
        year: 2021,
        entries: [
          {
            date: "2021-01-01",
            customColor: "#7bc96f",
            intensity: 5,
            content: "",
          },
        ],
        showCurrentDayBorder: false,
      };

      const result = mergeTrackerData(DEFAULT_TRACKER_DATA, userConfig as any);

      expect(result.colorScheme).toEqual(DEFAULT_TRACKER_DATA.colorScheme);
      expect(result.colorScheme.paletteName).toEqual("default");
      expect(result.colorScheme.customColors).toBeUndefined();
    });

    it("should return default colorScheme when user set it to null", () => {
      const userConfig = {
        year: 2021,
        entries: [
          {
            date: "2021-01-01",
            customColor: "#7bc96f",
            intensity: 5,
            content: "",
          },
        ],
        showCurrentDayBorder: false,
        colorScheme: null,
      };

      const result = mergeTrackerData(DEFAULT_TRACKER_DATA, userConfig as any);

      expect(result.colorScheme).toEqual(DEFAULT_TRACKER_DATA.colorScheme);
      expect(result.colorScheme.paletteName).toEqual("default");
      expect(result.colorScheme.customColors).toBeUndefined();
    });
  });
});

describe("getEntriesForYear", () => {
  it("should return only entries for the given year", () => {
    const entries: Entry[] = [
      { date: "2025-01-01T00:00:00Z" },
      { date: "2025-12-31T23:59:59Z" },
      { date: "2024-06-15T00:00:00Z" },
    ];
    expect(getEntriesForYear(entries, 2025)).toEqual([
      { date: "2025-01-01T00:00:00Z" },
      { date: "2025-12-31T23:59:59Z" },
    ]);
  });

  it("should return an empty array if no entries match the year", () => {
    const entries: Entry[] = [
      { date: "2024-01-01T00:00:00Z" },
      { date: "2023-12-31T23:59:59Z" },
    ];
    expect(getEntriesForYear(entries, 2025)).toEqual([]);
  });

  it("should handle invalid dates gracefully", () => {
    const entries: Entry[] = [
      { date: "Invalid Date" },
      { date: null as unknown as string },
      { date: "2025-01-01T00:00:00Z" },
    ];
    expect(getEntriesForYear(entries, 2025)).toEqual([
      { date: "2025-01-01T00:00:00Z" },
    ]);
  });

  it("should include entries whose filenames have a weekday suffix (issue #89)", () => {
    const entries: Entry[] = [
      { date: "2026-06-24-Wednesday" },
      { date: "2026-06-25-Thursday" },
      { date: "2025-06-24-Tuesday" },
    ];
    expect(getEntriesForYear(entries, 2026)).toEqual([
      { date: "2026-06-24-Wednesday" },
      { date: "2026-06-25-Thursday" },
    ]);
  });

  it("should handle entries with null or undefined dates", () => {
    const entries: Entry[] = [
      { date: null as unknown as string },
      { date: undefined as unknown as string },
      { date: "2025-01-01T00:00:00Z" },
    ];
    expect(getEntriesForYear(entries, 2025)).toEqual([
      { date: "2025-01-01T00:00:00Z" },
    ]);
  });

  it("should handle leap years correctly", () => {
    const entries: Entry[] = [
      { date: "2024-02-29T00:00:00Z" }, // Leap day
      { date: "2025-02-28T00:00:00Z" },
    ];
    expect(getEntriesForYear(entries, 2024)).toEqual([
      { date: "2024-02-29T00:00:00Z" },
    ]);
  });

  it.skip("should handle entries in different timezones correctly", () => {
    const entries: Entry[] = [
      { date: "2025-01-01T00:00:00+05:00" }, // Timezone offset
      { date: "2025-12-31T23:59:59-08:00" },
      { date: "2026-01-01T00:00:00Z" },
    ];
    expect(getEntriesForYear(entries, 2025)).toEqual([
      { date: "2025-01-01T00:00:00+05:00" },
      { date: "2025-12-31T23:59:59-08:00" },
    ]);
  });

  it("should return an empty array for an empty entries list", () => {
    const entries: Entry[] = [];
    expect(getEntriesForYear(entries, 2025)).toEqual([]);
  });

  it("should return an empty array if the year is invalid", () => {
    const entries: Entry[] = [
      { date: "2025-01-01T00:00:00Z" },
      { date: "2025-12-31T23:59:59Z" },
    ];
    expect(getEntriesForYear(entries, NaN)).toEqual([]);
  });
});

describe("getBoxes", () => {
  const colors = ["c1", "c2", "c3", "c4", "c5"];

  const trackerData = (overrides: Partial<TrackerData> = {}) =>
    ({
      separateMonths: false,
      showCurrentDayBorder: true,
      ...overrides,
    }) as unknown as TrackerData;

  const settings = (weekStartDay = 1) =>
    ({ weekStartDay }) as unknown as TrackerSettings;

  it("emits one box per day of the year plus the leading padding", () => {
    // 2021 starts on a Friday; with Monday as the week start that is 4 pads.
    const boxes = getBoxes(2021, {}, colors, trackerData(), settings(1));

    expect(boxes).toHaveLength(4 + 365);
    expect(boxes.slice(0, 4).every((box) => box.isSpaceBetweenBox)).toBe(true);
    expect(boxes[4].date).toBe("2021-01-01");
    expect(boxes[boxes.length - 1].date).toBe("2021-12-31");
  });

  it("accounts for a leap year", () => {
    const boxes = getBoxes(2024, {}, colors, trackerData(), settings(1));

    expect(boxes.filter((box) => !box.isSpaceBetweenBox)).toHaveLength(366);
    expect(boxes[boxes.length - 1].date).toBe("2024-12-31");
  });

  it("gives every padding box its own object", () => {
    // These used to be one object repeated by `Array#fill`, so anything that
    // mutated a padding box (or keyed off box identity) hit all of them.
    const boxes = getBoxes(2021, {}, colors, trackerData(), settings(1));

    expect(boxes[0]).not.toBe(boxes[1]);
    expect(boxes[0]).toEqual(boxes[1]);
  });

  it("inserts a week of spacing before each month when separateMonths is on", () => {
    const boxes = getBoxes(
      2021,
      {},
      colors,
      trackerData({ separateMonths: true }),
      settings(1),
    );

    // 4 leading pads + 365 days + 7 pads before each month except January.
    expect(boxes).toHaveLength(4 + 365 + 7 * 11);
  });

  it("maps an entry's intensity onto the matching color", () => {
    const boxes = getBoxes(
      2021,
      { 1: { date: "2021-01-01", intensity: 3, value: 30, content: "hi" } },
      colors,
      trackerData(),
      settings(1),
    );

    const firstDay = boxes[4];
    expect(firstDay.hasData).toBe(true);
    expect(firstDay.backgroundColor).toBe("c3");
    expect(firstDay.value).toBe(30);
    expect(firstDay.content).toBe("hi");
  });

  it("lets customColor win over the mapped intensity color", () => {
    const boxes = getBoxes(
      2021,
      { 1: { date: "2021-01-01", intensity: 3, customColor: "rebeccapurple" } },
      colors,
      trackerData(),
      settings(1),
    );

    expect(boxes[4].backgroundColor).toBe("rebeccapurple");
  });

  it("leaves days without an entry uncolored", () => {
    const boxes = getBoxes(2021, {}, colors, trackerData(), settings(1));

    expect(boxes[4].hasData).toBe(false);
    expect(boxes[4].backgroundColor).toBeUndefined();
  });

  it("rejects an invalid weekStartDay rather than laying out a wrong grid", () => {
    expect(() =>
      getBoxes(2021, {}, colors, trackerData(), settings(NaN)),
    ).toThrow("weekStartDay must be between 0 and 6");
  });
});
