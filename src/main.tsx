import {
  MarkdownPostProcessorContext,
  MarkdownView,
  Notice,
  parseYaml,
  Plugin,
  stringifyYaml,
} from "obsidian";
import { resolveDataviewApi } from "src/utils/dataviewApi";
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
import { renderEditButton } from "./utils/editCodeblock";
import { asyncHandler } from "./utils/asyncHandler";

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
    // A rejection here must not take the whole plugin down with it — i18next
    // falls back to English on its own.
    try {
      await i18n.changeLanguage(this.settings.language);
    } catch (e) {
      console.warn("Heatmap Tracker: could not switch language.", e);
    }
    this.addSettingTab(new HeatmapTrackerSettingsTab(this.app, this));

    this.addCommand({
      id: "insert-heatmap-tracker",
      // No "Heatmap Tracker" in the name: Obsidian already shows the plugin
      // name next to the command. The id keeps its historical value — changing
      // it would silently drop users' existing hotkey bindings.
      name: "Insert heatmap",
      editorCallback: () => this.openInsertModal(),
    });

    // The modal is the primary way to use the plugin, so it gets a one-click
    // entry point rather than only living behind the command palette.
    this.addRibbonIcon("calendar-days", "Insert heatmap", () => {
      if (!this.app.workspace.getActiveViewOfType(MarkdownView)) {
        new Notice("Open a note in edit mode to insert a heatmap.");
        return;
      }
      this.openInsertModal();
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
        // The codeblock carries `TrackerParams` (which drive the Dataview
        // query) plus any `TrackerData` field the user set; the rest of
        // `TrackerData` is filled in by `mergeTrackerData` downstream.
        let params: TrackerParams & Record<string, unknown>;

        try {
          params = parseYaml(source) as TrackerParams & Record<string, unknown>;
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
        // During Obsidian's startup a note can render before Dataview has
        // installed its API. Without the wait, a vault that *has* Dataview gets
        // told to install it.
        const dv = await resolveDataviewApi(this.app);

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
              // Several tracked properties in one note combine the same way
              // several entries on one day do — see `fillEntriesByKey`.
              aggregation: params.intensityConfig?.aggregation,
            },
            (page) => el.createSpan(`[](${page.file.name})`),
          );

          // Append codeblock parameters to TrackerData object
          const trackerData = {
            entries,
            ...params,
          } as unknown as TrackerData;

          if (window.renderHeatmapTracker) {
            // Append codeblock parameters to TrackerSettings object
            window.renderHeatmapTracker(el, trackerData, this.settings);
          }

          renderEditButton(el, this.app, ctx, this.settings, params);

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
      asyncHandler(() => this.saveSettings()),
    );
  }

  private openInsertModal() {
    new HeatmapModal(this.app, this.settings, (result) => {
      const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!markdownView) return;

      markdownView.editor.replaceSelection(
        `\`\`\`heatmap-tracker\n${stringifyYaml(result)}\`\`\`\n`,
      );
    }).open();
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
