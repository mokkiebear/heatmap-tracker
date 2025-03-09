import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { TrackerData, TrackerSettings } from "./types";
import ReactApp from "./App";
import { HeatmapProvider } from "./context/heatmap/heatmap.context";

import "./localization/i18n";
import { IHeatmapView } from "src/types";
import { mergeTrackerData } from "./utils/core";
import { DateHelper } from "./utils/date";

const DEFAULT_SETTINGS: TrackerSettings = {
  palettes: {
    default: ["#c6e48b", "#7bc96f", "#49af5d", "#2e8840", "#196127"],
    danger: ["#fff33b", "#fdc70c", "#f3903f", "#ed683c", "#e93e3a"],
  },
  weekStartDay: 1,
  weekDisplayMode: "even",
  separateMonths: false,
  language: "en",
  viewTabsVisibility: {
    [IHeatmapView.Documentation]: true,
    // [IHeatmapView.Donation]: true,
    [IHeatmapView.HeatmapTracker]: true,
    [IHeatmapView.HeatmapTrackerStatistics]: true,
    [IHeatmapView.Legend]: true,
  },
};

export const DEFAULT_TRACKER_DATA: TrackerData = {
  year: DateHelper.getCurrentFullYear(),
  entries: [
    { date: "1900-01-01", customColor: "#7bc96f", intensity: 5, content: "" },
  ],
  showCurrentDayBorder: true,
  intensityConfig: {
    scaleStart: undefined,
    scaleEnd: undefined,
    defaultIntensity: 4,
    showOutOfRange: true,
  },
  intensityScaleStart: undefined,
  intensityScaleEnd: undefined,
  defaultEntryIntensity: 4,
  colorScheme: {
    paletteName: "default",
  },

  insights: [],
  dateFormat: "YYYY-MM-DD",
};

export function renderHeatmapTracker(
  el: HTMLElement,
  trackerData: TrackerData = DEFAULT_TRACKER_DATA
) {
  const root = createRoot(el);

  root.render(
    <StrictMode>
      <HeatmapProvider
        trackerData={mergeTrackerData(DEFAULT_TRACKER_DATA, trackerData)}
        settings={DEFAULT_SETTINGS}
      >
        <ReactApp />
      </HeatmapProvider>
    </StrictMode>
  );
}
