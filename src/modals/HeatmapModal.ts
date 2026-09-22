import {
  App,
  ButtonComponent,
  DropdownComponent,
  Modal,
  Setting,
  getAllTags,
  setIcon,
} from "obsidian";
import { getDataviewApi } from "src/utils/dataviewApi";
import { Entry, IHeatmapView, TrackerSettings } from "../types";
import React from "react";
import { Root } from "react-dom/client";
import { renderApp } from "../render";
import ReactApp from "../App";
import {
  buildEntriesFromDataview,
  normalizeTag,
} from "../utils/dataviewEntries";
import {
  DateRangeMode,
  FilterOperator,
  HeatmapLayout,
  HeatmapModalFormState,
  buildFilters,
  buildHeatmapConfig,
  buildPreviewTrackerData,
  buildTags,
  createInitialFormState,
  formStateFromConfig,
  validateHeatmapForm,
} from "./heatmapModal.utils";

const PREVIEW_DEBOUNCE_MS = 200;

/** Form fields the toggle/number helpers below are allowed to bind to. */
type BooleanFormKey = {
  [K in keyof HeatmapModalFormState]: HeatmapModalFormState[K] extends boolean
    ? K
    : never;
}[keyof HeatmapModalFormState];

type NumericTextFormKey = "daysToShow" | "monthsToShow" | "defaultIntensity";

/**
 * A small "add from suggestions or type your own, shown as removable chips"
 * control. Used for both tracked properties and tags — same interaction,
 * different data source.
 */
class ChipList {
  private chipsEl: HTMLElement;
  private dropdown: DropdownComponent | null = null;
  private customInputEl: HTMLInputElement | null = null;

  constructor(
    containerEl: HTMLElement,
    private options: {
      getValues: () => string[];
      add: (value: string) => void;
      remove: (value: string) => void;
      getSuggestions: () => string[];
      addPlaceholder: string;
      emptyLabel: string;
      onChange: () => void;
    },
  ) {
    this.chipsEl = containerEl.createDiv({
      cls: "heatmap-create-modal__chips",
    });
    this.renderChips();

    // One row, not two: picking from the vault's existing keys and typing a
    // new one are the same action, and two stacked Setting rows read as two
    // unrelated controls.
    const addRow = new Setting(containerEl).setClass(
      "heatmap-create-modal__add-property-row",
    );

    addRow.addDropdown((dropdown) => {
      this.dropdown = dropdown;
      this.refreshSuggestions();
      dropdown.onChange((value) => {
        if (!value) return;
        this.add(value);
        dropdown.setValue("");
      });
    });

    addRow.addText((text) => {
      text.setPlaceholder(options.addPlaceholder);
      this.customInputEl = text.inputEl;
      text.inputEl.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter") {
          evt.preventDefault();
          this.addFromCustomInput();
        }
      });
    });

    addRow.addButton((btn) =>
      btn.setButtonText("Add").onClick(() => this.addFromCustomInput()),
    );
  }

  refreshSuggestions() {
    const dropdown = this.dropdown;
    if (!dropdown) return;

    dropdown.selectEl.empty();
    dropdown.addOption("", "Add...");

    const values = this.options.getValues();
    for (const suggestion of this.options
      .getSuggestions()
      .filter((s) => !values.includes(s))) {
      dropdown.addOption(suggestion, suggestion);
    }
    dropdown.setValue("");
  }

  private addFromCustomInput() {
    const input = this.customInputEl;
    if (!input) return;
    this.add(input.value);
    input.value = "";
  }

  private add(value: string) {
    const trimmed = value.trim();
    if (!trimmed || this.options.getValues().includes(trimmed)) return;

    this.options.add(trimmed);
    this.renderChips();
    this.refreshSuggestions();
    this.options.onChange();
  }

  private remove(value: string) {
    this.options.remove(value);
    this.renderChips();
    this.refreshSuggestions();
    this.options.onChange();
  }

  private renderChips() {
    this.chipsEl.empty();
    const values = this.options.getValues();

    if (values.length === 0) {
      this.chipsEl.createSpan({
        cls: "heatmap-create-modal__chips-empty",
        text: this.options.emptyLabel,
      });
      return;
    }

    values.forEach((value) => {
      const chip = this.chipsEl.createDiv({
        cls: "heatmap-create-modal__chip",
      });
      chip.createSpan({ text: value });

      // `clickable-icon` is Obsidian's own icon-only button style: without it
      // the chip's X inherits the default button background and box-shadow,
      // which shows up as a grey plate inside the chip on hover.
      const removeBtn = chip.createEl("button", {
        cls: "clickable-icon heatmap-create-modal__chip-remove",
        attr: { "aria-label": `Remove ${value}` },
      });
      setIcon(removeBtn, "x");
      removeBtn.addEventListener("click", () => this.remove(value));
    });
  }
}

export class HeatmapModal extends Modal {
  private settings: TrackerSettings;
  private onSubmit: (result: Record<string, unknown>) => void;

  private formState: HeatmapModalFormState = createInitialFormState();

  private previewContainer: HTMLDivElement | null = null;
  private previewRoot: Root | null = null;
  private previewTimer: number | null = null;

  private errorsEl: HTMLElement | null = null;
  private matchesEl: HTMLElement | null = null;
  private submitButton: ButtonComponent | null = null;

  private propertyChipList: ChipList | null = null;
  private tagChipList: ChipList | null = null;
  private propertyDatalistEl: HTMLDataListElement | null = null;

  private dateRangeFieldsEl: HTMLElement | null = null;
  private customColorsEl: HTMLElement | null = null;
  private filtersEl: HTMLElement | null = null;
  private separateMonthsSettingEl: HTMLElement | null = null;

  constructor(
    app: App,
    settings: TrackerSettings,
    onSubmit: (result: Record<string, unknown>) => void,
    /** Existing codeblock config to edit; omit to create a new heatmap. */
    private initialConfig?: Record<string, unknown>,
  ) {
    super(app);
    this.settings = settings;
    this.onSubmit = onSubmit;
  }

  private get isEditing(): boolean {
    return this.initialConfig !== undefined;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.modalEl.addClass("heatmap-create-modal");
    this.formState = this.initialConfig
      ? formStateFromConfig(this.initialConfig)
      : createInitialFormState();

    this.setTitle(
      this.isEditing ? "Edit Heatmap Tracker" : "Create new Heatmap Tracker",
    );

    const body = contentEl.createDiv({ cls: "heatmap-create-modal-body" });
    const fieldsEl = body.createDiv({
      cls: "heatmap-create-modal-body__fields",
    });
    const previewColEl = body.createDiv({
      cls: "heatmap-create-modal-body__preview-col",
    });

    // Everything needed for a working heatmap stays visible; the rest is one
    // click away, so the form reads as "3 fields" rather than "40 settings".
    this.renderEssentialsSection(fieldsEl);
    this.renderFilteringSection(
      this.addCollapsibleSection(fieldsEl, "Filtering"),
    );
    this.renderLayoutSection(
      this.addCollapsibleSection(fieldsEl, "Layout & date range"),
    );
    this.renderAppearanceSection(
      this.addCollapsibleSection(fieldsEl, "Appearance"),
    );
    this.renderIntensitySection(
      this.addCollapsibleSection(fieldsEl, "Intensity scale"),
    );
    this.renderUiSection(
      this.addCollapsibleSection(fieldsEl, "Visible elements & behavior"),
    );

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

  /**
   * A native `<details>` group. Collapsed by default — see the progressive
   * disclosure note in `onOpen` — and no JS toggle state to keep in sync.
   */
  private addCollapsibleSection(
    contentEl: HTMLElement,
    title: string,
  ): HTMLElement {
    const details = contentEl.createEl("details", {
      cls: "heatmap-create-modal__section",
    });
    const summary = details.createEl("summary", {
      cls: "heatmap-create-modal__section-summary",
    });
    // Obsidian's own collapsibles use a chevron, not the browser's default
    // triangle (which `list-style: none` below removes).
    setIcon(
      summary.createSpan({ cls: "heatmap-create-modal__section-chevron" }),
      "chevron-right",
    );
    summary.createSpan({ text: title });

    return details.createDiv({ cls: "heatmap-create-modal__section-body" });
  }

  private renderEssentialsSection(contentEl: HTMLElement) {
    new Setting(contentEl)
      .setName("Properties to track")
      .setDesc(
        "Frontmatter key(s) to read from your notes (e.g. 'exercise: 10' or 'reading: true'). Add more than one to sum their values on the same heatmap.",
      );
    this.propertyChipList = new ChipList(contentEl, {
      getValues: () => this.formState.properties,
      add: (value) => this.formState.properties.push(value),
      remove: (value) => {
        this.formState.properties = this.formState.properties.filter(
          (p) => p !== value,
        );
      },
      getSuggestions: () => this.getVaultProperties(),
      addPlaceholder: "Or type a custom property name",
      emptyLabel: "No properties selected yet.",
      onChange: () => this.refresh(),
    });

    new Setting(contentEl)
      .setName("Folder path")
      .setDesc(
        "Folder to search for notes in (optional). Leave blank to search the whole vault.",
      )
      .addText((text) =>
        text.setValue(this.formState.path).onChange((value) => {
          this.formState.path = value;
          this.propertyChipList?.refreshSuggestions();
          this.refreshPropertyDatalist();
          this.refresh();
        }),
      );

    new Setting(contentEl)
      .setName("Title")
      .setDesc('Displayed above the heatmap. Stored as "heatmapTitle".')
      .addText((text) =>
        text.setValue(this.formState.heatmapTitle).onChange((value) => {
          this.formState.heatmapTitle = value;
          this.refresh();
        }),
      );

    // The property datalist is shared with the filter rows further down, so it
    // has to exist before any of them render.
    this.propertyDatalistEl = contentEl.createEl("datalist", {
      attr: { id: "heatmap-create-modal-property-list" },
    });
    this.refreshPropertyDatalist();
  }

  private renderFilteringSection(contentEl: HTMLElement) {
    new Setting(contentEl)
      .setName("Tags")
      .setDesc(
        "Only include notes with at least one of these tags (optional). Leave empty to include notes regardless of tags.",
      );
    this.tagChipList = new ChipList(contentEl, {
      getValues: () => this.formState.tags,
      add: (value) => this.formState.tags.push(normalizeTag(value)),
      remove: (value) => {
        this.formState.tags = this.formState.tags.filter((t) => t !== value);
      },
      getSuggestions: () => this.getVaultTags(),
      addPlaceholder: "Or type a tag (e.g. journal)",
      emptyLabel: "No tag filter — notes of any tag are included.",
      onChange: () => this.refresh(),
    });

    new Setting(contentEl)
      .setName("Additional conditions")
      .setDesc(
        'Optionally narrow results further by frontmatter value (e.g. only notes where "status" equals "done"). All conditions must match.',
      );
    this.filtersEl = contentEl.createDiv({
      cls: "heatmap-create-modal__filters",
    });
    this.renderFiltersEditor();
  }

  private renderLayoutSection(contentEl: HTMLElement) {
    new Setting(contentEl)
      .setName("Subtitle")
      .setDesc('Displayed under the title. Stored as "heatmapSubtitle".')
      .addText((text) =>
        text.setValue(this.formState.heatmapSubtitle).onChange((value) => {
          this.formState.heatmapSubtitle = value;
          this.refresh();
        }),
      );

    new Setting(contentEl).setName("Layout").addDropdown((dropdown) => {
      dropdown.addOption("default", "Default (week columns)");
      dropdown.addOption("monthly", "Monthly (one row per month)");
      dropdown.addOption("month", "Single month (calendar)");
      dropdown.addOption("week", "Single week (one row)");
      dropdown.setValue(this.formState.layout);
      dropdown.onChange((value) => {
        this.formState.layout = value as HeatmapLayout;
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

    new Setting(contentEl)
      .setName("Year")
      .setDesc("Year shown by default. Ignored if a date range is set above.")
      .addText((text) => {
        text.inputEl.type = "number";
        text.setValue(String(this.formState.year));
        text.onChange((value) => {
          this.formState.year = Number(value);
          this.refresh();
        });
      });

    this.separateMonthsSettingEl = this.addToggleSetting(
      contentEl,
      "separateMonths",
      "Separate months",
      "Visually separate months in the default layout.",
    ).settingEl;
    this.updateSeparateMonthsVisibility();
  }

  private renderAppearanceSection(contentEl: HTMLElement) {
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
    this.customColorsEl.toggleClass(
      "is-hidden",
      !this.formState.useCustomColors,
    );
    this.renderCustomColorsEditor();

    this.addToggleSetting(
      contentEl,
      "showCurrentDayBorder",
      "Show current day border",
    );
  }

  /**
   * A boolean form field. Every toggle in this modal does the same three
   * things, so they are declared rather than hand-written.
   */
  private addToggleSetting(
    contentEl: HTMLElement,
    key: BooleanFormKey,
    name: string,
    desc?: string,
  ) {
    const setting = new Setting(contentEl).setName(name);
    if (desc) setting.setDesc(desc);

    setting.addToggle((toggle) => {
      toggle.setValue(this.formState[key]);
      toggle.onChange((value) => {
        this.formState[key] = value;
        this.refresh();
      });
    });

    return setting;
  }

  /** A number field kept as raw text, so it can be empty while typing. */
  private addNumberSetting(
    contentEl: HTMLElement,
    key: NumericTextFormKey,
    name: string,
    options: { desc?: string; placeholder?: string } = {},
  ) {
    const setting = new Setting(contentEl).setName(name);
    if (options.desc) setting.setDesc(options.desc);

    setting.addText((text) => {
      text.inputEl.type = "number";
      if (options.placeholder) text.setPlaceholder(options.placeholder);
      text.setValue(this.formState[key]);
      text.onChange((value) => {
        this.formState[key] = value;
        this.refresh();
      });
    });

    return setting;
  }

  private renderIntensitySection(contentEl: HTMLElement) {
    new Setting(contentEl)
      .setName("Scale start / end")
      .setDesc(
        "Optional min/max values for the intensity scale (e.g. only color values between 30 and 120). Leave blank to derive from the data.",
      )
      .addText((text) => {
        text.setPlaceholder("min");
        text.inputEl.type = "number";
        text.setValue(this.formState.scaleStart);
        text.onChange((value) => {
          this.formState.scaleStart = value;
          this.refresh();
        });
      })
      .addText((text) => {
        text.setPlaceholder("max");
        text.inputEl.type = "number";
        text.setValue(this.formState.scaleEnd);
        text.onChange((value) => {
          this.formState.scaleEnd = value;
          this.refresh();
        });
      });

    this.addNumberSetting(contentEl, "defaultIntensity", "Default intensity", {
      desc: "Intensity used for entries that don't specify one. Default: 4.",
      placeholder: "4",
    });

    this.addToggleSetting(
      contentEl,
      "showOutOfRange",
      "Show out-of-range entries",
      "If off, entries outside the scale start/end are hidden instead of clamped.",
    );

    this.addToggleSetting(
      contentEl,
      "excludeFalsy",
      "Exclude zero/falsy values",
      "If enabled, 0 or blank values will be ignored and won't break streaks.",
    );
  }

  private renderUiSection(contentEl: HTMLElement) {
    // The only toggle that doesn't re-render the preview: it changes nothing
    // visible, and re-running the preview on it would just be noise.
    new Setting(contentEl)
      .setName("Disable file creation")
      .setDesc("Clicking an empty box won't offer to create a new note.")
      .addToggle((toggle) => {
        toggle.setValue(this.formState.disableFileCreation);
        toggle.onChange((value) => {
          this.formState.disableFileCreation = value;
        });
      });

    this.addToggleSetting(contentEl, "hideTabs", "Hide tabs");
    this.addToggleSetting(contentEl, "hideYear", "Hide year");
    this.addToggleSetting(contentEl, "hideTitle", "Hide title");
    this.addToggleSetting(contentEl, "hideSubtitle", "Hide subtitle");
    this.addToggleSetting(contentEl, "showWeekNums", "Show week numbers");

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
    this.matchesEl = contentEl.createDiv({
      cls: "heatmap-create-modal__matches",
    });
    this.previewContainer = contentEl.createDiv({
      cls: "heatmap-modal-preview",
    });
  }

  private renderSubmitSection(contentEl: HTMLElement) {
    new Setting(contentEl)
      .setClass("heatmap-create-modal__submit-row")
      .addButton((btn) => {
        this.submitButton = btn;
        btn
          .setButtonText(this.isEditing ? "Save changes" : "Insert Heatmap")
          .setCta()
          .onClick(() => {
            if (validateHeatmapForm(this.formState).length > 0) return;
            this.close();
            this.onSubmit(buildHeatmapConfig(this.formState));
          });
      });
  }

  // ---------------------------------------------------------------------
  // Vault lookups (property/tag suggestions)
  // ---------------------------------------------------------------------

  private getVaultProperties(): string[] {
    const dv = getDataviewApi(this.app);
    if (!dv) return [];

    const props = new Set<string>();
    const pages = dv.pages(
      this.formState.path ? `"${this.formState.path}"` : undefined,
    );
    for (const page of pages) {
      if (page.file?.frontmatter) {
        for (const key of Object.keys(page.file.frontmatter)) {
          props.add(key);
        }
      }
    }
    return [...props].sort();
  }

  private getVaultTags(): string[] {
    const tags = new Set<string>();
    for (const file of this.app.vault.getMarkdownFiles()) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (!cache) continue;
      for (const tag of getAllTags(cache) ?? []) {
        tags.add(tag);
      }
    }
    return [...tags].sort();
  }

  private refreshPropertyDatalist() {
    const datalist = this.propertyDatalistEl;
    if (!datalist) return;

    datalist.empty();
    this.getVaultProperties().forEach((p) => {
      datalist.createEl("option", { attr: { value: p } });
    });
  }

  // ---------------------------------------------------------------------
  // Additional conditions (filters)
  // ---------------------------------------------------------------------

  private renderFiltersEditor() {
    const container = this.filtersEl;
    if (!container) return;
    container.empty();

    this.formState.filters.forEach((filter, index) => {
      const row = new Setting(container).setClass(
        "heatmap-create-modal__filter-row",
      );

      row.addText((text) => {
        text.setPlaceholder("Property");
        text.inputEl.setAttribute("list", "heatmap-create-modal-property-list");
        text.setValue(filter.property);
        text.onChange((value) => {
          this.formState.filters[index].property = value;
          this.refresh();
        });
      });

      row.addDropdown((dropdown) => {
        dropdown.addOption("equals", "Equals");
        dropdown.addOption("contains", "Contains");
        dropdown.addOption("notEmpty", "Is not empty");
        dropdown.setValue(filter.operator);
        dropdown.onChange((value) => {
          this.formState.filters[index].operator = value as FilterOperator;
          this.renderFiltersEditor();
          this.refresh();
        });
      });

      if (filter.operator !== "notEmpty") {
        row.addText((text) => {
          text.setPlaceholder("Value");
          text.setValue(filter.value);
          text.onChange((value) => {
            this.formState.filters[index].value = value;
            this.refresh();
          });
        });
      }

      row.addExtraButton((btn) => {
        btn
          .setIcon("x")
          .setTooltip("Remove condition")
          .onClick(() => {
            this.formState.filters.splice(index, 1);
            this.renderFiltersEditor();
            this.refresh();
          });
      });
    });

    const addBtn = container.createEl("button", {
      cls: "heatmap-create-modal__add-button",
      text: "Add condition",
    });
    addBtn.addEventListener("click", () => {
      this.formState.filters.push({
        property: "",
        operator: "equals",
        value: "",
      });
      this.renderFiltersEditor();
      this.refresh();
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
        this.addNumberSetting(container, "daysToShow", "Number of days");
        break;
      case "months":
        this.addNumberSetting(
          container,
          "monthsToShow",
          "Previous months to include",
          { desc: "e.g. 3 shows the current month plus the 3 prior." },
        );
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
    // Only the default week-column grid draws month gaps.
    this.separateMonthsSettingEl?.toggleClass(
      "is-hidden",
      this.formState.layout !== "default",
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
        cls: "clickable-icon heatmap-create-modal__chip-remove",
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
      cls: "heatmap-create-modal__add-button",
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

    const dv = getDataviewApi(this.app);
    if (!dv) return [];

    try {
      return buildEntriesFromDataview(dv, {
        path: this.formState.path,
        property: properties.length === 1 ? properties[0] : properties,
        tags: buildTags(this.formState),
        filters: buildFilters(this.formState),
      });
    } catch (e) {
      console.warn("Heatmap Tracker: failed to build preview entries", e);
      return [];
    }
  }

  /**
   * The one number that tells the user whether their property/path/tags
   * actually select anything — without it an empty preview is indistinguishable
   * from a misspelled property name.
   */
  private renderMatchesSummary(count: number) {
    const el = this.matchesEl;
    if (!el) return;

    el.empty();

    if (this.formState.properties.filter(Boolean).length === 0) {
      el.toggleClass("is-empty", false);
      return;
    }

    const noDataview = !getDataviewApi(this.app);
    el.toggleClass("is-empty", count === 0 || noDataview);
    el.textContent = noDataview
      ? "Dataview is not available, so no notes can be matched."
      : count === 0
        ? "No matching notes found — check the property name and folder path."
        : `${count} matching ${count === 1 ? "note" : "notes"} found.`;
  }

  private updatePreview() {
    if (!this.previewContainer) return;

    if (this.previewRoot) {
      this.previewRoot.unmount();
    }
    this.previewContainer.empty();

    const entries = this.getPreviewEntries();
    this.renderMatchesSummary(entries.length);

    const previewData = buildPreviewTrackerData(this.formState, entries);

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
