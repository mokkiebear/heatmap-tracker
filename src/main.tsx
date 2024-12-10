import { App, Plugin } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { createContext, StrictMode } from "react";
import HeatmapTrackerSettingsTab from "./settings";
import { TrackerData, TrackerSettings } from "./types";
import { ReactApp } from "./App";
import { HeatmapProvider } from "./context/heatmap/heatmap.context";

import "./localization/i18n";
import React from "react";

declare global {
  interface Window {
    renderHeatmapTracker?: (el: HTMLElement, trackerData: TrackerData) => void;
  }
}

export const AppContext = createContext<App | undefined>(undefined);

export const useAppContext = (): App => {
  const context = React.useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }

  return context;
};

const DEFAULT_SETTINGS: TrackerSettings = {
  palettes: {
    default: ["#c6e48b", "#7bc96f", "#49af5d", "#2e8840", "#196127"],
    danger: ["#fff33b", "#fdc70c", "#f3903f", "#ed683c", "#e93e3a"],
  },
  weekStartDay: 1,
  separateMonths: false,
  language: "en",
};

const DEFAULT_TRACKER_DATA: TrackerData = {
  year: new Date().getFullYear(),
  entries: [
    { date: "1900-01-01", color: "#7bc96f", intensity: 5, content: "" },
  ],
  showCurrentDayBorder: true,
  defaultEntryIntensity: 4,
  intensityScaleStart: 1,
  intensityScaleEnd: 5,
  colorScheme: {
    paletteName: "default",
  }
};

export default class HeatmapTracker extends Plugin {
  settings: TrackerSettings = DEFAULT_SETTINGS;
  roots: Root[] = [];

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new HeatmapTrackerSettingsTab(this.app, this));

    window.renderHeatmapTracker = (
      el: HTMLElement,
      trackerData: TrackerData
    ): void => {
      const container = el.createDiv({
        cls: "heatmap-tracker-container",
        attr: { "data-name": trackerData?.heatmapTitle ?? "" },
      });

      const root = createRoot(container);

      root.render(
        <StrictMode>
          <AppContext.Provider value={this.app}>
            <HeatmapProvider
              trackerData={{ ...DEFAULT_TRACKER_DATA, ...trackerData }}
              settings={this.settings}
            >
              <ReactApp />
            </HeatmapProvider>
          </AppContext.Provider>
        </StrictMode>
      );

      this.roots.push(root);
    };
  }

  onunload() {
    this.roots.forEach((root) => root.unmount());

    if (window.renderHeatmapTracker) {
      delete window.renderHeatmapTracker;
    }
  }

  async loadSettings() {
    const settingsData: TrackerSettings = await this.loadData();

    this.settings = {
      ...DEFAULT_SETTINGS,
      ...settingsData,
      palettes: {
        ...DEFAULT_SETTINGS.palettes,
        ...settingsData.palettes,
      },
    };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
