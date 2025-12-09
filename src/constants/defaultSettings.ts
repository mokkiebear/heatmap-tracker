import { IHeatmapView, TrackerSettings } from "src/types";

export const DEFAULT_SETTINGS: TrackerSettings = {
  palettes: {
    default: ["#c6e48b", "#7bc96f", "#49af5d", "#2e8840", "#196127"],
    danger: ["#fff33b", "#fdc70c", "#f3903f", "#ed683c", "#e93e3a"],
  },
  weekStartDay: 1,
  showWeekNums: false,
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
