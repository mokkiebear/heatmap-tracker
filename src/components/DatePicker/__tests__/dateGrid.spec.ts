import { buildDayGrid, parseISO, parseTypedISO, toISO } from "../dateGrid";

describe("toISO", () => {
  it("formats year/month/day (0-indexed month) as yyyy-mm-dd", () => {
    expect(toISO(2026, 6, 5)).toBe("2026-07-05");
  });

  it("zero-pads month and day", () => {
    expect(toISO(2026, 0, 1)).toBe("2026-01-01");
  });
});

describe("parseISO", () => {
  it("parses a well-formed ISO date into 0-indexed parts", () => {
    expect(parseISO("2026-07-13")).toEqual({ year: 2026, month: 6, day: 13 });
  });

  it("returns null for an empty string", () => {
    expect(parseISO("")).toBeNull();
  });
});

describe("parseTypedISO", () => {
  it("accepts a well-formed yyyy-mm-dd", () => {
    expect(parseTypedISO("2026-07-13")).toBe("2026-07-13");
  });

  it("accepts single-digit month/day and normalizes to zero-padded", () => {
    expect(parseTypedISO("2026-7-3")).toBe("2026-07-03");
  });

  it("rejects a calendar date that doesn't exist (Feb 30)", () => {
    expect(parseTypedISO("2026-02-30")).toBeNull();
  });

  it("rejects an out-of-range month", () => {
    expect(parseTypedISO("2026-13-01")).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(parseTypedISO("not a date")).toBeNull();
    expect(parseTypedISO("07/13/2026")).toBeNull();
  });

  it("trims surrounding whitespace", () => {
    expect(parseTypedISO("  2026-07-13  ")).toBe("2026-07-13");
  });
});

describe("buildDayGrid", () => {
  it("always returns exactly 42 cells (a 6-week grid)", () => {
    expect(buildDayGrid(2026, 6, 1)).toHaveLength(42);
  });

  it("starts the grid on Monday when weekStartDay is 1", () => {
    // Jul 1, 2026 is a Wednesday; with Monday as the first column, the grid
    // should lead with Jun 29-30 (Mon, Tue) as overflow before Jul 1.
    const cells = buildDayGrid(2026, 6, 1);
    expect(cells[0]).toEqual({ iso: "2026-06-29", day: 29, inMonth: false });
    expect(cells[1]).toEqual({ iso: "2026-06-30", day: 30, inMonth: false });
    expect(cells[2]).toEqual({ iso: "2026-07-01", day: 1, inMonth: true });
  });

  it("starts the grid on Sunday when weekStartDay is 0", () => {
    // Jul 1, 2026 (Wed) is 3 days after Sunday Jun 28.
    const cells = buildDayGrid(2026, 6, 0);
    expect(cells[0]).toEqual({ iso: "2026-06-28", day: 28, inMonth: false });
    expect(cells[3]).toEqual({ iso: "2026-07-01", day: 1, inMonth: true });
  });

  it("pads the tail of the grid with the next month's overflow days", () => {
    const cells = buildDayGrid(2026, 6, 1); // July 2026, Monday-start
    const last = cells[cells.length - 1];
    expect(last.inMonth).toBe(false);
    expect(last.iso.startsWith("2026-08")).toBe(true);
  });

  it("handles a December -> January month rollover for the trailing overflow", () => {
    const cells = buildDayGrid(2025, 11, 1); // December 2025
    const last = cells[cells.length - 1];
    expect(last.iso.startsWith("2026-01")).toBe(true);
  });

  it("handles a January -> December rollover for the leading overflow", () => {
    // Jan 1, 2026 is a Thursday; with Monday-start, leading overflow comes from December 2025.
    const cells = buildDayGrid(2026, 0, 1);
    expect(cells[0].iso.startsWith("2025-12")).toBe(true);
  });
});
