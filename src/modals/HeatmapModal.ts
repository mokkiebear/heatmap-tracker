import { App, Modal, Setting } from "obsidian";
import { getAPI } from "obsidian-dataview";
import { IHeatmapView, TrackerSettings } from "../types";
import React from "react";
import { Root } from "react-dom/client";
import { renderApp } from "../render";
import ReactApp from "../App";

export class HeatmapModal extends Modal {
  private settings: TrackerSettings;
  private onSubmit: (result: any) => void;
  private previewContainer: HTMLDivElement | null = null;
  private previewRoot: Root | null = null;

  constructor(
    app: App,
    settings: TrackerSettings,
    onSubmit: (result: any) => void
  ) {
    super(app);
    this.settings = settings;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    this.setTitle("Create new Heatmap Tracker (beta)");

    let heatmapTitle = "";
    let heatmapSubtitle = "";
    let property = "";
    let year = new Date().getFullYear();
    let separateMonths = true; // Default from schema/constants usually
    let showCurrentDayBorder = true;
    let disableFileCreation = false;
    let palette = "default";
    let path = "";

    // UI Schema
    let hideTabs = false;
    let hideYear = false;
    let hideTitle = false;
    let hideSubtitle = false;
    let showWeekNums = false;
    let defaultView = IHeatmapView.HeatmapTracker;

    // Title
    new Setting(contentEl)
      .setName("Title")
      .setDesc('Values stored in "heatmapTitle"')
      .addText((text) =>
        text.onChange((value) => {
          heatmapTitle = value;
          this.updatePreview({
            heatmapTitle,
            heatmapSubtitle,
            year,
            separateMonths,
            showCurrentDayBorder,
            palette,
            hideTabs,
            hideYear,
            hideTitle,
            hideSubtitle,
            showWeekNums,
            defaultView,
            excludeFalsy,
          });
        })
      );

    // Subtitle
    new Setting(contentEl)
      .setName("Subtitle")
      .setDesc('Values stored in "heatmapSubtitle"')
      .addText((text) =>
        text.onChange((value) => {
          heatmapSubtitle = value;
          this.updatePreview({
            heatmapTitle,
            heatmapSubtitle,
            year,
            separateMonths,
            showCurrentDayBorder,
            palette,
            hideTabs,
            hideYear,
            hideTitle,
            hideSubtitle,
            showWeekNums,
            defaultView,
            excludeFalsy,
          });
        })
      );

    // Property
    const dv = getAPI(this.app);
    const props = new Set<string>();

    if (dv) {
      for (const page of dv.pages()) {
        if (page.file.frontmatter) {
          for (const key of Object.keys(page.file.frontmatter)) {
            props.add(key);
          }
        }
      }
    }

    new Setting(contentEl)
      .setName("Property")
      .setDesc("Frontmatter property to track")
      .addDropdown((dropdown) => {
        dropdown.addOption("", "Select a property...");
        const sortedProps = [...props].sort();
        sortedProps.forEach((p) => dropdown.addOption(p, p));

        dropdown.onChange((value) => {
          property = value;
        });
      });

    // Year
    new Setting(contentEl).setName("Year").addText((text) => {
      text.inputEl.type = "number";
      text.setValue(String(year));
      text.onChange((value) => {
        year = Number(value);
        this.updatePreview({
          heatmapTitle,
          heatmapSubtitle,
          year,
          separateMonths,
          showCurrentDayBorder,
          palette,
          hideTabs,
          hideYear,
          hideTitle,
          hideSubtitle,
          showWeekNums,
          defaultView,
          excludeFalsy,
        });
      });
    });

    // Path
    new Setting(contentEl)
      .setName("Folder path")
      .setDesc("Folder to search in (optional)")
      .addText((text) =>
        text.onChange((value) => {
          path = value;
        })
      );

    // Palette
    new Setting(contentEl).setName("Palette").addDropdown((dropdown) => {
      Object.keys(this.settings.palettes).forEach((p) => {
        dropdown.addOption(p, p);
      });
      dropdown.setValue(palette);
      dropdown.onChange((value) => {
        palette = value;
        this.updatePreview({
          heatmapTitle,
          heatmapSubtitle,
          year,
          separateMonths,
          showCurrentDayBorder,
          palette,
          hideTabs,
          hideYear,
          hideTitle,
          hideSubtitle,
          showWeekNums,
          defaultView,
          excludeFalsy,
        });
      });
    });

    // Separate Months
    new Setting(contentEl).setName("Separate months").addToggle((toggle) => {
      toggle.setValue(separateMonths);
      toggle.onChange((value) => {
        separateMonths = value;
        this.updatePreview({
          heatmapTitle,
          heatmapSubtitle,
          year,
          separateMonths,
          showCurrentDayBorder,
          palette,
          hideTabs,
          hideYear,
          hideTitle,
          hideSubtitle,
          showWeekNums,
          defaultView,
          excludeFalsy,
        });
      });
    });

    // Show Current Day Border
    new Setting(contentEl)
      .setName("Show current day border")
      .addToggle((toggle) => {
        toggle.setValue(showCurrentDayBorder);
        toggle.onChange((value) => {
          showCurrentDayBorder = value;
          this.updatePreview({
            heatmapTitle,
            heatmapSubtitle,
            year,
            separateMonths,
            showCurrentDayBorder,
            palette,
            hideTabs,
            hideYear,
            hideTitle,
            hideSubtitle,
            showWeekNums,
            defaultView,
            excludeFalsy,
          });
        });
      });

    // Disable File Creation
    new Setting(contentEl)
      .setName("Disable file creation")
      .addToggle((toggle) => {
        toggle.setValue(disableFileCreation);
        toggle.onChange((value) => {
          disableFileCreation = value;
        });
      });

    // Exclude Falsy
    let excludeFalsy = false;
    new Setting(contentEl)
      .setName("Exclude zero/falsy values")
      .setDesc("If enabled, 0 or blank values will be ignored and won't break streaks.")
      .addToggle((toggle) => {
        toggle.setValue(excludeFalsy);
        toggle.onChange((value) => {
          excludeFalsy = value;
          this.updatePreview({
            heatmapTitle,
            heatmapSubtitle,
            year,
            separateMonths,
            showCurrentDayBorder,
            palette,
            hideTabs,
            hideYear,
            hideTitle,
            hideSubtitle,
            showWeekNums,
            defaultView,
            excludeFalsy,
          });
        });
      });

    // UI Settings
    contentEl.createEl("h3", { text: "UI Settings" });

    new Setting(contentEl).setName("Hide tabs").addToggle((toggle) => {
      toggle.setValue(hideTabs);
      toggle.onChange((value) => {
        hideTabs = value;
        this.updatePreview({
          heatmapTitle,
          heatmapSubtitle,
          year,
          separateMonths,
          showCurrentDayBorder,
          palette,
          hideTabs,
          hideYear,
          hideTitle,
          hideSubtitle,
          showWeekNums,
          defaultView,
          excludeFalsy,
        });
      });
    });

    new Setting(contentEl).setName("Hide year").addToggle((toggle) => {
      toggle.setValue(hideYear);
      toggle.onChange((value) => {
        hideYear = value;
        this.updatePreview({
          heatmapTitle,
          heatmapSubtitle,
          year,
          separateMonths,
          showCurrentDayBorder,
          palette,
          hideTabs,
          hideYear,
          hideTitle,
          hideSubtitle,
          showWeekNums,
          defaultView,
          excludeFalsy,
        });
      });
    });

    new Setting(contentEl).setName("Hide title").addToggle((toggle) => {
      toggle.setValue(hideTitle);
      toggle.onChange((value) => {
        hideTitle = value;
        this.updatePreview({
          heatmapTitle,
          heatmapSubtitle,
          year,
          separateMonths,
          showCurrentDayBorder,
          palette,
          hideTabs,
          hideYear,
          hideTitle,
          hideSubtitle,
          showWeekNums,
          defaultView,
          excludeFalsy,
        });
      });
    });

    new Setting(contentEl).setName("Hide subtitle").addToggle((toggle) => {
      toggle.setValue(hideSubtitle);
      toggle.onChange((value) => {
        hideSubtitle = value;
        this.updatePreview({
          heatmapTitle,
          heatmapSubtitle,
          year,
          separateMonths,
          showCurrentDayBorder,
          palette,
          hideTabs,
          hideYear,
          hideTitle,
          hideSubtitle,
          showWeekNums,
          defaultView,
          excludeFalsy,
        });
      });
    });

    new Setting(contentEl).setName("Show week numbers").addToggle((toggle) => {
      toggle.setValue(showWeekNums);
      toggle.onChange((value) => {
        showWeekNums = value;
        this.updatePreview({
          heatmapTitle,
          heatmapSubtitle,
          year,
          separateMonths,
          showCurrentDayBorder,
          palette,
          hideTabs,
          hideYear,
          hideTitle,
          hideSubtitle,
          showWeekNums,
          defaultView,
          excludeFalsy,
        });
      });
    });

    new Setting(contentEl).setName("Default view").addDropdown((dropdown) => {
      Object.values(IHeatmapView).forEach((v) => {
        dropdown.addOption(v, v);
      });
      dropdown.setValue(defaultView);
      dropdown.onChange((value) => {
        defaultView = value as IHeatmapView;
        this.updatePreview({
          heatmapTitle,
          heatmapSubtitle,
          year,
          separateMonths,
          showCurrentDayBorder,
          palette,
          hideTabs,
          hideYear,
          hideTitle,
          hideSubtitle,
          showWeekNums,
          defaultView,
          excludeFalsy,
        });
      });
    });

    // Preview Section
    contentEl.createEl("h3", { text: "Preview" });
    this.previewContainer = contentEl.createDiv({
      cls: "heatmap-modal-preview",
    });

    // Initial preview render
    this.updatePreview({
      heatmapTitle,
      heatmapSubtitle,
      year,
      separateMonths,
      showCurrentDayBorder,
      palette,
      hideTabs,
      hideYear,
      hideTitle,
      hideSubtitle,
      showWeekNums,
      defaultView,
      excludeFalsy,
    });

    // Submit Button
    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Insert Heatmap")
        .setCta()
        .onClick(() => {
          this.close();
          this.onSubmit({
            heatmapTitle,
            heatmapSubtitle,
            property,
            year,
            separateMonths,
            showCurrentDayBorder,
            disableFileCreation,
            excludeFalsy,
            colorScheme: { paletteName: palette },
            path: path ? path : undefined,
            ui: {
              hideTabs: hideTabs ? true : undefined,
              hideYear: hideYear ? true : undefined,
              hideTitle: hideTitle ? true : undefined,
              hideSubtitle: hideSubtitle ? true : undefined,
              showWeekNums: showWeekNums ? true : undefined,
              defaultView:
                defaultView !== IHeatmapView.HeatmapTracker
                  ? defaultView
                  : undefined,
            },
          });
        })
    );
  }

  onClose() {
    const { contentEl } = this;
    // Clean up React root
    if (this.previewRoot) {
      this.previewRoot.unmount();
      this.previewRoot = null;
    }
    this.previewContainer = null;
    contentEl.empty();
  }

  private updatePreview(config: {
    heatmapTitle: string;
    heatmapSubtitle: string;
    year: number;
    separateMonths: boolean;
    showCurrentDayBorder: boolean;
    palette: string;
    hideTabs: boolean;
    hideYear: boolean;
    hideTitle: boolean;
    hideSubtitle: boolean;
    showWeekNums: boolean;
    defaultView: IHeatmapView;
    excludeFalsy: boolean;
  }) {
    if (!this.previewContainer) return;

    // Clean up previous render
    if (this.previewRoot) {
      this.previewRoot.unmount();
    }
    this.previewContainer.empty();

    // Create tracker data for preview with empty entries
    const previewData = {
      entries: [],
      year: config.year,
      heatmapTitle: config.heatmapTitle || "Preview Title",
      heatmapSubtitle: config.heatmapSubtitle || "Preview Subtitle",
      showCurrentDayBorder: config.showCurrentDayBorder,
      colorScheme: { paletteName: config.palette },
      ui: {
        hideTabs: config.hideTabs ? true : undefined,
        hideYear: config.hideYear ? true : undefined,
        hideTitle: config.hideTitle ? true : undefined,
        hideSubtitle: config.hideSubtitle ? true : undefined,
        showWeekNums: config.showWeekNums ? true : undefined,
        defaultView:
          config.defaultView !== IHeatmapView.HeatmapTracker
            ? config.defaultView
            : undefined,
      },
      intensityConfig: {
        excludeFalsy: config.excludeFalsy,
      },
    };

    // Merge with plugin settings, using preview palette
    const previewSettings = {
      ...this.settings,
      separateMonths: config.separateMonths,
      showWeekNums: config.showWeekNums,
    };

    // Render preview
    const container = this.previewContainer.createDiv({
      cls: "heatmap-tracker-container",
    });
    renderApp(
      container,
      this.app,
      previewSettings,
      previewData,
      React.createElement(ReactApp)
    );
  }
}
