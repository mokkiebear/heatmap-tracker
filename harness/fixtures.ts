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
}

export const fixtures: Fixture[] = [
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
