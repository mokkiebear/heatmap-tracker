import { Entry, RangeBound, RangeUnit } from "src/types";
import { parseUTCDate } from "src/utils/date";
import { resolveRangeRule } from "../exportRange";

// 2026-10-07 is a Wednesday.
const WED = "2026-10-07";

function resolve(
  unit: RangeUnit,
  from: RangeBound,
  to: RangeBound,
  today = WED,
  weekStartDay = 1,
) {
  return resolveRangeRule(
    { kind: "periods", unit, from, to },
    { today: parseUTCDate(today), weekStartDay, entriesByDate: {} },
  );
}

describe("resolveRangeRule", () => {
  it.each<[RangeUnit, RangeBound, RangeBound, string, number, string, string]>([
    // Previous complete periods (N → 1).
    ["week", 1, 1, WED, 1, "2026-09-28", "2026-10-04"],
    ["week", 1, 1, WED, 0, "2026-09-27", "2026-10-03"],
    ["week", 2, 1, WED, 1, "2026-09-21", "2026-10-04"],
    ["month", 3, 1, WED, 1, "2026-07-01", "2026-09-30"],
    ["month", 1, 1, WED, 1, "2026-09-01", "2026-09-30"],
    ["year", 1, 1, WED, 1, "2025-01-01", "2025-12-31"],
    ["month", 1, 1, "2026-01-14", 1, "2025-12-01", "2025-12-31"],
    // Friday 2026-01-02: the current Monday-start week began 2025-12-29.
    ["week", 1, 1, "2026-01-02", 1, "2025-12-22", "2025-12-28"],
    ["day", 1, 1, WED, 1, "2026-10-06", "2026-10-06"],
    // A single older period.
    ["month", 2, 2, WED, 1, "2026-08-01", "2026-08-31"],
    // Through today (N → 0): from the start of the period N ago.
    ["week", 0, 0, WED, 1, "2026-10-05", WED],
    ["month", 0, 0, WED, 1, "2026-10-01", WED],
    ["year", 0, 0, WED, 1, "2026-01-01", WED],
    ["month", 2, 0, WED, 1, "2026-08-01", WED],
    ["week", 1, 0, WED, 1, "2026-09-28", WED],
    ["year", 1, 0, WED, 1, "2025-01-01", WED],
    ["day", 6, 0, WED, 1, "2026-10-01", WED],
    ["month", 1, 0, "2026-01-14", 1, "2025-12-01", "2026-01-14"],
    // Calendar quarters: Q4 2026 began Oct 1.
    ["quarter", 1, 1, WED, 1, "2026-07-01", "2026-09-30"],
    ["quarter", 0, 0, WED, 1, "2026-10-01", WED],
    ["quarter", 0, 0, "2026-09-30", 1, "2026-07-01", "2026-09-30"],
    ["quarter", 1, 1, "2026-02-10", 1, "2025-10-01", "2025-12-31"],
    ["quarter", 4, 1, "2026-02-10", 1, "2025-01-01", "2025-12-31"],
    // Fixed dates, alone or mixed with a relative end, even in the future.
    ["day", "2026-09-01", 0, WED, 1, "2026-09-01", WED],
    ["day", WED, 0, WED, 1, WED, WED],
    ["month", 1, "2026-12-31", WED, 1, "2026-09-01", "2026-12-31"],
    ["month", "2026-01-15", 1, WED, 1, "2026-01-15", "2026-09-30"],
    ["day", "2026-09-01", "2026-12-18", WED, 1, "2026-09-01", "2026-12-18"],
  ])(
    "%s %p → %p on %s (week starts %i) is %s to %s",
    (unit, from, to, today, weekStartDay, start, end) => {
      expect(resolve(unit, from, to, today, weekStartDay)).toEqual({
        start,
        end,
      });
    },
  );

  it.each<[RangeUnit, RangeBound, RangeBound]>([
    // A missing or malformed date.
    ["day", "", 0],
    ["day", "nope", 0],
    ["day", 1, ""],
    // A start after the end.
    ["month", 1, 2],
    ["week", 0, 1],
    ["day", "2026-10-08", 0],
    ["day", "2026-12-01", "2026-11-01"],
    // A periods-ago count that isn't a whole number, 0 or more.
    ...[-1, 1.5, NaN].flatMap(
      (count): [RangeUnit, RangeBound, RangeBound][] => [
        ["week", count, 0],
        ["week", 2, count],
      ],
    ),
  ])("rejects %s %p → %p", (unit, from, to) => {
    expect(resolve(unit, from, to)).toBeNull();
  });

  it("spans the earliest to the latest logged day, or nothing", () => {
    const context = { today: parseUTCDate(WED), weekStartDay: 1 };
    const entriesByDate: Record<string, Entry> = {
      "2026-03-02": { date: "2026-03-02" },
      "2026-01-15": { date: "2026-01-15" },
    };

    expect(
      resolveRangeRule({ kind: "logged" }, { ...context, entriesByDate }),
    ).toEqual({ start: "2026-01-15", end: "2026-03-02" });
    expect(
      resolveRangeRule({ kind: "logged" }, { ...context, entriesByDate: {} }),
    ).toBeNull();
  });
});
