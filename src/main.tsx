import {
  MarkdownPostProcessorContext,
  MarkdownView,
  parseYaml,
  Plugin,
  stringifyYaml,
} from "obsidian";
import { getDataviewApi } from "src/utils/dataviewApi";
import HeatmapTrackerSettingsTab from "./settings";
import { TrackerData, TrackerParams, TrackerSettings } from "./types";
import { buildEntriesFromDataview } from "./utils/dataviewEntries";

import { getDailyNoteSettings } from "obsidian-daily-notes-interface";

import "./localization/i18n";

import {
  renderCodeblockIssue,
  renderNoMatchesHint,
} from "./utils/codeblockError";
import i18n from "./localization/i18n";
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
    // Codeblock errors and modals can be shown before any React tree mounts, so
    // the language has to be set here rather than in App.tsx's effect.
    await i18n.changeLanguage(this.settings.language);
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
        // Every failure below used to end in console.warn, which left the
        // reader looking at an empty space with no way to tell a broken
        // codeblock from a vault with no data in it yet.
        let params: any;

        try {
          params = parseYaml(source) as TrackerParams;
        } catch (e) {
          renderCodeblockIssue(el, {
            kind: "invalid-yaml",
            detail: (e as Error)?.message,
          });
          return;
        }

        if (params?.property === undefined) {
          renderCodeblockIssue(el, { kind: "missing-property" });
          return;
        }

        if (params.path === undefined) {
          // Use DailyNotes API to get the Daily Notes folder
          const dailyNoteSettings = getDailyNoteSettings();
          if (dailyNoteSettings.folder !== undefined) {
            params.path = dailyNoteSettings.folder;
          }
        }

        // Use DataView API to filter pages that contain specified frontmatter property
        const dv = getDataviewApi(this.app) ?? getDataviewApi();

        if (!dv) {
          renderCodeblockIssue(el, { kind: "dataview-missing" });
          return;
        }

        try {
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

          // An empty grid is a valid state, so the heatmap is still rendered —
          // this only explains why every square is blank.
          if (entries.length === 0) {
            renderNoMatchesHint(el, {
              property: String(params.property),
              path: params.path ? String(params.path) : undefined,
            });
          }
        } catch (e) {
          console.warn(e);
          renderCodeblockIssue(el, {
            kind: "unexpected",
            detail: (e as Error)?.message,
          });
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
