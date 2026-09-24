import { DEFAULT_SETTINGS } from "../src/constants/defaultSettings";
import { TrackerSettings } from "../src/types";

export const harnessSettings: TrackerSettings = {
  ...DEFAULT_SETTINGS,
};

/**
 * Deterministic on purpose: a screenshot is only useful as a regression signal
 * if the same fixture draws the same grid every run. No Math.random, no
 * new Date().
 */
function entries(year: number, options: { skipEvery?: number } = {}) {
  const { skipEvery = 7 } = options;
  const result: { date: string; intensity: number; content?: string }[] = [];
  const cursor = new Date(Date.UTC(year, 0, 1));

  for (let day = 0; day < 366; day++) {
    if (cursor.getUTCFullYear() !== year) break;
    if (day % skipEvery !== 0) {
      result.push({
        date: cursor.toISOString().slice(0, 10),
        intensity: ((day * 37) % 10) + 1,
      });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}

export interface Fixture {
  id: string;
  title: string;
  note: string;
  trackerData: Record<string, unknown>;
  settings?: Partial<TrackerSettings>;
  /**
   * Caps the mount's width, for fixtures whose whole point is how the grid
   * behaves in a pane narrower than the window (phone, sidebar, split view).
   */
  maxWidth?: number;
}

export const fixtures: Fixture[] = [
  {
    id: "aggregation-sum",
    title: "Aggregation: sum (the default)",
    note: "Doc example from EXAMPLE_VAULT/…/9. intensityConfig.md. Jan 1 rated 8 twice, Jan 3 rated 8 once, Jan 4 rated 4 twice. Same scale as the average fixture below — only `aggregation` differs. Summed, Jan 3 (8) ties with Jan 4 (8) even though it was the better day.",
    trackerData: {
      year: 2025,
      heatmapTitle: "Summed (the default)",
      intensityConfig: { scaleStart: 1, scaleEnd: 10 },
      entries: [
        { date: "2025-01-01", intensity: 8 },
        { date: "2025-01-01", intensity: 8 },
        { date: "2025-01-02", intensity: 2 },
        { date: "2025-01-02", intensity: 2 },
        { date: "2025-01-03", intensity: 8 },
        { date: "2025-01-04", intensity: 4 },
        { date: "2025-01-04", intensity: 4 },
      ],
    },
  },
  {
    id: "aggregation-average",
    title: "Aggregation: average",
    note: "The same readings with aggregation: average. Jan 3 now matches Jan 1 (both an 8) and is visibly darker than Jan 4 (a 4).",
    trackerData: {
      year: 2025,
      heatmapTitle: "Averaged",
      intensityConfig: { scaleStart: 1, scaleEnd: 10, aggregation: "average" },
      entries: [
        { date: "2025-01-01", intensity: 8 },
        { date: "2025-01-01", intensity: 8 },
        { date: "2025-01-02", intensity: 2 },
        { date: "2025-01-02", intensity: 2 },
        { date: "2025-01-03", intensity: 8 },
        { date: "2025-01-04", intensity: 4 },
        { date: "2025-01-04", intensity: 4 },
      ],
    },
  },
  {
    id: "year",
    title: "Year grid (default layout)",
    note: "The common case: one year, dense entries, default palette.",
    trackerData: {
      year: 2024,
      heatmapTitle: "Year grid",
      entries: entries(2024),
    },
  },
  {
    id: "monthly",
    title: "Monthly layout",
    note: "layout: monthly — the MonthlyHeatmapView branch in App.tsx.",
    trackerData: {
      year: 2024,
      layout: "monthly",
      heatmapTitle: "Monthly layout",
      entries: entries(2024, { skipEvery: 5 }),
    },
  },
  {
    id: "monthly-narrow",
    title: "Monthly layout, narrow pane",
    note: "The monthly grid inside a ~300px pane (phone, or a note in the sidebar). Its 31 columns used to be squeezed to ~6px each, which turned the cells into dots and wrapped the two-digit day numbers one digit per line. The columns now have a floor and the grid scrolls sideways, with the month label sticky. Resize the browser or narrow the pane to check it.",
    trackerData: {
      year: 2024,
      layout: "monthly",
      heatmapTitle: "Monthly (narrow)",
      entries: entries(2024, { skipEvery: 5 }),
    },
    maxWidth: 300,
  },
  {
    id: "separated",
    title: "Separate months + week numbers",
    note: "Two layout modifiers that historically collided with each other.",
    trackerData: {
      year: 2024,
      separateMonths: true,
      heatmapTitle: "Separated months",
      entries: entries(2024, { skipEvery: 3 }),
    },
    settings: { showWeekNums: true },
  },
  {
    id: "sparse",
    title: "Sparse year",
    note: "Few entries: checks empty-box colouring and intensity scaling.",
    trackerData: {
      year: 2024,
      heatmapTitle: "Sparse",
      entries: entries(2024).filter((_, index) => index % 23 === 0),
    },
  },
  {
    id: "emoji",
    title: "Emoji habit tracker",
    note: "entry.emoji — a glyph drawn in the box (issue #49). Checks the glyph fits the 12px box, stays legible on light and dark palette colors, and coexists with the current-day border.",
    trackerData: {
      year: 2024,
      heatmapTitle: "Emoji habits",
      showCurrentDayBorder: true,
      colorScheme: { customColors: ["#c6e48b", "#7bc96f", "#239a3b"] },
      entries: entries(2024, { skipEvery: 3 }).map((entry, index) => ({
        ...entry,
        emoji: ["✅", "🏃", "📖", "🧘"][index % 4],
      })),
    },
  },
  {
    id: "single-month",
    title: "Single month (calendar)",
    note: 'layout: "month" — weekdays as columns, weeks as rows (issue #73). Pinned to an explicit range so the screenshot is stable; without one it shows the current month and the header arrows page through months.',
    trackerData: {
      layout: "month",
      heatmapTitle: "March 2024",
      startDate: "2024-03-01",
      endDate: "2024-03-31",
      entries: entries(2024, { skipEvery: 4 }),
    },
  },
  {
    id: "single-week",
    title: "Single week",
    note: 'layout: "week" — one row of seven days (issue #73). Pinned to an explicit range; live it shows the current week.',
    trackerData: {
      layout: "week",
      heatmapTitle: "Week of 2024-03-04",
      startDate: "2024-03-04",
      endDate: "2024-03-10",
      entries: entries(2024, { skipEvery: 4 }),
    },
  },
  {
    id: "default-range",
    title: "Default layout, explicit date range",
    note: 'layout: "default" with a date range (issue #118). The week-column grid used to ignore the range and draw the whole calendar year, including future days; only layout: "monthly" honoured it. The grid must start on 2024-08-15, end on 2025-02-10, and its month labels must read Aug…Feb, positioned over the weeks they name — not a fixed Jan…Dec strip.',
    trackerData: {
      layout: "default",
      heatmapTitle: "Aug 2024 – Feb 2025",
      startDate: "2024-08-15",
      endDate: "2025-02-10",
      entries: [
        ...entries(2024, { skipEvery: 3 }),
        ...entries(2025, { skipEvery: 3 }),
      ],
    },
    settings: { showWeekNums: true },
  },
  {
    id: "default-range-separated",
    title: "Default layout, date range + separate months",
    note: "The same range with separateMonths and week numbers on: the month labels, the gap columns and the week numbers all have to stay aligned with each other.",
    trackerData: {
      layout: "default",
      heatmapTitle: "Aug 2024 – Feb 2025 (separated)",
      startDate: "2024-08-15",
      endDate: "2025-02-10",
      separateMonths: true,
      entries: [
        ...entries(2024, { skipEvery: 3 }),
        ...entries(2025, { skipEvery: 3 }),
      ],
    },
    settings: { showWeekNums: true },
  },
  {
    id: "empty",
    title: "No entries",
    note: "The empty state. Must render a grid, not a blank div or a crash.",
    trackerData: {
      year: 2024,
      heatmapTitle: "Empty",
      entries: [],
    },
  },
];
