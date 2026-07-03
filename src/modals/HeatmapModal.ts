import { App, Modal, Setting } from "obsidian";
import { getAPI } from "obsidian-dataview";
import { IHeatmapView, TrackerSettings } from "../types";
import React from "react";
import { Root } from "react-dom/client";
import { renderApp } from "../render";
import ReactApp from "../App";

interface HeatmapModalFormState {
  heatmapTitle: string;
  heatmapSubtitle: string;
  property: string;
  path: string;
  year: number;
  separateMonths: boolean;
  showCurrentDayBorder: boolean;
  disableFileCreation: boolean;
  excludeFalsy: boolean;
  palette: string;
  hideTabs: boolean;
  hideYear: boolean;
  hideTitle: boolean;
  hideSubtitle: boolean;
  showWeekNums: boolean;
  defaultView: IHeatmapView;
}

function createInitialFormState(): HeatmapModalFormState {
  return {
    heatmapTitle: "",
    heatmapSubtitle: "",
    property: "",
    path: "",
    year: new Date().getFullYear(),
    separateMonths: true,
    showCurrentDayBorder: true,
    disableFileCreation: false,
    excludeFalsy: false,
    palette: "default",
    hideTabs: false,
    hideYear: false,
    hideTitle: false,
    hideSubtitle: false,
    showWeekNums: false,
    defaultView: IHeatmapView.HeatmapTracker,
  };
}

export class HeatmapModal extends Modal {
  private settings: TrackerSettings;
  private onSubmit: (result: any) => void;
  private previewContainer: HTMLDivElement | null = null;
  private previewRoot: Root | null = null;
  private formState: HeatmapModalFormState = createInitialFormState();

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
    this.formState = createInitialFormState();

    this.setTitle("Create new Heatmap Tracker (beta)");

    // Title
    new Setting(contentEl)
      .setName("Title")
      .setDesc('Values stored in "heatmapTitle"')
      .addText((text) =>
        text.onChange((value) => {
          this.formState.heatmapTitle = value;
          this.updatePreview();
        })
      );

    // Subtitle
    new Setting(contentEl)
      .setName("Subtitle")
      .setDesc('Values stored in "heatmapSubtitle"')
      .addText((text) =>
        text.onChange((value) => {
          this.formState.heatmapSubtitle = value;
          this.updatePreview();
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
      .setDesc("The frontmatter key to track in your daily notes (e.g. 'exercise: 10' or 'reading: true').")
      .addDropdown((dropdown) => {
        dropdown.addOption("", "Select a property...");
        const sortedProps = [...props].sort();
        sortedProps.forEach((p) => dropdown.addOption(p, p));

        dropdown.onChange((value) => {
          this.formState.property = value;
        });
      });

    // Year
    new Setting(contentEl).setName("Year").addText((text) => {
      text.inputEl.type = "number";
      text.setValue(String(this.formState.year));
      text.onChange((value) => {
        this.formState.year = Number(value);
        this.updatePreview();
      });
    });

    // Path
    new Setting(contentEl)
      .setName("Folder path")
      .setDesc("Folder to search in (optional)")
      .addText((text) =>
        text.onChange((value) => {
          this.formState.path = value;
        })
      );

    // Palette
    new Setting(contentEl).setName("Palette").addDropdown((dropdown) => {
      Object.keys(this.settings.palettes).forEach((p) => {
        dropdown.addOption(p, p);
      });
      dropdown.setValue(this.formState.palette);
      dropdown.onChange((value) => {
        this.formState.palette = value;
        this.updatePreview();
      });
    });

    // Separate Months
    new Setting(contentEl).setName("Separate months").addToggle((toggle) => {
      toggle.setValue(this.formState.separateMonths);
      toggle.onChange((value) => {
        this.formState.separateMonths = value;
        this.updatePreview();
      });
    });

    // Show Current Day Border
    new Setting(contentEl)
      .setName("Show current day border")
      .addToggle((toggle) => {
        toggle.setValue(this.formState.showCurrentDayBorder);
        toggle.onChange((value) => {
          this.formState.showCurrentDayBorder = value;
          this.updatePreview();
        });
      });

    // Disable File Creation
    new Setting(contentEl)
      .setName("Disable file creation")
      .addToggle((toggle) => {
        toggle.setValue(this.formState.disableFileCreation);
        toggle.onChange((value) => {
          this.formState.disableFileCreation = value;
        });
      });

    // Exclude Falsy
    new Setting(contentEl)
      .setName("Exclude zero/falsy values")
      .setDesc("If enabled, 0 or blank values will be ignored and won't break streaks.")
      .addToggle((toggle) => {
        toggle.setValue(this.formState.excludeFalsy);
        toggle.onChange((value) => {
          this.formState.excludeFalsy = value;
          this.updatePreview();
        });
      });

    // UI Settings
    contentEl.createEl("h3", { text: "UI Settings" });

    new Setting(contentEl).setName("Hide tabs").addToggle((toggle) => {
      toggle.setValue(this.formState.hideTabs);
      toggle.onChange((value) => {
        this.formState.hideTabs = value;
        this.updatePreview();
      });
    });

    new Setting(contentEl).setName("Hide year").addToggle((toggle) => {
      toggle.setValue(this.formState.hideYear);
      toggle.onChange((value) => {
        this.formState.hideYear = value;
        this.updatePreview();
      });
    });

    new Setting(contentEl).setName("Hide title").addToggle((toggle) => {
      toggle.setValue(this.formState.hideTitle);
      toggle.onChange((value) => {
        this.formState.hideTitle = value;
        this.updatePreview();
      });
    });

    new Setting(contentEl).setName("Hide subtitle").addToggle((toggle) => {
      toggle.setValue(this.formState.hideSubtitle);
      toggle.onChange((value) => {
        this.formState.hideSubtitle = value;
        this.updatePreview();
      });
    });

    new Setting(contentEl).setName("Show week numbers").addToggle((toggle) => {
      toggle.setValue(this.formState.showWeekNums);
      toggle.onChange((value) => {
        this.formState.showWeekNums = value;
        this.updatePreview();
      });
    });

    new Setting(contentEl).setName("Default view").addDropdown((dropdown) => {
      Object.values(IHeatmapView).forEach((v) => {
        dropdown.addOption(v, v);
      });
      dropdown.setValue(this.formState.defaultView);
      dropdown.onChange((value) => {
        this.formState.defaultView = value as IHeatmapView;
        this.updatePreview();
      });
    });

    // Preview Section
    contentEl.createEl("h3", { text: "Preview" });
    this.previewContainer = contentEl.createDiv({
      cls: "heatmap-modal-preview",
    });

    // Initial preview render
    this.updatePreview();

    // Submit Button
    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Insert Heatmap")
        .setCta()
        .onClick(() => {
          this.close();
          const state = this.formState;
          this.onSubmit({
            heatmapTitle: state.heatmapTitle,
            heatmapSubtitle: state.heatmapSubtitle,
            property: state.property,
            year: state.year,
            separateMonths: state.separateMonths,
            showCurrentDayBorder: state.showCurrentDayBorder,
            disableFileCreation: state.disableFileCreation,
            excludeFalsy: state.excludeFalsy,
            colorScheme: { paletteName: state.palette },
            path: state.path ? state.path : undefined,
            ui: {
              hideTabs: state.hideTabs ? true : undefined,
              hideYear: state.hideYear ? true : undefined,
              hideTitle: state.hideTitle ? true : undefined,
              hideSubtitle: state.hideSubtitle ? true : undefined,
              showWeekNums: state.showWeekNums ? true : undefined,
              defaultView:
                state.defaultView !== IHeatmapView.HeatmapTracker
                  ? state.defaultView
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

  private updatePreview() {
    if (!this.previewContainer) return;

    // Clean up previous render
    if (this.previewRoot) {
      this.previewRoot.unmount();
    }
    this.previewContainer.empty();

    const state = this.formState;

    // Create tracker data for preview with empty entries
    const previewData = {
      entries: [],
      year: state.year,
      heatmapTitle: state.heatmapTitle || "Preview Title",
      heatmapSubtitle: state.heatmapSubtitle || "Preview Subtitle",
      showCurrentDayBorder: state.showCurrentDayBorder,
      colorScheme: { paletteName: state.palette },
      ui: {
        hideTabs: state.hideTabs ? true : undefined,
        hideYear: state.hideYear ? true : undefined,
        hideTitle: state.hideTitle ? true : undefined,
        hideSubtitle: state.hideSubtitle ? true : undefined,
        showWeekNums: state.showWeekNums ? true : undefined,
        defaultView:
          state.defaultView !== IHeatmapView.HeatmapTracker
            ? state.defaultView
            : undefined,
      },
      intensityConfig: {
        excludeFalsy: state.excludeFalsy,
      },
    };

    // Merge with plugin settings, using preview palette
    const previewSettings = {
      ...this.settings,
      separateMonths: state.separateMonths,
      showWeekNums: state.showWeekNums,
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
