import {
  App,
  MarkdownPostProcessorContext,
  MarkdownView,
  parseYaml,
  Plugin,
} from "obsidian";
import { getAPI, Literal } from "obsidian-dataview";
import { createRoot } from "react-dom/client";
import { createContext, StrictMode } from "react";
import HeatmapTrackerSettingsTab from "./settings";
import { TrackerData, TrackerParams, TrackerSettings } from "./types";
import ReactApp from "./App";
import { HeatmapProvider } from "./context/heatmap/heatmap.context";
import { getDailyNoteSettings } from "obsidian-daily-notes-interface";

import "./localization/i18n";
import { useContext } from "react";
import { IHeatmapView } from "src/types";
import { mergeTrackerData } from "./utils/core";
import LegendView from "./views/LegendView/LegendView";
import StatisticsView from "./views/StatisticsView/StatisticsView";
import { getCurrentFullYear } from "./utils/date";
import { HeatmapHeader } from "./components/HeatmapHeader/HeatmapHeader";
import { NewHeatmapModal } from "./modals/NewHeatmapModal";

declare global {
  interface Window {
    renderHeatmapTracker?: (
      el: HTMLElement,
      trackerData: TrackerData,
      settings?: TrackerSettings
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

export const AppContext = createContext<App | undefined>(undefined);

export const useAppContext = (): App => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }

  return context;
};

const DEFAULT_SETTINGS: TrackerSettings = {
  palettes: {
    default: ["#c6e48b", "#7bc96f", "#49af5d", "#2e8840", "#196127"],
    danger: ["#fff33b", "#fdc70c", "#f3903f", "#ed683c", "#e93e3a"],
    obsidianTheme: [
      "var(--color-base-00)",
      "var(--color-base-05)",
      "var(--color-base-10)",
      "var(--color-base-20)",
      "var(--color-base-25)",
      "var(--color-base-30)",
      "var(--color-base-35)",
      "var(--color-base-40)",
      "var(--color-base-50)",
      "var(--color-base-60)",
      "var(--color-base-70)",
      "var(--color-base-100)",
    ],
  },
  weekStartDay: 1,
  weekDisplayMode: "even",
  separateMonths: true,
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
  year: getCurrentFullYear(),
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
};

export default class HeatmapTracker extends Plugin {
  settings: TrackerSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new HeatmapTrackerSettingsTab(this.app, this));

    this.addCommand({
      id: "create-new-heatmap-tracker",
      name: "Create new Heatmap Tracker",
      editorCallback: (editor, ctx) => {
        new NewHeatmapModal(this.app, (result) => {
          console.log("New Heatmap Tracker created:", result);

          console.log("#####", {
            editor,
            ctx,
          });

          const markdownView =
            this.app.workspace.getActiveViewOfType(MarkdownView);
          if (!markdownView) {
            return;
          }
          const codeblock = `\`\`\`heatmap-tracker-json\n${JSON.stringify(
            {
              heatmapTitle: result.heatmapTitle,
              property: result.property,
            },
            null,
            2
          )}\n\`\`\`\n`;
          editor.replaceSelection(codeblock);
        }).open();
      },
    });

    this.registerMarkdownCodeBlockProcessor(
      "heatmap-tracker-yaml",
      async (
        source: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
      ) => {
        const params = parseYaml(source) as TrackerParams;
        console.log("##### params", params);

        if (params.property === undefined) {
          console.warn("Missing codeblock parameter: property");
          return;
        }

        if (params.basePath === undefined) {
          // Use DailyNotes API to get the Daily Notes folder
          const dailyNoteSettings = getDailyNoteSettings();
          if (dailyNoteSettings.folder !== undefined) {
            params.basePath = dailyNoteSettings.folder;
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
            .pages(`"${params.basePath}"`)
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

    const jsonProcessor = this.registerMarkdownCodeBlockProcessor(
      "heatmap-tracker",
      async (
        source: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
      ) => {
        // accept JS object instead of JSON
        // const params = JSON.parse(source) as TrackerData;
        const wrappedSource = ("(" + source + ")") as unknown as TrackerData;
        const params = new Function("return " + wrappedSource)();

        const property = (params as any).property;
        console.log("##### params", params, ctx.getSectionInfo(el));

        try {
          // Append codeblock parameters to TrackerData object
          const trackerData: TrackerData = {
            ...params,
          };
          // Use DataView API to filter pages that contain specified frontmatter property
          const dv = getAPI();
          const pages = dv
            .pages(`"${params.basePath}"`)
            .where((p: Record<string, Literal>) => {
              if (typeof property === "string") {
                return p[property];
              }
              for (const prop of property) {
                if (p[prop]) {
                  return true;
                }
              }
              return false;
            });

          for (const page of pages) {
            let intensity = 0;
            if (typeof property === "string") {
              intensity = page[property];
            } else {
              intensity = property.reduce((sum: number, str: string) => {
                sum + page[str];
              }, 0);
            }

            trackerData.entries.push({
              date: page.file.name,
              filePath: page.file.path,
              intensity: intensity,
            });
          }

          if (window.renderHeatmapTracker) {
            // Append codeblock parameters to TrackerSettings object
            window.renderHeatmapTracker(el, trackerData);
          }
        } catch (e) {
          console.warn(e);
        }
      }
    );

    window.renderHeatmapTracker = (
      el: HTMLElement,
      trackerData: TrackerData = DEFAULT_TRACKER_DATA,
      settings: TrackerSettings = this.settings
    ) => {
      const container = el.createDiv({
        cls: "heatmap-tracker-container",
        attr: { "data-htp-name": trackerData?.heatmapTitle ?? "" },
      });

      const root = createRoot(container);

      root.render(
        <StrictMode>
          <AppContext.Provider value={this.app}>
            <HeatmapProvider
              trackerData={mergeTrackerData(DEFAULT_TRACKER_DATA, trackerData)}
              settings={settings}
            >
              <ReactApp />
            </HeatmapProvider>
          </AppContext.Provider>
        </StrictMode>
      );

      return container;
    };

    window.renderHeatmapTrackerLegend = (
      el: HTMLElement,
      trackerData: TrackerData = DEFAULT_TRACKER_DATA
    ) => {
      const container = el.createDiv({
        cls: "heatmap-tracker-legend",
        attr: {
          "data-htp-name": trackerData?.heatmapTitle
            ? `${trackerData?.heatmapTitle}-legend`
            : "",
        },
      });

      const root = createRoot(container);

      root.render(
        <StrictMode>
          <AppContext.Provider value={this.app}>
            <HeatmapProvider
              trackerData={mergeTrackerData(DEFAULT_TRACKER_DATA, trackerData)}
              settings={this.settings}
            >
              <LegendView />
            </HeatmapProvider>
          </AppContext.Provider>
        </StrictMode>
      );

      return container;
    };

    window.renderHeatmapTrackerStatistics = (
      el: HTMLElement,
      trackerData: TrackerData = DEFAULT_TRACKER_DATA
    ) => {
      const container = el.createDiv({
        cls: "heatmap-tracker-statistics",
        attr: {
          "data-htp-name": trackerData?.heatmapTitle
            ? `${trackerData?.heatmapTitle}-statistics`
            : "",
        },
      });

      const root = createRoot(container);

      root.render(
        <StrictMode>
          <AppContext.Provider value={this.app}>
            <HeatmapProvider
              trackerData={mergeTrackerData(DEFAULT_TRACKER_DATA, trackerData)}
              settings={this.settings}
            >
              <>
                <HeatmapHeader hideTabs hideSubtitle />
                <StatisticsView />
              </>
            </HeatmapProvider>
          </AppContext.Provider>
        </StrictMode>
      );

      return container;
    };
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
