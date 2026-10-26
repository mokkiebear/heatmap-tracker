import { Entry, RangeBound, RangeRule, RangeUnit } from "src/types";
import { parseUTCDate } from "src/utils/date";
import { resolveRangeRule } from "../exportRange";

function resolve(
  rule: RangeRule,
  today: string,
  weekStartDay = 1,
  entriesByDate: Record<string, Entry> = {},
) {
  return resolveRangeRule(rule, {
    today: parseUTCDate(today),
    weekStartDay,
    entriesByDate,
  });
}

const periods = (
  unit: RangeUnit,
  from: RangeBound,
  to: RangeBound,
): RangeRule => ({ kind: "periods", unit, from, to });

// 2026-10-07 is a Wednesday.
const WED = "2026-10-07";

describe("resolveRangeRule", () => {
  describe("previous complete periods (N → 1)", () => {
    it("covers last complete week for a Monday-start week", () => {
      expect(resolve(periods("week", 1, 1), WED, 1)).toEqual({
        start: "2026-09-28",
        end: "2026-10-04",
      });
    });

    it("covers last complete week for a Sunday-start week", () => {
      expect(resolve(periods("week", 1, 1), WED, 0)).toEqual({
        start: "2026-09-27",
        end: "2026-10-03",
      });
    });

    it("covers several complete periods", () => {
      expect(resolve(periods("week", 2, 1), WED)).toEqual({
        start: "2026-09-21",
        end: "2026-10-04",
      });
      expect(resolve(periods("month", 3, 1), WED)).toEqual({
        start: "2026-07-01",
        end: "2026-09-30",
      });
    });

    it("covers last month and last year", () => {
      expect(resolve(periods("month", 1, 1), WED)).toEqual({
        start: "2026-09-01",
        end: "2026-09-30",
      });
      expect(resolve(periods("year", 1, 1), WED)).toEqual({
        start: "2025-01-01",
        end: "2025-12-31",
      });
    });

    it("crosses a year boundary", () => {
      expect(resolve(periods("month", 1, 1), "2026-01-14")).toEqual({
        start: "2025-12-01",
        end: "2025-12-31",
      });
      // Friday 2026-01-02: the current Monday-start week began 2025-12-29.
      expect(resolve(periods("week", 1, 1), "2026-01-02")).toEqual({
        start: "2025-12-22",
        end: "2025-12-28",
      });
    });

    it("treats yesterday as the previous day", () => {
      expect(resolve(periods("day", 1, 1), WED)).toEqual({
        start: "2026-10-06",
        end: "2026-10-06",
      });
    });
  });

  describe("through today (N → 0)", () => {
    it("runs from the start of the current period through today", () => {
      expect(resolve(periods("week", 0, 0), WED)).toEqual({
        start: "2026-10-05",
        end: WED,
      });
      expect(resolve(periods("month", 0, 0), WED)).toEqual({
        start: "2026-10-01",
        end: WED,
      });
      expect(resolve(periods("year", 0, 0), WED)).toEqual({
        start: "2026-01-01",
        end: WED,
      });
    });

    it("reaches back to the start of the period N ago", () => {
      expect(resolve(periods("month", 2, 0), WED)).toEqual({
        start: "2026-08-01",
        end: WED,
      });
      expect(resolve(periods("week", 1, 0), WED)).toEqual({
        start: "2026-09-28",
        end: WED,
      });
      expect(resolve(periods("year", 1, 0), WED)).toEqual({
        start: "2025-01-01",
        end: WED,
      });
    });

    it("counts today as the last of N + 1 days", () => {
      expect(resolve(periods("day", 6, 0), WED)).toEqual({
        start: "2026-10-01",
        end: WED,
      });
    });

    it("crosses a year boundary", () => {
      expect(resolve(periods("month", 1, 0), "2026-01-14")).toEqual({
        start: "2025-12-01",
        end: "2026-01-14",
      });
    });
  });

  describe("quarters", () => {
    it("follows calendar quarters", () => {
      // Q4 2026 began Oct 1, so last quarter is Q3.
      expect(resolve(periods("quarter", 1, 1), WED)).toEqual({
        start: "2026-07-01",
        end: "2026-09-30",
      });
      expect(resolve(periods("quarter", 0, 0), WED)).toEqual({
        start: "2026-10-01",
        end: WED,
      });
      expect(resolve(periods("quarter", 0, 0), "2026-09-30")).toEqual({
        start: "2026-07-01",
        end: "2026-09-30",
      });
    });

    it("crosses a year boundary", () => {
      expect(resolve(periods("quarter", 1, 1), "2026-02-10")).toEqual({
        start: "2025-10-01",
        end: "2025-12-31",
      });
      expect(resolve(periods("quarter", 4, 1), "2026-02-10")).toEqual({
        start: "2025-01-01",
        end: "2025-12-31",
      });
    });
  });

  it("covers a single older period when N equals M", () => {
    expect(resolve(periods("month", 2, 2), WED)).toEqual({
      start: "2026-08-01",
      end: "2026-08-31",
    });
  });

  describe("fixed dates", () => {
    it("runs from a fixed date through today", () => {
      expect(resolve(periods("day", "2026-09-01", 0), WED)).toEqual({
        start: "2026-09-01",
        end: WED,
      });
      expect(resolve(periods("day", WED, 0), WED)).toEqual({
        start: WED,
        end: WED,
      });
    });

    it("mixes a fixed end with a relative start, and vice versa", () => {
      expect(resolve(periods("month", 1, "2026-12-31"), WED)).toEqual({
        start: "2026-09-01",
        end: "2026-12-31",
      });
      expect(resolve(periods("month", "2026-01-15", 1), WED)).toEqual({
        start: "2026-01-15",
        end: "2026-09-30",
      });
    });

    it("spans two fixed dates, even into the future", () => {
      expect(resolve(periods("day", "2026-09-01", "2026-12-18"), WED)).toEqual({
        start: "2026-09-01",
        end: "2026-12-18",
      });
    });

    it("rejects a missing or malformed date", () => {
      expect(resolve(periods("day", "", 0), WED)).toBeNull();
      expect(resolve(periods("day", "nope", 0), WED)).toBeNull();
      expect(resolve(periods("day", 1, ""), WED)).toBeNull();
    });
  });

  it("rejects a start after the end", () => {
    expect(resolve(periods("month", 1, 2), WED)).toBeNull();
    expect(resolve(periods("week", 0, 1), WED)).toBeNull();
    expect(resolve(periods("day", "2026-10-08", 0), WED)).toBeNull();
    expect(resolve(periods("day", "2026-12-01", "2026-11-01"), WED)).toBeNull();
  });

  it("rejects a periods-ago count that isn't a whole number, 0 or more", () => {
    for (const count of [-1, 1.5, NaN]) {
      expect(resolve(periods("week", count, 0), WED)).toBeNull();
      expect(resolve(periods("week", 2, count), WED)).toBeNull();
    }
  });

  describe("logged", () => {
    it("spans the earliest to the latest logged day", () => {
      const entries: Record<string, Entry> = {
        "2026-03-02": { date: "2026-03-02" },
        "2026-01-15": { date: "2026-01-15" },
      };

      expect(resolve({ kind: "logged" }, WED, 1, entries)).toEqual({
        start: "2026-01-15",
        end: "2026-03-02",
      });
    });

    it("is null with nothing logged", () => {
      expect(resolve({ kind: "logged" }, WED)).toBeNull();
    });
  });
});
