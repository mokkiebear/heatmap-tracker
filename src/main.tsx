import {
  MarkdownPostProcessorContext,
  MarkdownView,
  parseYaml,
  Plugin,
  stringifyYaml,
} from "obsidian";
import { getAPI } from "obsidian-dataview";
import HeatmapTrackerSettingsTab from "./settings";
import { TrackerData, TrackerParams, TrackerSettings } from "./types";
import { buildEntriesFromDataview } from "./utils/dataviewEntries";

import { getDailyNoteSettings } from "obsidian-daily-notes-interface";

import "./localization/i18n";

import { getRenderHeatmapTracker } from "./render";
import { DEFAULT_SETTINGS } from "./constants/defaultSettings";
import { HeatmapModal } from "./modals/HeatmapModal";

declare global {
  interface Window {
    renderHeatmapTracker?: (
      el: HTMLElement,
      trackerData: TrackerData,
      settings: TrackerSettings,
    ) => void;
  }
}

export default class HeatmapTrackerPlugin extends Plugin {
  settings: TrackerSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new HeatmapTrackerSettingsTab(this.app, this));

    this.addCommand({
      id: "insert-heatmap-tracker",
      name: "Insert Heatmap Tracker",
      editorCallback: (editor, ctx) => {
        new HeatmapModal(this.app, this.settings, (result) => {
          const markdownView =
            this.app.workspace.getActiveViewOfType(MarkdownView);

          if (!markdownView) {
            return;
          }

          const codeblock = `\`\`\`heatmap-tracker\n${stringifyYaml(
            result,
          )}\`\`\`\n`;
          editor.replaceSelection(codeblock);
        }).open();
      },
    });

    this.registerMarkdownCodeBlockProcessor(
      "heatmap-tracker",
      async (
        source: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext,
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
          // Use DataView API to filter pages that contain specified frontmatter property
          const dv = getAPI();
          const entries = buildEntriesFromDataview(
            dv,
            {
              path: params.path,
              property: params.property,
              tags: params.tags,
              filters: params.filters,
            },
            (page) => el.createSpan(`[](${page.file.name})`),
          );

          // Append codeblock parameters to TrackerData object
          const trackerData: TrackerData = {
            entries,
            ...params,
          };

          if (window.renderHeatmapTracker) {
            // Append codeblock parameters to TrackerSettings object
            window.renderHeatmapTracker(el, trackerData, this.settings);
          }
        } catch (e) {
          console.warn(e);
        }
      },
    );

    window.renderHeatmapTracker = getRenderHeatmapTracker(
      this.app,
      this.settings,
      () => this.saveSettings(),
    );
  }

  onunload() {
    if (window.renderHeatmapTracker) {
      delete window.renderHeatmapTracker;
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
