import { IHeatmapView, TrackerSettings } from "src/types";

export const DEFAULT_SETTINGS: TrackerSettings = {
  palettes: {
    default: ["#c6e48b", "#7bc96f", "#49af5d", "#2e8840", "#196127"],
    danger: ["#fff33b", "#fdc70c", "#f3903f", "#ed683c", "#e93e3a"],
    obsidianTheme: [
      "var(--color-base-00)",
      "var(--color-base-05)",
      "var(--color-base-10)",
      "var(--color-base-20)",
      "var(--color-base-25)",
      "var(--color-base-30)",
      "var(--color-base-35)",
      "var(--color-base-40)",
      "var(--color-base-50)",
      "var(--color-base-60)",
      "var(--color-base-70)",
      "var(--color-base-100)",
    ],
  },
  weekStartDay: 1,
  weekDisplayMode: "even",
  separateMonths: true,
  language: "en",
  viewTabsVisibility: {
    [IHeatmapView.Documentation]: true,
    [IHeatmapView.HeatmapTracker]: true,
    [IHeatmapView.HeatmapTrackerStatistics]: true,
    [IHeatmapView.Legend]: true,
  },
};
