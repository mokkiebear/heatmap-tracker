import { Entry } from "src/types";
import { addDays, formatDateToISO8601, parseUTCDate } from "src/utils/date";
import {
  EMPTY_CELL_COLOR,
  HeatmapGridOptions,
  MAX_WEEKS_PER_BAND,
  buildHeatmapGridHtml,
  countBandsInRange,
  escapeHtml,
} from "../heatmapHtml";

const colorsList = ["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"];

/** A grid over `startDate`–`endDate`, empty, Monday-start, weeks as columns, unless overridden. */
function grid(
  startDate: string,
  endDate: string,
  overrides: Partial<HeatmapGridOptions> = {},
): string {
  return buildHeatmapGridHtml({
    entriesByDate: {},
    colorsList,
    startDate,
    endDate,
    weekStartDay: 1,
    orientation: "columns",
    ...overrides,
  });
}

/** The inline style of the label div whose text is `text`. */
function styleOf(html: string, text: string): string {
  const match = html.match(new RegExp(`style="([^"]*)">${text}</div>`));
  if (!match) throw new Error(`No label "${text}" in the grid`);
  return match[1];
}

function countDayCells(html: string): number {
  return (
    html.match(/width:12px;height:12px;border-radius:2px;background-color:/g) ??
    []
  ).length;
}

function countTransparentCells(html: string): number {
  return (html.match(/background-color:transparent/g) ?? []).length;
}

/** Splits a rendered grid's HTML into one string per band, for per-band assertions. */
function splitBands(html: string): string[] {
  return html.split('<div style="display:inline-grid').slice(1);
}

function countMonthLabels(html: string): number {
  return (
    html.match(/>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)</g) ?? []
  ).length;
}

describe("escapeHtml", () => {
  it("escapes the five HTML-sensitive characters", () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;",
    );
  });
});

describe("buildHeatmapGridHtml", () => {
  it("renders as an inline CSS grid, left-aligned and never as a <table>", () => {
    const html = grid("2026-07-13", "2026-07-15");

    expect(html).toContain("display:inline-grid");
    expect(html).toContain('style="display:block;margin:0;text-align:left;"');
    expect(html).not.toContain("<table>");
    expect(html).not.toContain("<style>");
  });

  it.each(["columns", "rows"] as const)(
    "pads the range's one week-slot with transparent cells in %s mode",
    (orientation) => {
      const html = grid("2026-07-13", "2026-07-15", { orientation });

      // 3 in-range days, blank so in the theme border color, + 4 outside it.
      expect(countDayCells(html)).toBe(7);
      expect(countTransparentCells(html)).toBe(4);
      expect(html.split(`background-color:${EMPTY_CELL_COLOR}`)).toHaveLength(
        4,
      );
    },
  );

  it("colors in-range cells from customColor first, then mapped intensity", () => {
    const entriesByDate: Record<string, Entry> = {
      "2026-07-13": {
        date: "2026-07-13",
        value: 8,
        intensity: 3,
        customColor: "#d18616",
      },
      "2026-07-14": { date: "2026-07-14", value: 5, intensity: 2 },
    };

    const html = grid("2026-07-13", "2026-07-14", { entriesByDate });

    expect(html).toContain("background-color:#d18616");
    expect(html).toContain(`background-color:${colorsList[1]}`);
  });

  it("shows a legend valueOverride in the day's tooltip instead of its raw value", () => {
    // A leave day whose entry carries a placeholder intensity of 1 just to
    // stay colored/logged, even though no real hours were worked.
    const entriesByDate: Record<string, Entry> = {
      "2026-07-13": {
        date: "2026-07-13",
        value: 1,
        intensity: 1,
        customColor: "#8b949e",
      },
    };

    const html = grid("2026-07-13", "2026-07-13", {
      entriesByDate,
      legend: [{ color: "#8b949e", label: "Leave", valueOverride: 0 }],
    });

    expect(html).toContain('title="2026-07-13: 0"');
    expect(html).not.toContain('title="2026-07-13: 1"');
  });

  it("shifts the weekday header order to match weekStartDay, in columns mode's full-name labels", () => {
    const htmlMonday = grid("2026-07-13", "2026-07-19");
    const htmlSunday = grid("2026-07-13", "2026-07-19", { weekStartDay: 0 });

    expect(htmlMonday.indexOf(">Mon<")).toBeLessThan(
      htmlMonday.indexOf(">Sun<"),
    );
    expect(htmlSunday.indexOf(">Sun<")).toBeLessThan(
      htmlSunday.indexOf(">Mon<"),
    );
  });

  it("uses single-letter weekday labels in rows mode, where they're column headers", () => {
    const html = grid("2026-07-13", "2026-07-19", { orientation: "rows" });

    expect(html).not.toContain(">Mon<");
    expect(html).toContain(">M<");
  });

  it("shows the week-start day-of-month number when requested", () => {
    const html = grid("2026-07-13", "2026-07-19", { showWeekStartDate: true });

    expect(html).toContain(">13<");
  });

  describe("band wrapping", () => {
    const start = "2025-01-06"; // a Monday
    const longWeeks = 60;
    const longEnd = formatDateToISO8601(
      addDays(parseUTCDate(start), longWeeks * 7 - 1),
    ) as string;

    it("stacks bands down for columns and across for rows", () => {
      expect(longWeeks).toBeGreaterThan(MAX_WEEKS_PER_BAND);
      expect(grid(start, longEnd)).toContain("flex-direction:column");
      expect(grid(start, longEnd, { orientation: "rows" })).toContain(
        "flex-direction:row",
      );
    });

    it.each([
      ["2026-07-13", "2026-07-19", "columns", 1],
      [start, longEnd, "columns", 2],
      [start, longEnd, "rows", 2],
    ] as const)(
      "cuts %s to %s into week-slot bands in %s mode: %i",
      (from, to, orientation, bands) => {
        expect(splitBands(grid(from, to, { orientation }))).toHaveLength(bands);
        expect(countBandsInRange(from, to, 1, orientation)).toBe(bands);
      },
    );

    it.each([
      // Spread evenly (caps: 8 months a band for columns, 6 for rows), not
      // filled to the cap with a small leftover band.
      ["2025-01-01", "2025-12-31", "columns", [6, 6]],
      ["2025-01-01", "2025-12-31", "rows", [6, 6]],
      ["2025-01-01", "2025-07-31", "columns", [7]],
      ["2025-01-01", "2025-07-31", "rows", [4, 3]],
      ["2024-01-01", "2025-12-31", "rows", [6, 6, 6, 6]],
      // Rows stop at 4 bands and grow each one instead; columns have no cap.
      ["2023-01-01", "2026-06-30", "rows", [11, 11, 11, 9]],
      ["2023-01-01", "2026-06-30", "columns", [7, 7, 7, 7, 7, 7]],
    ] as const)(
      "cuts %s to %s into month bands in %s mode: %j",
      (from, to, orientation, months) => {
        const html = grid(from, to, {
          orientation,
          splitByMonth: true,
          showMonthLabels: true,
        });

        expect(splitBands(html).map(countMonthLabels)).toEqual(months);
        expect(countBandsInRange(from, to, 1, orientation, true)).toBe(
          months.length,
        );
      },
    );
  });

  describe("year header", () => {
    it.each([
      ["columns", /grid-row:1;/],
      ["rows", /^grid-column:1;grid-row:\d+ \/ span/],
    ] as const)(
      "comes before the month header in %s mode across years",
      (orientation, yearStyle) => {
        const html = grid("2025-12-01", "2026-02-28", {
          orientation,
          splitByMonth: true,
          showMonthLabels: true,
        });

        expect(html).toContain(">2026<");
        expect(html.indexOf(">2025<")).toBeLessThan(html.indexOf(">Dec<"));
        expect(styleOf(html, "2025")).toMatch(yearStyle);
      },
    );

    it("rotates only the rows-mode year label, and spaces both leading columns", () => {
      const range = ["2025-12-01", "2026-02-28"] as const;
      const labels = { splitByMonth: true, showMonthLabels: true };
      const rows = grid(...range, { ...labels, orientation: "rows" });
      const columns = grid(...range, labels);

      // A year run spans many months; written normally it would widen every
      // side-by-side band.
      expect(styleOf(rows, "2025")).toContain("writing-mode:vertical-rl");
      expect(styleOf(rows, "Dec")).not.toContain("writing-mode");
      expect(styleOf(rows, "Dec")).toContain("justify-content:center");
      expect(styleOf(rows, "2025")).toContain("margin-right:4px");
      expect(styleOf(rows, "Dec")).toContain("margin-right:4px");
      expect(columns).not.toContain("writing-mode");
    });

    it.each([
      ["within a single year", "2025-01-01", "2025-07-31", true],
      ["without month labels", "2025-12-01", "2026-02-28", false],
    ])("is left out %s", (_, from, to, showMonthLabels) => {
      const html = grid(from, to, { splitByMonth: true, showMonthLabels });

      expect(html).not.toMatch(/>20\d\d</);
    });
  });

  it.each(["columns", "rows"] as const)(
    "renders only 5 weekdays with skipWeekends in %s mode",
    (orientation) => {
      // Mon to Sun, one full week.
      const html = grid("2026-07-13", "2026-07-19", {
        orientation,
        skipWeekends: true,
      });

      expect(countDayCells(html)).toBe(5);
      // Rows mode heads its columns with one letter: "S" for both.
      expect(html).not.toMatch(/>(Sat|Sun|S)</);
    },
  );

  describe("splitByMonth and showMonthLabels (decoupled)", () => {
    const startDate = "2026-06-01";
    const endDate = "2026-07-19";

    it.each([
      ["columns", /grid-column:\d+ \/ span \d+/],
      ["rows", /grid-row:\d+ \/ span \d+/],
    ] as const)(
      "spans each month's label across its weeks in %s mode, even unsplit",
      (orientation, span) => {
        const html = grid(startDate, endDate, {
          orientation,
          showMonthLabels: true,
        });

        expect(html.indexOf(">Jun<")).toBeGreaterThan(-1);
        expect(html.indexOf(">Jun<")).toBeLessThan(html.indexOf(">Jul<"));
        expect(html).toMatch(span);
      },
    );

    it("shows the week-start date only once across a month-split week, not on both halves", () => {
      // Jun 29-30 and Jul 1-5 are one calendar week, starting Jun 29, split
      // into two week-slots. Without the fix, both slots would show "29".
      const html = grid("2026-06-29", "2026-07-05", {
        splitByMonth: true,
        showWeekStartDate: true,
      });

      expect((html.match(/>29</g) ?? []).length).toBe(1);
    });

    it("splits the grid with a blank gap but shows no header text when only splitByMonth is on", () => {
      const html = grid("2026-06-29", "2026-07-05", { splitByMonth: true });

      expect(html).not.toContain(">Jun<");
      expect(html).not.toContain(">Jul<");
      expect(html).not.toMatch(/\/ span/);
      // Split at Jul 1 (Wed), mid-week: 2 week-slots x 7 day-rows, where a
      // whole-week split would make 3.
      expect(countDayCells(html)).toBe(14);
    });

    it("does not split or label anything when both are off", () => {
      const html = grid(startDate, endDate, {
        splitByMonth: false,
        showMonthLabels: false,
      });

      expect(html).not.toContain(">Jun<");
      expect(html).not.toMatch(/\/ span/);
    });
  });

  it.each([
    ["the weekday column in columns mode", "Mon", {}],
    [
      "the week-start-date column in rows mode",
      "13",
      { orientation: "rows", showWeekStartDate: true },
    ],
  ] as const)("right-aligns %s, clear of the grid", (_, label, options) => {
    const style = styleOf(grid("2026-07-13", "2026-07-19", options), label);

    // `justify-self:end` is what moves it: the grid's `justify-items:center`
    // would otherwise center the box and leave the flex alignment no slack.
    expect(style).toContain("justify-self:end");
    expect(style).toContain("justify-content:flex-end");
    expect(style).toContain("margin-right:4px");
  });
});
