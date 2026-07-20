import { Entry } from "src/types";
import { buildReportModel, computeDataRange, getWeekStartDate } from "../reportModel";

function entry(overrides: Partial<Entry> & { date: string }): Entry {
  return overrides as Entry;
}

const colorsList = ["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"];

describe("getWeekStartDate", () => {
  it("returns the same date when it already is the week start", () => {
    const monday = new Date(Date.UTC(2026, 6, 13)); // 2026-07-13 is a Monday
    expect(getWeekStartDate(monday, 1).toISOString()).toBe(monday.toISOString());
  });

  it("rolls back to the most recent occurrence of weekStartDay", () => {
    const thursday = new Date(Date.UTC(2026, 6, 16)); // 2026-07-16
    const weekStart = getWeekStartDate(thursday, 1); // Monday-start week
    expect(weekStart.toISOString()).toBe(new Date(Date.UTC(2026, 6, 13)).toISOString());
  });

  it("supports a Sunday week start", () => {
    const thursday = new Date(Date.UTC(2026, 6, 16)); // 2026-07-16
    const weekStart = getWeekStartDate(thursday, 0);
    expect(weekStart.toISOString()).toBe(new Date(Date.UTC(2026, 6, 12)).toISOString());
  });
});

describe("buildReportModel", () => {
  it("filters entries outside the given range", () => {
    const entriesByDate: Record<string, Entry> = {
      "2026-07-09": entry({ date: "2026-07-09", value: 8, intensity: 3 }),
      "2026-07-15": entry({ date: "2026-07-15", value: 8, intensity: 3 }),
      "2026-07-20": entry({ date: "2026-07-20", value: 8, intensity: 3 }),
    };

    const model = buildReportModel({
      entriesByDate,
      colorsList,
      bodiesByPath: {},
      startDate: "2026-07-10",
      endDate: "2026-07-16",
      weekStartDay: 1,
    });

    const allDates = model.weeks.flatMap((w) => w.days.map((d) => d.date));
    expect(allDates).toEqual(["2026-07-15"]);
  });

  it("groups days into weeks according to weekStartDay", () => {
    const entriesByDate: Record<string, Entry> = {
      "2026-07-13": entry({ date: "2026-07-13", value: 8, intensity: 3 }), // Monday
      "2026-07-16": entry({ date: "2026-07-16", value: 6, intensity: 2 }), // Thursday, same week
      "2026-07-20": entry({ date: "2026-07-20", value: 4, intensity: 2 }), // next Monday
    };

    const model = buildReportModel({
      entriesByDate,
      colorsList,
      bodiesByPath: {},
      startDate: "2026-07-13",
      endDate: "2026-07-20",
      weekStartDay: 1,
    });

    expect(model.weeks).toHaveLength(2);
    expect(model.weeks[0].weekStart).toBe("2026-07-13");
    expect(model.weeks[0].days.map((d) => d.date)).toEqual(["2026-07-13", "2026-07-16"]);
    expect(model.weeks[1].weekStart).toBe("2026-07-20");
    expect(model.weeks[1].days.map((d) => d.date)).toEqual(["2026-07-20"]);
  });

  it("groups a week that straddles a year boundary", () => {
    const entriesByDate: Record<string, Entry> = {
      "2025-12-30": entry({ date: "2025-12-30", value: 8, intensity: 3 }), // Tuesday
      "2026-01-02": entry({ date: "2026-01-02", value: 4, intensity: 2 }), // Friday, same week (Monday-start)
    };

    const model = buildReportModel({
      entriesByDate,
      colorsList,
      bodiesByPath: {},
      startDate: "2025-12-29",
      endDate: "2026-01-04",
      weekStartDay: 1,
    });

    expect(model.weeks).toHaveLength(1);
    expect(model.weeks[0].weekStart).toBe("2025-12-29");
    expect(model.weeks[0].days.map((d) => d.date)).toEqual(["2025-12-30", "2026-01-02"]);
  });

  it("returns an empty model when nothing falls in range", () => {
    const model = buildReportModel({
      entriesByDate: {},
      colorsList,
      bodiesByPath: {},
      startDate: "2026-07-01",
      endDate: "2026-07-07",
      weekStartDay: 1,
    });

    expect(model.weeks).toEqual([]);
    expect(model.summary).toEqual({ totalDays: 0, totalValue: 0, activeWeeks: 0 });
  });

  it("computes summary totals across all included days", () => {
    const entriesByDate: Record<string, Entry> = {
      "2026-07-13": entry({ date: "2026-07-13", value: 8, intensity: 3 }),
      "2026-07-14": entry({ date: "2026-07-14", value: 5, intensity: 2 }),
    };

    const model = buildReportModel({
      entriesByDate,
      colorsList,
      bodiesByPath: {},
      startDate: "2026-07-13",
      endDate: "2026-07-14",
      weekStartDay: 1,
    });

    expect(model.summary).toEqual({ totalDays: 2, totalValue: 13, activeWeeks: 1 });
  });

  it("resolves the day color from customColor first, then the mapped intensity", () => {
    const entriesByDate: Record<string, Entry> = {
      "2026-07-13": entry({ date: "2026-07-13", value: 8, intensity: 3, customColor: "#d18616" }),
      "2026-07-14": entry({ date: "2026-07-14", value: 5, intensity: 2 }),
    };

    const model = buildReportModel({
      entriesByDate,
      colorsList,
      bodiesByPath: {},
      startDate: "2026-07-13",
      endDate: "2026-07-14",
      weekStartDay: 1,
    });

    const days = model.weeks[0].days;
    expect(days[0].color).toBe("#d18616");
    expect(days[1].color).toBe(colorsList[1]); // intensity 2 -> index 1
  });

  it("resolves the day body from bodiesByPath via filePath", () => {
    const entriesByDate: Record<string, Entry> = {
      "2026-07-13": entry({
        date: "2026-07-13",
        value: 8,
        intensity: 3,
        filePath: "Work Logs/2026-07-13.md",
      }),
    };

    const model = buildReportModel({
      entriesByDate,
      colorsList,
      bodiesByPath: { "Work Logs/2026-07-13.md": "- did a thing" },
      startDate: "2026-07-13",
      endDate: "2026-07-13",
      weekStartDay: 1,
    });

    expect(model.weeks[0].days[0].body).toBe("- did a thing");
  });

  it("leaves body undefined when filePath has no matching body", () => {
    const entriesByDate: Record<string, Entry> = {
      "2026-07-13": entry({
        date: "2026-07-13",
        value: 8,
        intensity: 3,
        filePath: "Work Logs/missing.md",
      }),
    };

    const model = buildReportModel({
      entriesByDate,
      colorsList,
      bodiesByPath: {},
      startDate: "2026-07-13",
      endDate: "2026-07-13",
      weekStartDay: 1,
    });

    expect(model.weeks[0].days[0].body).toBeUndefined();
  });

  it("falls back to string content when there is no filePath", () => {
    const entriesByDate: Record<string, Entry> = {
      "2026-07-13": entry({ date: "2026-07-13", value: 8, intensity: 3, content: "inline note" }),
    };

    const model = buildReportModel({
      entriesByDate,
      colorsList,
      bodiesByPath: {},
      startDate: "2026-07-13",
      endDate: "2026-07-13",
      weekStartDay: 1,
    });

    expect(model.weeks[0].days[0].body).toBe("inline note");
  });

  describe("legend valueOverride", () => {
    it("replaces a day's raw value with the matching legend entry's override", () => {
      // A leave day whose entry still carries a placeholder intensity of 1
      // (needed just to keep it colored/logged), even though no real hours
      // were worked — the legend says "Leave" should always report as 0.
      const entriesByDate: Record<string, Entry> = {
        "2026-07-13": entry({ date: "2026-07-13", value: 1, intensity: 1, customColor: "#8b949e" }),
      };

      const model = buildReportModel({
        entriesByDate,
        colorsList,
        bodiesByPath: {},
        startDate: "2026-07-13",
        endDate: "2026-07-13",
        weekStartDay: 1,
        legend: [{ color: "#8b949e", label: "Leave", valueOverride: 0 }],
      });

      expect(model.weeks[0].days[0].value).toBe(0);
      expect(model.summary.totalValue).toBe(0);
    });

    it("leaves the raw value alone when no legend entry matches the day's color", () => {
      const entriesByDate: Record<string, Entry> = {
        "2026-07-13": entry({ date: "2026-07-13", value: 8, intensity: 3 }),
      };

      const model = buildReportModel({
        entriesByDate,
        colorsList,
        bodiesByPath: {},
        startDate: "2026-07-13",
        endDate: "2026-07-13",
        weekStartDay: 1,
        legend: [{ color: "#8b949e", label: "Leave", valueOverride: 0 }],
      });

      expect(model.weeks[0].days[0].value).toBe(8);
      expect(model.summary.totalValue).toBe(8);
    });

    it("leaves the raw value alone when the matching legend entry has no override set", () => {
      const entriesByDate: Record<string, Entry> = {
        "2026-07-13": entry({ date: "2026-07-13", value: 1, intensity: 1, customColor: "#7bc96f" }),
      };

      const model = buildReportModel({
        entriesByDate,
        colorsList,
        bodiesByPath: {},
        startDate: "2026-07-13",
        endDate: "2026-07-13",
        weekStartDay: 1,
        legend: [{ color: "#7bc96f", label: "Workday" }],
      });

      expect(model.weeks[0].days[0].value).toBe(1);
    });
  });
});

describe("computeDataRange", () => {
  it("returns null when there are no entries", () => {
    expect(computeDataRange({})).toBeNull();
  });

  it("returns the min/max ISO date among entries regardless of insertion order", () => {
    const entriesByDate: Record<string, Entry> = {
      "2026-06-01": entry({ date: "2026-06-01" }),
      "2026-03-15": entry({ date: "2026-03-15" }),
      "2026-05-20": entry({ date: "2026-05-20" }),
    };

    expect(computeDataRange(entriesByDate)).toEqual({ start: "2026-03-15", end: "2026-06-01" });
  });

  it("handles a single entry", () => {
    expect(computeDataRange({ "2026-01-01": entry({ date: "2026-01-01" }) })).toEqual({
      start: "2026-01-01",
      end: "2026-01-01",
    });
  });
});
