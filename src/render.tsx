import { App } from "obsidian";

import { createRoot } from "react-dom/client";
import { StrictMode } from "react";

import { TrackerData, TrackerSettings } from "./types";
import ReactApp from "./App";
import { HeatmapProvider } from "./context/heatmap/heatmap.context";

import { mergeTrackerData } from "./utils/core";

import { notify } from "./utils/notify";
import { validateTrackerData } from "./schemas/validation";
import { AppContext } from "./context/app/app.context";
import { DEFAULT_TRACKER_DATA } from "./constants/defaultTrackerData";

function renderApp(
  container: HTMLDivElement,
  app: App,
  pluginSettings: TrackerSettings,
  inputTrackerData: unknown,
  component: React.JSX.Element
) {
  const root = createRoot(container);

  let trackerData = mergeTrackerData(
    DEFAULT_TRACKER_DATA,
    inputTrackerData as TrackerData
  );

  try {
    trackerData = validateTrackerData(trackerData) as TrackerData;
  } catch (e) {
    notify((e as Error).message, 0);
  }

  root.render(
    <StrictMode>
      <AppContext.Provider value={app}>
        <HeatmapProvider
          trackerData={trackerData}
          settings={pluginSettings}
        >
          {component}
        </HeatmapProvider>
      </AppContext.Provider>
    </StrictMode>
  );

  return container;
}

export function getRenderHeatmapTracker(
  app: App,
  pluginSettings: TrackerSettings
) {
  return function renderHeatmapTracker(
    el: HTMLElement,
    inputTrackerData: unknown = DEFAULT_TRACKER_DATA,
    settings: TrackerSettings = pluginSettings
  ) {
    const container = el.createDiv({
      cls: "heatmap-tracker-container",
      attr: {
        "data-htp-name": (inputTrackerData as TrackerData)?.heatmapTitle ?? "",
      },
    });

    return renderApp(container, app, settings, inputTrackerData, <ReactApp />);
  };
}
