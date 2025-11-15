import { MarkdownPostProcessorContext, parseYaml, Plugin } from "obsidian";
import { getAPI, Literal } from "obsidian-dataview";
import HeatmapTrackerSettingsTab from "./settings";
import { TrackerData, TrackerParams, TrackerSettings } from "./types";

import { getDailyNoteSettings } from "obsidian-daily-notes-interface";

import "./localization/i18n";

import {
  getRenderHeatmapTracker,
  getRenderHeatmapTrackerLegend,
  getRenderHeatmapTrackerStatistics,
} from "./render";
import { DEFAULT_SETTINGS } from "./constants/defaultSettings";
import { DEFAULT_TRACKER_DATA } from "./constants/defaultTrackerData";

declare global {
  interface Window {
    renderHeatmapTracker?: (
      el: HTMLElement,
      trackerData: TrackerData,
      settings: TrackerSettings
    ) => void;
    renderHeatmapTrackerLegend?: (
      el: HTMLElement,
      trackerData: TrackerData
    ) => void;
    renderHeatmapTrackerStatistics?: (
      el: HTMLElement,
      trackerData: TrackerData
    ) => void;
  }
}

export default class HeatmapTrackerPlugin extends Plugin {
  settings: TrackerSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new HeatmapTrackerSettingsTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor(
      "heatmap-tracker",
      async (
        source: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
      ) => {
        const params: any = parseYaml(source) as TrackerParams;
        if (params.property === undefined) {
          console.warn("Missing codeblock parameter: property");
          return;
        }
        if (params.path === undefined) {
          // Use DailyNotes API to get the Daily Notes folder
          const dailyNoteSettings = getDailyNoteSettings();
          if (dailyNoteSettings.folder !== undefined) {
            params.path = dailyNoteSettings.folder;
          }
        }
        try {
          // Append codeblock parameters to TrackerData object
          const trackerData: TrackerData = {
            ...DEFAULT_TRACKER_DATA,
            entries: [],
            ...params,
          };
          // Use DataView API to filter pages that contain specified frontmatter property
          const dv = getAPI();
          const pages = dv
            .pages(`"${params.path}"`)
            .where((p: Record<string, Literal>) => {
              if (typeof params.property === "string") {
                return p[params.property];
              }
              for (const property of params.property) {
                if (p[property]) {
                  return true;
                }
              }
              return false;
            });
          for (const page of pages) {
            let intensity = 0;
            if (typeof params.property === "string") {
              intensity = page[params.property];
            } else {
              intensity = params.property.reduce((sum: number, str: string) => {
                sum + page[str];
              }, 0);
            }
            trackerData.entries.push({
              date: page.file.name,
              filePath: page.file.path,
              intensity: intensity,
              content: el.createSpan(`[](${page.file.name})`),
            });
          }
          if (window.renderHeatmapTracker) {
            // Append codeblock parameters to TrackerSettings object
            window.renderHeatmapTracker(el, trackerData, {
              ...this.settings,
              ...params,
            });
          }
        } catch (e) {
          console.warn(e);
        }
      }
    );

    window.renderHeatmapTracker = getRenderHeatmapTracker(
      this.app,
      this.settings
    );

    window.renderHeatmapTrackerLegend = getRenderHeatmapTrackerLegend(
      this.app,
      this.settings
    );

    window.renderHeatmapTrackerStatistics = getRenderHeatmapTrackerStatistics(
      this.app,
      this.settings
    );
  }

  onunload() {
    if (window.renderHeatmapTracker) {
      delete window.renderHeatmapTracker;
    }

    if (window.renderHeatmapTrackerLegend) {
      delete window.renderHeatmapTrackerLegend;
    }

    if (window.renderHeatmapTrackerStatistics) {
      delete window.renderHeatmapTrackerStatistics;
    }
  }

  async loadSettings() {
    const settingsData: TrackerSettings = await this.loadData();

    this.settings = {
      ...DEFAULT_SETTINGS,
      ...settingsData,
      viewTabsVisibility: {
        ...DEFAULT_SETTINGS?.viewTabsVisibility,
        ...settingsData?.viewTabsVisibility,
      },
      palettes: {
        ...DEFAULT_SETTINGS?.palettes,
        ...settingsData?.palettes,
      },
    };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
