import { calculateStreaks, processCustomMetrics } from "../statistics";
import { Entry, Insight } from "../../types";

/**
 * `Insight.calculate` is typed as returning a string, but insights come from
 * user-written dataviewjs where nothing enforces that. These helpers keep the
 * runtime-shape tests honest without pretending the schema allows it.
 */
const insight = (name: string, calculate: () => unknown): Insight =>
  ({ name, calculate }) as unknown as Insight;

describe("calculateStreaks", () => {
  it("should return 0 for empty entries", () => {
    const result = calculateStreaks([]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it("should calculate basic streaks correctly", () => {
    const entries: Entry[] = [
      { date: "2024-01-01", intensity: 1 },
      { date: "2024-01-02", intensity: 1 },
      { date: "2024-01-03", intensity: 1 },
    ];
    // Mocking "today" is tricky because it's hardcoded as new Date() in calculateStreaks
    // But we can check longestStreak regardless of today
    const result = calculateStreaks(entries);
    expect(result.longestStreak).toBe(3);
  });

  it("should reset streak on gaps", () => {
    const entries: Entry[] = [
      { date: "2024-01-01", intensity: 1 },
      { date: "2024-01-02", intensity: 1 },
      // Gap on 2024-01-03
      { date: "2024-01-04", intensity: 1 },
    ];
    const result = calculateStreaks(entries);
    expect(result.longestStreak).toBe(2);
  });

  it("should identify the correct dates for streaks", () => {
    const entries: Entry[] = [
      { date: "2024-01-01", intensity: 1 },
      { date: "2024-01-02", intensity: 1 },
      { date: "2024-01-04", intensity: 1 },
      { date: "2024-01-05", intensity: 1 },
      { date: "2024-01-06", intensity: 1 },
    ];
    const result = calculateStreaks(entries);
    expect(result.longestStreak).toBe(3);
    expect(result.longestStreakStartDate?.toISOString().split("T")[0]).toBe(
      "2024-01-04",
    );
    expect(result.longestStreakEndDate?.toISOString().split("T")[0]).toBe(
      "2024-01-06",
    );
  });

  it("should handle unordered entries", () => {
    const entries: Entry[] = [
      { date: "2024-01-02", intensity: 1 },
      { date: "2024-01-01", intensity: 1 },
      { date: "2024-01-03", intensity: 1 },
    ];
    const result = calculateStreaks(entries);
    expect(result.longestStreak).toBe(3);
  });

  it("should identify the correct start date for the current streak when there are gaps", () => {
    const today = new Date();
    const d = (daysAgo: number) => {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - daysAgo);
      return date.toISOString().split("T")[0];
    };

    // Gap between 10 days ago and 2 days ago
    const entries: Entry[] = [
      { date: d(12), intensity: 1 },
      { date: d(11), intensity: 1 },
      { date: d(10), intensity: 1 },
      // Gap
      { date: d(2), intensity: 1 },
      { date: d(1), intensity: 1 },
      { date: d(0), intensity: 1 },
    ];

    const result = calculateStreaks(entries);

    expect(result.currentStreak).toBe(3);
    expect(result.currentStreakStartDate?.toISOString().split("T")[0]).toBe(
      d(2),
    );
    expect(result.currentStreakEndDate?.toISOString().split("T")[0]).toBe(d(0));
  });

  it("keeps the current streak alive for an entry logged today, even when the UTC calendar date is already tomorrow", () => {
    // Simulates checking in the evening in a negative-UTC-offset timezone,
    // where the UTC clock has already rolled over to the next calendar day
    // even though it's still "today" locally. Only the argless `new Date()`
    // form (what calculateStreaks' internal getToday() call reads as "now")
    // is faked; everything else falls through to the real Date constructor.
    const RealDate = global.Date;
    class FakeNow extends RealDate {
      getFullYear() {
        return 2026;
      }
      getMonth() {
        return 6;
      }
      getDate() {
        return 17;
      }
      getUTCFullYear() {
        return 2026;
      }
      getUTCMonth() {
        return 6;
      }
      getUTCDate() {
        return 18;
      }
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
    MockDate.prototype = RealDate.prototype;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.Date = MockDate as any;

    try {
      const entries: Entry[] = [
        { date: "2026-07-16", intensity: 1 },
        { date: "2026-07-17", intensity: 1 },
      ];
      const result = calculateStreaks(entries);
      expect(result.currentStreak).toBe(2);
    } finally {
      global.Date = RealDate;
    }
  });

  it("should simulate excludeFalsy by passing filtered entries", () => {
    // Imagine we have entries on 1st, 2nd, 3rd, but 2nd has intensity 0 and is filtered out
    const allEntries: Entry[] = [
      { date: "2024-01-01", intensity: 1 },
      { date: "2024-01-02", intensity: 0 },
      { date: "2024-01-03", intensity: 1 },
    ];

    const filteredEntries = allEntries.filter(
      (e) =>
        e.intensity !== undefined && e.intensity !== null && e.intensity > 0,
    );
    const result = calculateStreaks(filteredEntries);

    // Streak should be 1 because the gap on Jan 2nd (due to filtering) breaks it
    expect(result.longestStreak).toBe(1);
  });

  it("counts a day once when it has several entries", () => {
    // `calculateStreaks` is handed the unaggregated entry list, so repeats are
    // normal. A repeat used to read as a zero-day gap and reset the streak.
    const entries: Entry[] = [
      { date: "2024-01-01", intensity: 1 },
      { date: "2024-01-02", intensity: 1 },
      { date: "2024-01-02", intensity: 3 },
      { date: "2024-01-02", intensity: 2 },
      { date: "2024-01-03", intensity: 1 },
    ];

    const result = calculateStreaks(entries);

    expect(result.longestStreak).toBe(3);
    expect(result.longestStreakStartDate?.toISOString().split("T")[0]).toBe(
      "2024-01-01",
    );
    expect(result.longestStreakEndDate?.toISOString().split("T")[0]).toBe(
      "2024-01-03",
    );
  });

  it("does not break across a DST boundary", () => {
    // Parsed in local time these are 23 hours apart in America/New_York (and
    // 25 in the autumn), so the whole-day comparison failed and the streak
    // reset once or twice a year depending on the reader's timezone.
    const spring: Entry[] = [
      { date: "2024/03/09", intensity: 1 },
      { date: "2024/03/10", intensity: 1 },
      { date: "2024/03/11", intensity: 1 },
    ];
    const autumn: Entry[] = [
      { date: "2024-11-02", intensity: 1 },
      { date: "2024-11-03", intensity: 1 },
      { date: "2024-11-04", intensity: 1 },
    ];

    expect(calculateStreaks(spring).longestStreak).toBe(3);
    expect(calculateStreaks(autumn).longestStreak).toBe(3);
  });

  it("ignores entries whose date cannot be parsed", () => {
    const entries: Entry[] = [
      { date: "2024-01-01", intensity: 1 },
      { date: "not a date", intensity: 1 },
      { date: "2024-01-02", intensity: 1 },
      { date: "2024-02-30", intensity: 1 },
      { date: "2024-01-03", intensity: 1 },
    ];

    // Previously the NaN comparisons around the bad entries reset the streak.
    expect(calculateStreaks(entries).longestStreak).toBe(3);
  });

  it("tolerates a missing date", () => {
    const entries: Entry[] = [
      { date: null as unknown as string, intensity: 1 },
      { date: "2024-01-01", intensity: 1 },
      { date: undefined as unknown as string, intensity: 1 },
      { date: "2024-01-02", intensity: 1 },
    ];

    expect(calculateStreaks(entries).longestStreak).toBe(2);
  });

  it("reports no streak when every entry has an unusable date", () => {
    const result = calculateStreaks([{ date: "garbage", intensity: 1 }]);

    expect(result.longestStreak).toBe(0);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreakStartDate).toBeNull();
    expect(result.longestStreakEndDate).toBeNull();
  });

  it("treats entries written with different separators as the same day", () => {
    const entries: Entry[] = [
      { date: "2024-01-01", intensity: 1 },
      { date: "2024/01/01", intensity: 1 },
      { date: "2024-01-02", intensity: 1 },
    ];

    expect(calculateStreaks(entries).longestStreak).toBe(2);
  });
});

describe("processCustomMetrics", () => {
  it("returns each insight's result keyed by name", () => {
    const results = processCustomMetrics(
      [
        {
          name: "count",
          calculate: ({ yearEntries }) => String(yearEntries.length),
        },
        { name: "label", calculate: () => "ok" },
      ],
      [{ date: "2024-01-01", intensity: 1 }],
    );

    expect(results).toEqual({ count: "1", label: "ok" });
  });

  it("keeps a numeric zero rather than blanking it", () => {
    const results = processCustomMetrics([insight("zero", () => 0)], []);

    expect(results.zero).toBe("0");
  });

  it("isolates an insight that throws so the rest still render", () => {
    // `calculate` is user JS from a dataviewjs block; one bad insight used to
    // take the whole Statistics view down with it.
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      const results = processCustomMetrics(
        [
          insight("boom", () => {
            throw new Error("nope");
          }),
          insight("fine", () => 42),
        ],
        [],
      );

      expect(results.boom).toBe("");
      expect(results.fine).toBe("42");
      expect(consoleError).toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });
});
