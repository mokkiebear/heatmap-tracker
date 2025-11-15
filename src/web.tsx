import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { TrackerData, TrackerSettings } from "./types";
import ReactApp from "./App";
import { HeatmapProvider } from "./context/heatmap/heatmap.context";

import "./localization/i18n";
import { mergeTrackerData } from "./utils/core";
import { DEFAULT_SETTINGS } from "./constants/defaultSettings";
import { DEFAULT_TRACKER_DATA } from "./constants/defaultTrackerData";


export function renderHeatmapTracker(
  el: HTMLElement,
  trackerData: TrackerData = DEFAULT_TRACKER_DATA,
  settings: TrackerSettings = DEFAULT_SETTINGS
) {
  const root = createRoot(el);

  root.render(
    <StrictMode>
      <HeatmapProvider
        trackerData={mergeTrackerData(DEFAULT_TRACKER_DATA, trackerData)}
        settings={settings}
      >
        <ReactApp />
      </HeatmapProvider>
    </StrictMode>
  );
}
