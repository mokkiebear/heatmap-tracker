import { App } from "obsidian";

import { createRoot } from "react-dom/client";
import { StrictMode } from "react";

import { TrackerData, TrackerSettings } from "./types";
import ReactApp from "./App";
import { HeatmapProvider } from "./context/heatmap/heatmap.context";

import { mergeTrackerData } from "./utils/core";
import LegendView from "./views/LegendView/LegendView";
import StatisticsView from "./views/StatisticsView/StatisticsView";

import { HeatmapHeader } from "./components/HeatmapHeader/HeatmapHeader";
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
          trackerData={mergeTrackerData(DEFAULT_TRACKER_DATA, trackerData)}
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
      attr: { "data-htp-name": (inputTrackerData as TrackerData)?.heatmapTitle ?? "" },
    });

    return renderApp(container, app, settings, inputTrackerData, <ReactApp />);
  };
}

export function getRenderHeatmapTrackerLegend(
  app: App,
  pluginSettings: TrackerSettings
) {
  return function renderHeatmapTrackerLegend(
    el: HTMLElement,
    trackerData: TrackerData = DEFAULT_TRACKER_DATA
  ) {
    const container = el.createDiv({
      cls: "heatmap-tracker-legend",
      attr: {
        "data-htp-name": trackerData?.heatmapTitle
          ? `${trackerData?.heatmapTitle}-legend`
          : "",
      },
    });

    return renderApp(
      container,
      app,
      pluginSettings,
      trackerData,
      <>
        <HeatmapHeader hideTabs hideSubtitle />
        <LegendView />
      </>
    );
  };
}

export function getRenderHeatmapTrackerStatistics(
  app: App,
  pluginSettings: TrackerSettings
) {
  return function renderHeatmapTrackerStatistics(
    el: HTMLElement,
    trackerData: TrackerData = DEFAULT_TRACKER_DATA
  ) {
    const container = el.createDiv({
      cls: "heatmap-tracker-statistics",
      attr: {
        "data-htp-name": trackerData?.heatmapTitle
          ? `${trackerData?.heatmapTitle}-statistics`
          : "",
      },
    });

    return renderApp(
      container,
      app,
      pluginSettings,
      trackerData,
      <>
        <HeatmapHeader hideTabs hideSubtitle />
        <StatisticsView />
      </>
    );
  };
}
