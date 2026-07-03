import {
  App,
  ButtonComponent,
  DropdownComponent,
  Modal,
  Setting,
  setIcon,
} from "obsidian";
import { getAPI } from "obsidian-dataview";
import { Entry, IHeatmapView, TrackerSettings } from "../types";
import React from "react";
import { Root } from "react-dom/client";
import { renderApp } from "../render";
import ReactApp from "../App";
import { buildEntriesFromDataview } from "../utils/dataviewEntries";
import {
  DateRangeMode,
  HeatmapModalFormState,
  buildHeatmapConfig,
  buildPreviewTrackerData,
  createInitialFormState,
  validateHeatmapForm,
} from "./heatmapModal.utils";

const PREVIEW_DEBOUNCE_MS = 200;

export class HeatmapModal extends Modal {
  private settings: TrackerSettings;
  private onSubmit: (result: Record<string, unknown>) => void;

  private formState: HeatmapModalFormState = createInitialFormState();

  private previewContainer: HTMLDivElement | null = null;
  private previewRoot: Root | null = null;
  private previewTimer: number | null = null;

  private errorsEl: HTMLElement | null = null;
  private submitButton: ButtonComponent | null = null;

  private propertyChipsEl: HTMLElement | null = null;
  private propertyDropdown: DropdownComponent | null = null;
  private customPropertyInputEl: HTMLInputElement | null = null;

  private dateRangeFieldsEl: HTMLElement | null = null;
  private customColorsEl: HTMLElement | null = null;
  private separateMonthsSettingEl: HTMLElement | null = null;

  constructor(
    app: App,
    settings: TrackerSettings,
    onSubmit: (result: Record<string, unknown>) => void,
  ) {
    super(app);
    this.settings = settings;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.modalEl.addClass("heatmap-create-modal");
    this.formState = createInitialFormState();

    this.setTitle("Create new Heatmap Tracker");

    const body = contentEl.createDiv({ cls: "heatmap-create-modal-body" });
    const fieldsEl = body.createDiv({
      cls: "heatmap-create-modal-body__fields",
    });
    const previewColEl = body.createDiv({
      cls: "heatmap-create-modal-body__preview-col",
    });

    this.renderBasicSection(fieldsEl);
    this.renderDataSourceSection(fieldsEl);
    this.renderDateRangeSection(fieldsEl);
    this.renderAppearanceSection(fieldsEl);
    this.renderIntensitySection(fieldsEl);
    this.renderBehaviorSection(fieldsEl);
    this.renderUiSection(fieldsEl);

    this.renderErrorsBanner(previewColEl);
    this.renderPreviewSection(previewColEl);
    this.renderSubmitSection(previewColEl);

    this.refresh();
  }

  onClose() {
    const { contentEl } = this;
    if (this.previewTimer !== null) {
      window.clearTimeout(this.previewTimer);
      this.previewTimer = null;
    }
    if (this.previewRoot) {
      this.previewRoot.unmount();
      this.previewRoot = null;
    }
    this.previewContainer = null;
    contentEl.empty();
  }

  // ---------------------------------------------------------------------
  // Sections
  // ---------------------------------------------------------------------

  private addSectionHeading(contentEl: HTMLElement, text: string) {
    contentEl.createEl("h3", {
      text,
      cls: "heatmap-create-modal__section-heading",
    });
  }

  private renderBasicSection(contentEl: HTMLElement) {
    new Setting(contentEl)
      .setName("Title")
      .setDesc('Displayed above the heatmap. Stored as "heatmapTitle".')
      .addText((text) =>
        text.onChange((value) => {
          this.formState.heatmapTitle = value;
          this.refresh();
        }),
      );

    new Setting(contentEl)
      .setName("Subtitle")
      .setDesc('Displayed under the title. Stored as "heatmapSubtitle".')
      .addText((text) =>
        text.onChange((value) => {
          this.formState.heatmapSubtitle = value;
          this.refresh();
        }),
      );

    new Setting(contentEl)
      .setName("Year")
      .setDesc(
        "Year shown by default. Ignored if a date range override below is set.",
      )
      .addText((text) => {
        text.inputEl.type = "number";
        text.setValue(String(this.formState.year));
        text.onChange((value) => {
          this.formState.year = Number(value);
          this.refresh();
        });
      });
  }

  private renderDataSourceSection(contentEl: HTMLElement) {
    this.addSectionHeading(contentEl, "Data source");

    new Setting(contentEl)
      .setName("Folder path")
      .setDesc(
        "Folder to search for notes in (optional). Leave blank to search the whole vault.",
      )
      .addText((text) =>
        text.onChange((value) => {
          this.formState.path = value;
          this.refreshPropertyDropdownOptions();
          this.refresh();
        }),
      );

    const propertiesSetting = new Setting(contentEl)
      .setName("Properties to track")
      .setDesc(
        "Frontmatter key(s) to read from your notes (e.g. 'exercise: 10' or 'reading: true'). Add more than one to sum their values on the same heatmap.",
      );
    this.propertyChipsEl = propertiesSetting.controlEl.createDiv({
      cls: "heatmap-create-modal__chips",
    });
    this.renderPropertyChips();

    const addFromVault = new Setting(contentEl).setClass(
      "heatmap-create-modal__add-property-row",
    );
    addFromVault.addDropdown((dropdown) => {
      this.propertyDropdown = dropdown;
      this.refreshPropertyDropdownOptions();
      dropdown.onChange((value) => {
        if (!value) return;
        this.addProperty(value);
        dropdown.setValue("");
      });
    });

    const addCustom = new Setting(contentEl).setClass(
      "heatmap-create-modal__add-property-row",
    );
    addCustom.addText((text) => {
      text.setPlaceholder("Or type a custom property name");
      this.customPropertyInputEl = text.inputEl;
      text.inputEl.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter") {
          evt.preventDefault();
          this.addCustomProperty();
        }
      });
    });
    addCustom.addButton((btn) =>
      btn.setButtonText("Add").onClick(() => this.addCustomProperty()),
    );
  }

  private renderDateRangeSection(contentEl: HTMLElement) {
    this.addSectionHeading(contentEl, "Layout & date range");

    new Setting(contentEl).setName("Layout").addDropdown((dropdown) => {
      dropdown.addOption("default", "Default (week columns)");
      dropdown.addOption("monthly", "Monthly (one row per month)");
      dropdown.setValue(this.formState.layout);
      dropdown.onChange((value) => {
        this.formState.layout = value as "default" | "monthly";
        this.updateSeparateMonthsVisibility();
        this.refresh();
      });
    });

    new Setting(contentEl)
      .setName("Date range")
      .setDesc("Narrows which dates are shown instead of the full year.")
      .addDropdown((dropdown) => {
        dropdown.addOption("full-year", "Full year");
        dropdown.addOption("days", "Last N days");
        dropdown.addOption("months", "Current + N previous months");
        dropdown.addOption("custom", "Custom range (start/end date)");
        dropdown.setValue(this.formState.dateRangeMode);
        dropdown.onChange((value) => {
          this.formState.dateRangeMode = value as DateRangeMode;
          this.renderDateRangeFields();
          this.refresh();
        });
      });

    this.dateRangeFieldsEl = contentEl.createDiv();
    this.renderDateRangeFields();

    this.separateMonthsSettingEl = new Setting(contentEl)
      .setName("Separate months")
      .setDesc("Visually separate months in the default layout.")
      .addToggle((toggle) => {
        toggle.setValue(this.formState.separateMonths);
        toggle.onChange((value) => {
          this.formState.separateMonths = value;
          this.refresh();
        });
      }).settingEl;
    this.updateSeparateMonthsVisibility();
  }

  private renderAppearanceSection(contentEl: HTMLElement) {
    this.addSectionHeading(contentEl, "Appearance");

    new Setting(contentEl).setName("Palette").addDropdown((dropdown) => {
      Object.keys(this.settings.palettes).forEach((p) => {
        dropdown.addOption(p, p);
      });
      dropdown.setValue(this.formState.palette);
      dropdown.onChange((value) => {
        this.formState.palette = value;
        this.refresh();
      });
    });

    new Setting(contentEl)
      .setName("Use custom colors")
      .setDesc("Override the palette above with your own list of colors.")
      .addToggle((toggle) => {
        toggle.setValue(this.formState.useCustomColors);
        toggle.onChange((value) => {
          this.formState.useCustomColors = value;
          this.customColorsEl?.toggleClass("is-hidden", !value);
          this.refresh();
        });
      });

    this.customColorsEl = contentEl.createDiv({
      cls: "heatmap-create-modal__custom-colors",
    });
    this.customColorsEl.toggleClass("is-hidden", !this.formState.useCustomColors);
    this.renderCustomColorsEditor();

    new Setting(contentEl)
      .setName("Show current day border")
      .addToggle((toggle) => {
        toggle.setValue(this.formState.showCurrentDayBorder);
        toggle.onChange((value) => {
          this.formState.showCurrentDayBorder = value;
          this.refresh();
        });
      });
  }

  private renderIntensitySection(contentEl: HTMLElement) {
    this.addSectionHeading(contentEl, "Intensity scale");

    new Setting(contentEl)
      .setName("Scale start / end")
      .setDesc(
        "Optional min/max values for the intensity scale (e.g. only color values between 30 and 120). Leave blank to derive from the data.",
      )
      .addText((text) => {
        text.setPlaceholder("min");
        text.inputEl.type = "number";
        text.onChange((value) => {
          this.formState.scaleStart = value;
          this.refresh();
        });
      })
      .addText((text) => {
        text.setPlaceholder("max");
        text.inputEl.type = "number";
        text.onChange((value) => {
          this.formState.scaleEnd = value;
          this.refresh();
        });
      });

    new Setting(contentEl)
      .setName("Default intensity")
      .setDesc("Intensity used for entries that don't specify one. Default: 4.")
      .addText((text) => {
        text.inputEl.type = "number";
        text.setPlaceholder("4");
        text.onChange((value) => {
          this.formState.defaultIntensity = value;
          this.refresh();
        });
      });

    new Setting(contentEl)
      .setName("Show out-of-range entries")
      .setDesc("If off, entries outside the scale start/end are hidden instead of clamped.")
      .addToggle((toggle) => {
        toggle.setValue(this.formState.showOutOfRange);
        toggle.onChange((value) => {
          this.formState.showOutOfRange = value;
          this.refresh();
        });
      });

    new Setting(contentEl)
      .setName("Exclude zero/falsy values")
      .setDesc("If enabled, 0 or blank values will be ignored and won't break streaks.")
      .addToggle((toggle) => {
        toggle.setValue(this.formState.excludeFalsy);
        toggle.onChange((value) => {
          this.formState.excludeFalsy = value;
          this.refresh();
        });
      });
  }

  private renderBehaviorSection(contentEl: HTMLElement) {
    this.addSectionHeading(contentEl, "Behavior");

    new Setting(contentEl)
      .setName("Disable file creation")
      .setDesc("Clicking an empty box won't offer to create a new note.")
      .addToggle((toggle) => {
        toggle.setValue(this.formState.disableFileCreation);
        toggle.onChange((value) => {
          this.formState.disableFileCreation = value;
        });
      });
  }

  private renderUiSection(contentEl: HTMLElement) {
    this.addSectionHeading(contentEl, "UI settings");

    new Setting(contentEl).setName("Hide tabs").addToggle((toggle) => {
      toggle.setValue(this.formState.hideTabs);
      toggle.onChange((value) => {
        this.formState.hideTabs = value;
        this.refresh();
      });
    });

    new Setting(contentEl).setName("Hide year").addToggle((toggle) => {
      toggle.setValue(this.formState.hideYear);
      toggle.onChange((value) => {
        this.formState.hideYear = value;
        this.refresh();
      });
    });

    new Setting(contentEl).setName("Hide title").addToggle((toggle) => {
      toggle.setValue(this.formState.hideTitle);
      toggle.onChange((value) => {
        this.formState.hideTitle = value;
        this.refresh();
      });
    });

    new Setting(contentEl).setName("Hide subtitle").addToggle((toggle) => {
      toggle.setValue(this.formState.hideSubtitle);
      toggle.onChange((value) => {
        this.formState.hideSubtitle = value;
        this.refresh();
      });
    });

    new Setting(contentEl).setName("Show week numbers").addToggle((toggle) => {
      toggle.setValue(this.formState.showWeekNums);
      toggle.onChange((value) => {
        this.formState.showWeekNums = value;
        this.refresh();
      });
    });

    new Setting(contentEl).setName("Default view").addDropdown((dropdown) => {
      Object.values(IHeatmapView).forEach((v) => {
        dropdown.addOption(v, v);
      });
      dropdown.setValue(this.formState.defaultView);
      dropdown.onChange((value) => {
        this.formState.defaultView = value as IHeatmapView;
        this.refresh();
      });
    });
  }

  private renderErrorsBanner(contentEl: HTMLElement) {
    this.errorsEl = contentEl.createDiv({
      cls: "heatmap-create-modal__errors",
    });
  }

  private renderPreviewSection(contentEl: HTMLElement) {
    this.addSectionHeading(contentEl, "Preview");
    this.previewContainer = contentEl.createDiv({
      cls: "heatmap-modal-preview",
    });
  }

  private renderSubmitSection(contentEl: HTMLElement) {
    new Setting(contentEl).addButton((btn) => {
      this.submitButton = btn;
      btn
        .setButtonText("Insert Heatmap")
        .setCta()
        .onClick(() => {
          if (validateHeatmapForm(this.formState).length > 0) return;
          this.close();
          this.onSubmit(buildHeatmapConfig(this.formState));
        });
    });
  }

  // ---------------------------------------------------------------------
  // Property chips
  // ---------------------------------------------------------------------

  private getVaultProperties(): string[] {
    const dv = getAPI(this.app);
    if (!dv) return [];

    const props = new Set<string>();
    const pages = dv.pages(this.formState.path ? `"${this.formState.path}"` : undefined);
    for (const page of pages) {
      if (page.file?.frontmatter) {
        for (const key of Object.keys(page.file.frontmatter)) {
          props.add(key);
        }
      }
    }
    return [...props].sort();
  }

  private refreshPropertyDropdownOptions() {
    const dropdown = this.propertyDropdown;
    if (!dropdown) return;

    const selectEl = dropdown.selectEl;
    selectEl.empty();
    dropdown.addOption("", "Add tracked property...");

    const available = this.getVaultProperties().filter(
      (p) => !this.formState.properties.includes(p),
    );
    available.forEach((p) => dropdown.addOption(p, p));
    dropdown.setValue("");
  }

  private addProperty(property: string) {
    const trimmed = property.trim();
    if (!trimmed || this.formState.properties.includes(trimmed)) return;

    this.formState.properties.push(trimmed);
    this.renderPropertyChips();
    this.refreshPropertyDropdownOptions();
    this.refresh();
  }

  private addCustomProperty() {
    const input = this.customPropertyInputEl;
    if (!input) return;

    this.addProperty(input.value);
    input.value = "";
  }

  private removeProperty(property: string) {
    this.formState.properties = this.formState.properties.filter(
      (p) => p !== property,
    );
    this.renderPropertyChips();
    this.refreshPropertyDropdownOptions();
    this.refresh();
  }

  private renderPropertyChips() {
    const container = this.propertyChipsEl;
    if (!container) return;

    container.empty();

    if (this.formState.properties.length === 0) {
      container.createSpan({
        cls: "heatmap-create-modal__chips-empty",
        text: "No properties selected yet.",
      });
      return;
    }

    this.formState.properties.forEach((property) => {
      const chip = container.createDiv({
        cls: "heatmap-create-modal__chip",
      });
      chip.createSpan({ text: property });

      const removeBtn = chip.createEl("button", {
        cls: "heatmap-create-modal__chip-remove",
        attr: { "aria-label": `Remove ${property}` },
      });
      setIcon(removeBtn, "x");
      removeBtn.addEventListener("click", () => this.removeProperty(property));
    });
  }

  // ---------------------------------------------------------------------
  // Conditional sub-sections
  // ---------------------------------------------------------------------

  private renderDateRangeFields() {
    const container = this.dateRangeFieldsEl;
    if (!container) return;
    container.empty();

    switch (this.formState.dateRangeMode) {
      case "days":
        new Setting(container).setName("Number of days").addText((text) => {
          text.inputEl.type = "number";
          text.setValue(this.formState.daysToShow);
          text.onChange((value) => {
            this.formState.daysToShow = value;
            this.refresh();
          });
        });
        break;
      case "months":
        new Setting(container)
          .setName("Previous months to include")
          .setDesc("e.g. 3 shows the current month plus the 3 prior.")
          .addText((text) => {
            text.inputEl.type = "number";
            text.setValue(this.formState.monthsToShow);
            text.onChange((value) => {
              this.formState.monthsToShow = value;
              this.refresh();
            });
          });
        break;
      case "custom":
        new Setting(container)
          .setName("Start date / end date")
          .addText((text) => {
            text.inputEl.type = "date";
            text.setValue(this.formState.startDate);
            text.onChange((value) => {
              this.formState.startDate = value;
              this.refresh();
            });
          })
          .addText((text) => {
            text.inputEl.type = "date";
            text.setValue(this.formState.endDate);
            text.onChange((value) => {
              this.formState.endDate = value;
              this.refresh();
            });
          });
        break;
      case "full-year":
      default:
        break;
    }
  }

  private updateSeparateMonthsVisibility() {
    this.separateMonthsSettingEl?.toggleClass(
      "is-hidden",
      this.formState.layout === "monthly",
    );
  }

  private renderCustomColorsEditor() {
    const container = this.customColorsEl;
    if (!container) return;
    container.empty();

    const list = container.createDiv({
      cls: "heatmap-create-modal__color-list",
    });

    this.formState.customColors.forEach((color, index) => {
      const row = list.createDiv({ cls: "heatmap-create-modal__color-row" });

      const swatch = row.createDiv({
        cls: "heatmap-create-modal__color-swatch",
      });
      swatch.style.backgroundColor = color;

      const input = row.createEl("input", {
        cls: "heatmap-create-modal__color-input",
        attr: { type: "text" },
        value: color,
      });
      input.addEventListener("input", () => {
        swatch.style.backgroundColor = input.value;
        this.formState.customColors[index] = input.value;
        this.refresh();
      });

      const removeBtn = row.createEl("button", {
        cls: "heatmap-create-modal__chip-remove",
        attr: { "aria-label": "Remove color" },
      });
      setIcon(removeBtn, "x");
      removeBtn.addEventListener("click", () => {
        this.formState.customColors.splice(index, 1);
        this.renderCustomColorsEditor();
        this.refresh();
      });
    });

    const addBtn = container.createEl("button", {
      cls: "mod-cta heatmap-create-modal__add-color-button",
      text: "Add color",
    });
    addBtn.addEventListener("click", () => {
      this.formState.customColors.push("#7bc96f");
      this.renderCustomColorsEditor();
      this.refresh();
    });
  }

  // ---------------------------------------------------------------------
  // Validation + preview
  // ---------------------------------------------------------------------

  private refresh() {
    const errors = validateHeatmapForm(this.formState);

    if (this.errorsEl) {
      this.errorsEl.empty();
      if (errors.length > 0) {
        const list = this.errorsEl.createEl("ul");
        errors.forEach((error) => list.createEl("li", { text: error }));
      }
    }

    this.submitButton?.setDisabled(errors.length > 0);

    this.schedulePreviewUpdate();
  }

  private schedulePreviewUpdate() {
    if (this.previewTimer !== null) {
      window.clearTimeout(this.previewTimer);
    }
    this.previewTimer = window.setTimeout(() => {
      this.previewTimer = null;
      this.updatePreview();
    }, PREVIEW_DEBOUNCE_MS);
  }

  private getPreviewEntries(): Entry[] {
    const properties = this.formState.properties.filter(Boolean);
    if (properties.length === 0) return [];

    const dv = getAPI(this.app);
    if (!dv) return [];

    try {
      return buildEntriesFromDataview(dv, {
        path: this.formState.path,
        property: properties.length === 1 ? properties[0] : properties,
      });
    } catch (e) {
      console.warn("Heatmap Tracker: failed to build preview entries", e);
      return [];
    }
  }

  private updatePreview() {
    if (!this.previewContainer) return;

    if (this.previewRoot) {
      this.previewRoot.unmount();
    }
    this.previewContainer.empty();

    const previewData = buildPreviewTrackerData(
      this.formState,
      this.getPreviewEntries(),
    );

    const container = this.previewContainer.createDiv({
      cls: "heatmap-tracker-container",
    });

    renderApp(
      container,
      this.app,
      this.settings,
      previewData,
      React.createElement(ReactApp),
      (root) => {
        this.previewRoot = root;
      },
    );
  }
}
