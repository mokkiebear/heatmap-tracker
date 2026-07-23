import { Entry } from "src/types";
import { addDays, formatDateToISO8601, parseUTCDate } from "src/utils/date";
import {
  EMPTY_CELL_COLOR,
  MAX_WEEKS_PER_BAND,
  buildHeatmapGridHtml,
  countBandsInRange,
  countWeeksInRange,
  escapeHtml,
} from "../heatmapHtml";

const colorsList = ["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"];

function countDayCells(html: string): number {
  return (html.match(/width:12px;height:12px;border-radius:2px;background-color:/g) ?? []).length;
}

function countTransparentCells(html: string): number {
  return (html.match(/background-color:transparent/g) ?? []).length;
}

/** Splits a rendered grid's HTML into one string per band, for per-band assertions. */
function splitBands(html: string): string[] {
  return html.split('<div style="display:inline-grid').slice(1);
}

function countMonthLabels(html: string): number {
  return (html.match(/>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)</g) ?? []).length;
}

describe("escapeHtml", () => {
  it("escapes the five HTML-sensitive characters", () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;",
    );
  });
});

describe("countWeeksInRange", () => {
  it("counts a single week-slot spanning part of the range", () => {
    expect(countWeeksInRange("2026-07-13", "2026-07-15", 1)).toBe(1);
  });

  it("counts multiple week-slots", () => {
    expect(countWeeksInRange("2026-07-13", "2026-07-20", 1)).toBe(2);
  });

  it("counts extra week-slots inserted by month gaps when splitByMonth is on", () => {
    const without = countWeeksInRange("2026-06-01", "2026-07-19", 1, false);
    const withGaps = countWeeksInRange("2026-06-01", "2026-07-19", 1, true);
    expect(withGaps).toBeGreaterThan(without);
  });
});

describe("countBandsInRange", () => {
  it("fits a 12-month range in 2 bands for columns (max 10 months/band)", () => {
    expect(countBandsInRange("2025-01-01", "2025-12-31", 1, "columns", true)).toBe(2);
  });

  it("fits the same 12-month range in 2 bands for rows too (max 6 months/band)", () => {
    expect(countBandsInRange("2025-01-01", "2025-12-31", 1, "rows", true)).toBe(2);
  });

  it("a 7-month range needs only 1 band for columns but 2 for rows", () => {
    expect(countBandsInRange("2025-01-01", "2025-07-31", 1, "columns", true)).toBe(1);
    expect(countBandsInRange("2025-01-01", "2025-07-31", 1, "rows", true)).toBe(2);
  });

  it("falls back to week-slot counting when splitByMonth is off", () => {
    const start = "2025-01-06"; // a Monday
    const longEnd = formatDateToISO8601(addDays(parseUTCDate(start), 60 * 7 - 1)) as string; // 60-week span
    expect(countBandsInRange(start, longEnd, 1, "columns", false)).toBe(2);
  });
});

describe("buildHeatmapGridHtml", () => {
  it("renders as an inline CSS grid, left-aligned and never as a <table>", () => {
    const html = buildHeatmapGridHtml({
      entriesByDate: {},
      colorsList,
      startDate: "2026-07-13",
      endDate: "2026-07-15",
      weekStartDay: 1,
      orientation: "columns",
    });

    expect(html).toContain("display:inline-grid");
    expect(html).toContain('style="display:block;margin:0;text-align:left;"');
    expect(html).not.toContain("<table>");
    expect(html).not.toContain("<style>");
  });

  it("renders transparent cells for days outside the range, within the grid's one week-slot", () => {
    const html = buildHeatmapGridHtml({
      entriesByDate: {},
      colorsList,
      startDate: "2026-07-13",
      endDate: "2026-07-15",
      weekStartDay: 1,
      orientation: "columns",
    });

    // 3 in-range days (colored with the empty-cell fallback) + 4 out-of-range (transparent).
    expect(countDayCells(html)).toBe(7);
    expect(countTransparentCells(html)).toBe(4);
  });

  it("produces the same cell counts in rows orientation (transposed)", () => {
    const html = buildHeatmapGridHtml({
      entriesByDate: {},
      colorsList,
      startDate: "2026-07-13",
      endDate: "2026-07-15",
      weekStartDay: 1,
      orientation: "rows",
    });

    expect(countDayCells(html)).toBe(7);
    expect(countTransparentCells(html)).toBe(4);
  });

  it("colors in-range cells from customColor first, then mapped intensity", () => {
    const entriesByDate: Record<string, Entry> = {
      "2026-07-13": { date: "2026-07-13", value: 8, intensity: 3, customColor: "#d18616" },
      "2026-07-14": { date: "2026-07-14", value: 5, intensity: 2 },
    };

    const html = buildHeatmapGridHtml({
      entriesByDate,
      colorsList,
      startDate: "2026-07-13",
      endDate: "2026-07-14",
      weekStartDay: 1,
      orientation: "columns",
    });

    expect(html).toContain("background-color:#d18616");
    expect(html).toContain(`background-color:${colorsList[1]}`);
  });

  it("shows a legend valueOverride in the day's tooltip instead of its raw value", () => {
    // A leave day whose entry carries a placeholder intensity of 1 just to
    // stay colored/logged, even though no real hours were worked.
    const entriesByDate: Record<string, Entry> = {
      "2026-07-13": { date: "2026-07-13", value: 1, intensity: 1, customColor: "#8b949e" },
    };

    const html = buildHeatmapGridHtml({
      entriesByDate,
      colorsList,
      startDate: "2026-07-13",
      endDate: "2026-07-13",
      weekStartDay: 1,
      orientation: "columns",
      legend: [{ color: "#8b949e", label: "Leave", valueOverride: 0 }],
    });

    expect(html).toContain('title="2026-07-13: 0"');
    expect(html).not.toContain('title="2026-07-13: 1"');
  });

  it("falls back to the theme border color for blank in-range days", () => {
    const html = buildHeatmapGridHtml({
      entriesByDate: {},
      colorsList,
      startDate: "2026-07-13",
      endDate: "2026-07-13",
      weekStartDay: 1,
      orientation: "columns",
    });

    expect(html).toContain(`background-color:${EMPTY_CELL_COLOR}`);
  });

  it("shifts the weekday header order to match weekStartDay, in columns mode's full-name labels", () => {
    const htmlMonday = buildHeatmapGridHtml({
      entriesByDate: {},
      colorsList,
      startDate: "2026-07-13",
      endDate: "2026-07-19",
      weekStartDay: 1,
      orientation: "columns",
    });
    const htmlSunday = buildHeatmapGridHtml({
      entriesByDate: {},
      colorsList,
      startDate: "2026-07-13",
      endDate: "2026-07-19",
      weekStartDay: 0,
      orientation: "columns",
    });

    expect(htmlMonday.indexOf(">Mon<")).toBeLessThan(htmlMonday.indexOf(">Sun<"));
    expect(htmlSunday.indexOf(">Sun<")).toBeLessThan(htmlSunday.indexOf(">Mon<"));
  });

  it("uses single-letter weekday labels in rows mode, where they're column headers", () => {
    const html = buildHeatmapGridHtml({
      entriesByDate: {},
      colorsList,
      startDate: "2026-07-13",
      endDate: "2026-07-19",
      weekStartDay: 1,
      orientation: "rows",
    });

    expect(html).not.toContain(">Mon<");
    expect(html).toContain(">M<");
  });

  it("omits week header labels when neither week-number nor week-start-date is requested", () => {
    const html = buildHeatmapGridHtml({
      entriesByDate: {},
      colorsList,
      startDate: "2026-07-13",
      endDate: "2026-07-19",
      weekStartDay: 1,
      orientation: "columns",
    });

    expect(html).not.toContain("Wk ");
  });

  it("shows the week-start day-of-month number when requested", () => {
    const html = buildHeatmapGridHtml({
      entriesByDate: {},
      colorsList,
      startDate: "2026-07-13",
      endDate: "2026-07-19",
      weekStartDay: 1,
      orientation: "columns",
      showWeekStartDate: true,
    });

    expect(html).toContain(">13<");
  });

  describe("band wrapping", () => {
    const start = "2025-01-06"; // a Monday
    const longEnd = formatDateToISO8601(addDays(parseUTCDate(start), 60 * 7 - 1)) as string; // 60-week span

    it("renders a single grid (one band) for a short range", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2026-07-13",
        endDate: "2026-07-19",
        weekStartDay: 1,
        orientation: "columns",
      });

      expect((html.match(/display:inline-grid/g) ?? []).length).toBe(1);
    });

    it("cuts a range longer than MAX_WEEKS_PER_BAND into multiple bands, stacked vertically for columns", () => {
      expect(countWeeksInRange(start, longEnd, 1)).toBeGreaterThan(MAX_WEEKS_PER_BAND);

      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: start,
        endDate: longEnd,
        weekStartDay: 1,
        orientation: "columns",
      });

      expect((html.match(/display:inline-grid/g) ?? []).length).toBe(2);
      expect(html).toContain("flex-direction:column");
    });

    it("cuts the same long range into multiple bands, stacked horizontally for rows", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: start,
        endDate: longEnd,
        weekStartDay: 1,
        orientation: "rows",
      });

      expect((html.match(/display:inline-grid/g) ?? []).length).toBe(2);
      expect(html).toContain("flex-direction:row");
    });

    it("evens out months across bands instead of front-loading the max into the first one", () => {
      // 12 months over the columns cap of 10/band should split 6+6, not 10+2.
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        weekStartDay: 1,
        orientation: "columns",
        splitByMonth: true,
        showMonthLabels: true,
      });

      const bands = splitBands(html);
      expect(bands).toHaveLength(2);
      expect(bands.map(countMonthLabels)).toEqual([6, 6]);
    });

    it("uses a smaller per-band month cap for rows than columns", () => {
      // Same 7-month range: fits in 1 band for columns (cap 10), needs 2 for rows (cap 6).
      const columnsHtml = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2025-01-01",
        endDate: "2025-07-31",
        weekStartDay: 1,
        orientation: "columns",
        splitByMonth: true,
        showMonthLabels: true,
      });
      const rowsHtml = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2025-01-01",
        endDate: "2025-07-31",
        weekStartDay: 1,
        orientation: "rows",
        splitByMonth: true,
        showMonthLabels: true,
      });

      expect(splitBands(columnsHtml)).toHaveLength(1);
      const rowsBands = splitBands(rowsHtml);
      expect(rowsBands).toHaveLength(2);
      expect(rowsBands.map(countMonthLabels)).toEqual([4, 3]);
    });

    it("keeps the 6-month-per-band cap for rows at exactly 24 months (4 bands)", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2024-01-01",
        endDate: "2025-12-31", // 24 months
        weekStartDay: 1,
        orientation: "rows",
        splitByMonth: true,
        showMonthLabels: true,
      });

      const bands = splitBands(html);
      expect(bands).toHaveLength(4);
      expect(bands.map(countMonthLabels)).toEqual([6, 6, 6, 6]);
    });

    it("caps rows mode at 4 bands total beyond 24 months, growing per-band count instead", () => {
      // 42 months: 42/4 = 10.5 -> 11 per band, last band gets the remainder.
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2023-01-01",
        endDate: "2026-06-30", // 42 months
        weekStartDay: 1,
        orientation: "rows",
        splitByMonth: true,
        showMonthLabels: true,
      });

      const bands = splitBands(html);
      expect(bands).toHaveLength(4);
      expect(bands.map(countMonthLabels)).toEqual([11, 11, 11, 9]);
    });

    it("does not cap columns mode's band count the same way", () => {
      // Same 42-month range: columns has no band-count cap, only a
      // 10-months-per-band cap, so it should use 5 bands (ceil(42/10)), not 4.
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2023-01-01",
        endDate: "2026-06-30",
        weekStartDay: 1,
        orientation: "columns",
        splitByMonth: true,
        showMonthLabels: true,
      });

      const bands = splitBands(html);
      expect(bands).toHaveLength(5);
      bands.forEach((band) => expect(countMonthLabels(band)).toBeLessThanOrEqual(10));
    });
  });

  describe("year header", () => {
    it("shows a year row above the month row in columns mode, when the range spans multiple years", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2025-12-01",
        endDate: "2026-02-28",
        weekStartDay: 1,
        orientation: "columns",
        splitByMonth: true,
        showMonthLabels: true,
      });

      expect(html).toContain(">2025<");
      expect(html).toContain(">2026<");
      // The year row is pushed first (grid-row 1), the month row after it.
      expect(html.indexOf(">2025<")).toBeLessThan(html.indexOf(">Dec<"));
      expect(html).toMatch(/grid-row:1;[^"]*">2025</);
    });

    it("shows a year column to the left of the month column in rows mode", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2025-12-01",
        endDate: "2026-02-28",
        weekStartDay: 1,
        orientation: "rows",
        splitByMonth: true,
        showMonthLabels: true,
      });

      expect(html).toContain(">2025<");
      expect(html).toContain(">2026<");
      // Year sits in column 1, month in column 2 — year renders first.
      expect(html.indexOf(">2025<")).toBeLessThan(html.indexOf(">Dec<"));
      expect(html).toMatch(/grid-column:1;grid-row:\d+ \/ span \d+;[^"]*">2025</);
    });

    it("renders the rows-mode year label with vertical text, to stay narrow across many side-by-side bands", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2025-12-01",
        endDate: "2026-02-28",
        weekStartDay: 1,
        orientation: "rows",
        splitByMonth: true,
        showMonthLabels: true,
      });

      expect(html).toMatch(/grid-column:1;grid-row:\d+ \/ span \d+;[^"]*writing-mode:vertical-rl[^"]*">2025</);
    });

    it("keeps the columns-mode year row horizontal (not rotated)", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2025-12-01",
        endDate: "2026-02-28",
        weekStartDay: 1,
        orientation: "columns",
        splitByMonth: true,
        showMonthLabels: true,
      });

      expect(html).not.toContain("writing-mode");
    });

    it("omits the year header when the range stays within a single year", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2025-01-01",
        endDate: "2025-07-31",
        weekStartDay: 1,
        orientation: "columns",
        splitByMonth: true,
        showMonthLabels: true,
      });

      expect(html).not.toContain(">2025<");
    });

    it("omits the year header when month labels are off, even across a year boundary", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2025-12-01",
        endDate: "2026-02-28",
        weekStartDay: 1,
        orientation: "columns",
        splitByMonth: true,
        showMonthLabels: false,
      });

      expect(html).not.toContain(">2025<");
      expect(html).not.toContain(">2026<");
    });
  });

  describe("skipWeekends", () => {
    it("renders only 5 day-cells per week in columns orientation", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2026-07-13", // Mon
        endDate: "2026-07-19", // Sun, one full week
        weekStartDay: 1,
        orientation: "columns",
        skipWeekends: true,
      });

      expect(countDayCells(html)).toBe(5);
      expect(html).not.toContain(">Sat<");
      expect(html).not.toContain(">Sun<");
    });

    it("renders only 5 day-cells per week in rows orientation", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2026-07-13",
        endDate: "2026-07-19",
        weekStartDay: 1,
        orientation: "rows",
        skipWeekends: true,
      });

      // rows mode uses single-letter weekday headers (see below), so check the
      // column count directly rather than searching for a "Sat"/"Sun" label.
      expect(countDayCells(html)).toBe(5);
    });
  });

  describe("splitByMonth and showMonthLabels (decoupled)", () => {
    const weekStartDay = 1;
    const startDate = "2026-06-01";
    const endDate = "2026-07-19";

    it("labels each month's columns with a grid-column span, even without splitByMonth", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate,
        endDate,
        weekStartDay,
        orientation: "columns",
        showMonthLabels: true,
      });

      const junIndex = html.indexOf(">Jun<");
      const julIndex = html.indexOf(">Jul<");
      expect(junIndex).toBeGreaterThan(-1);
      expect(julIndex).toBeGreaterThan(-1);
      expect(junIndex).toBeLessThan(julIndex);
      expect(html).toMatch(/grid-column:\d+ \/ span \d+/);
    });

    it("uses a grid-row span for month grouping in rows orientation", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate,
        endDate,
        weekStartDay,
        orientation: "rows",
        showMonthLabels: true,
      });

      expect(html).toContain(">Jun<");
      expect(html).toContain(">Jul<");
      expect(html).toMatch(/grid-row:\d+ \/ span \d+/);
    });

    it("splits a week straddling two months at the exact day boundary, not at the week boundary", () => {
      // 2026-06-29 (Mon) .. 2026-07-05 (Sun) is a single calendar week, with
      // Jul 1 (Wed) in the middle of it. The native day-by-day algorithm must
      // use only 2 week-slots total for this range (not 3, which a
      // whole-week-per-month grouping would produce), splitting the week at
      // the day boundary exactly like the live heatmap does.
      expect(countWeeksInRange("2026-06-29", "2026-07-05", 1, true)).toBe(2);

      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2026-06-29",
        endDate: "2026-07-05",
        weekStartDay: 1,
        orientation: "columns",
        splitByMonth: true,
        showMonthLabels: true,
      });

      expect(html).toContain(">Jun<");
      expect(html).toContain(">Jul<");
    });

    it("shows the week-start date only once across a month-split week, not on both halves", () => {
      // Same straddling week as above: Jun 29-30 and Jul 1-5 both belong to
      // the calendar week starting Jun 29, but land in two different
      // week-slots. Without the fix, both slots would show "29".
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2026-06-29",
        endDate: "2026-07-05",
        weekStartDay: 1,
        orientation: "columns",
        splitByMonth: true,
        showWeekStartDate: true,
      });

      expect((html.match(/>29</g) ?? []).length).toBe(1);
    });

    it("splits the grid with a blank gap but shows no header text when only splitByMonth is on", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2026-06-29",
        endDate: "2026-07-05",
        weekStartDay: 1,
        orientation: "columns",
        splitByMonth: true,
      });

      expect(html).not.toContain(">Jun<");
      expect(html).not.toContain(">Jul<");
      expect(html).not.toMatch(/\/ span/);
      // 2 week-slots x 7 day-rows, instead of 1 x 7 without the split.
      expect(countDayCells(html)).toBe(14);
    });

    it("does not split or label anything when both are off", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate,
        endDate,
        weekStartDay,
        orientation: "columns",
        splitByMonth: false,
        showMonthLabels: false,
      });

      expect(html).not.toContain(">Jun<");
      expect(html).not.toMatch(/\/ span/);
    });
  });

  describe("leading label alignment", () => {
    it("right-aligns the weekday label column in columns mode, with extra margin from the grid", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2026-07-13",
        endDate: "2026-07-19",
        weekStartDay: 1,
        orientation: "columns",
      });

      // `justify-self:end` is the property that actually matters visually —
      // the grid container sets `justify-items:center`, which would otherwise
      // center this (content-sized) box and leave the inner flexbox
      // alignment with no slack to shift text by.
      expect(html).toMatch(
        /grid-column:1;grid-row:\d+;[^"]*justify-content:flex-end[^"]*margin-right:4px[^"]*justify-self:end/,
      );
    });

    it("right-aligns the week-start-date column in rows mode, with extra margin from the grid", () => {
      const html = buildHeatmapGridHtml({
        entriesByDate: {},
        colorsList,
        startDate: "2026-07-13",
        endDate: "2026-07-19",
        weekStartDay: 1,
        orientation: "rows",
        showWeekStartDate: true,
      });

      // `justify-self:end` is the property that actually matters visually —
      // the grid container sets `justify-items:center`, which would otherwise
      // center this (content-sized) box and leave the inner flexbox
      // alignment with no slack to shift text by.
      expect(html).toMatch(
        /grid-column:1;grid-row:\d+;[^"]*justify-content:flex-end[^"]*margin-right:4px[^"]*justify-self:end/,
      );
    });
  });
});
