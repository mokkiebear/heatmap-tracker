import { Setting, setIcon } from "obsidian";
import { IHeatmapView } from "src/types";
import { DateRangeMode, HeatmapLayout } from "../heatmapModal.utils";
import {
  HeatmapFormHost,
  addListButton,
  addNumberSetting,
  addTextSetting,
  addToggleSetting,
} from "./formControls";

/** Layout, date range and the year field. */
export function renderLayoutSection(
  host: HeatmapFormHost,
  contentEl: HTMLElement,
) {
  addTextSetting(
    host,
    contentEl,
    "heatmapSubtitle",
    "Subtitle",
    'Displayed under the title. Stored as "heatmapSubtitle".',
  );

  new Setting(contentEl).setName("Layout").addDropdown((dropdown) => {
    dropdown.addOption("default", "Default (week columns)");
    dropdown.addOption("monthly", "Monthly (one row per month)");
    dropdown.addOption("month", "Single month (calendar)");
    dropdown.addOption("week", "Single week (one row)");
    dropdown.setValue(host.state.layout);
    dropdown.onChange((value) => {
      host.state.layout = value as HeatmapLayout;
      updateSeparateMonthsVisibility();
      host.refresh();
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
      dropdown.setValue(host.state.dateRangeMode);
      dropdown.onChange((value) => {
        host.state.dateRangeMode = value as DateRangeMode;
        renderDateRangeFields();
        updateYearVisibility();
        host.refresh();
      });
    });

  const dateRangeFieldsEl = contentEl.createDiv();

  function renderDateRangeFields() {
    dateRangeFieldsEl.empty();

    switch (host.state.dateRangeMode) {
      case "days":
        addNumberSetting(
          host,
          dateRangeFieldsEl,
          "daysToShow",
          "Number of days",
        );
        break;
      case "months":
        addNumberSetting(
          host,
          dateRangeFieldsEl,
          "monthsToShow",
          "Previous months to include",
          { desc: "e.g. 3 shows the current month plus the 3 prior." },
        );
        break;
      case "custom":
        new Setting(dateRangeFieldsEl)
          .setName("Start date / end date")
          .addText((text) => {
            text.inputEl.type = "date";
            text.setValue(host.state.startDate);
            text.onChange((value) => {
              host.state.startDate = value;
              host.refresh();
            });
          })
          .addText((text) => {
            text.inputEl.type = "date";
            text.setValue(host.state.endDate);
            text.onChange((value) => {
              host.state.endDate = value;
              host.refresh();
            });
          });
        break;
      case "full-year":
      default:
        break;
    }
  }

  renderDateRangeFields();

  const yearSettingEl = new Setting(contentEl)
    .setName("Year")
    .setDesc("Year shown by default. Ignored if a date range is set above.")
    .addText((text) => {
      text.inputEl.type = "number";
      text.setValue(String(host.state.year));
      text.onChange((value) => {
        host.state.year = Number(value);
        host.refresh();
      });
    }).settingEl;

  function updateYearVisibility() {
    // A date range pins its own dates, so `year` does nothing — don't show a
    // field the heatmap will ignore.
    yearSettingEl.toggleClass(
      "is-hidden",
      host.state.dateRangeMode !== "full-year",
    );
  }

  updateYearVisibility();

  const separateMonthsSettingEl = addToggleSetting(
    host,
    contentEl,
    "separateMonths",
    "Separate months",
    "Visually separate months in the default layout.",
  ).settingEl;

  function updateSeparateMonthsVisibility() {
    // Only the default week-column grid draws month gaps.
    separateMonthsSettingEl.toggleClass(
      "is-hidden",
      host.state.layout !== "default",
    );
  }

  updateSeparateMonthsVisibility();
}

/** Palette choice, optional custom color list, current-day border. */
export function renderAppearanceSection(
  host: HeatmapFormHost,
  contentEl: HTMLElement,
) {
  new Setting(contentEl).setName("Palette").addDropdown((dropdown) => {
    Object.keys(host.settings.palettes).forEach((p) => {
      dropdown.addOption(p, p);
    });
    dropdown.setValue(host.state.palette);
    dropdown.onChange((value) => {
      host.state.palette = value;
      host.refresh();
    });
  });

  new Setting(contentEl)
    .setName("Use custom colors")
    .setDesc("Override the palette above with your own list of colors.")
    .addToggle((toggle) => {
      toggle.setValue(host.state.useCustomColors);
      toggle.onChange((value) => {
        host.state.useCustomColors = value;
        customColorsEl.toggleClass("is-hidden", !value);
        host.refresh();
      });
    });

  const customColorsEl = contentEl.createDiv({
    cls: "heatmap-create-modal__custom-colors",
  });
  customColorsEl.toggleClass("is-hidden", !host.state.useCustomColors);

  function renderCustomColorsEditor() {
    customColorsEl.empty();

    const list = customColorsEl.createDiv({
      cls: "heatmap-create-modal__color-list",
    });

    host.state.customColors.forEach((color, index) => {
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
        host.state.customColors[index] = input.value;
        host.refresh();
      });

      const removeBtn = row.createEl("button", {
        cls: "clickable-icon heatmap-create-modal__chip-remove",
        attr: { "aria-label": "Remove color" },
      });
      setIcon(removeBtn, "x");
      removeBtn.addEventListener("click", () => {
        host.state.customColors.splice(index, 1);
        renderCustomColorsEditor();
        host.refresh();
      });
    });

    addListButton(customColorsEl, "Add color", () => {
      host.state.customColors.push("#7bc96f");
      renderCustomColorsEditor();
      host.refresh();
    });
  }

  renderCustomColorsEditor();

  addToggleSetting(
    host,
    contentEl,
    "showCurrentDayBorder",
    "Show current day border",
  );
}

/** Intensity scale bounds and the out-of-range/falsy handling toggles. */
export function renderIntensitySection(
  host: HeatmapFormHost,
  contentEl: HTMLElement,
) {
  new Setting(contentEl)
    .setName("Scale start / end")
    .setDesc(
      "Optional min/max values for the intensity scale (e.g. only color values between 30 and 120). Leave blank to derive from the data.",
    )
    .addText((text) => {
      text.setPlaceholder("min");
      text.inputEl.type = "number";
      text.setValue(host.state.scaleStart);
      text.onChange((value) => {
        host.state.scaleStart = value;
        host.refresh();
      });
    })
    .addText((text) => {
      text.setPlaceholder("max");
      text.inputEl.type = "number";
      text.setValue(host.state.scaleEnd);
      text.onChange((value) => {
        host.state.scaleEnd = value;
        host.refresh();
      });
    });

  addNumberSetting(host, contentEl, "defaultIntensity", "Default intensity", {
    desc: "Intensity used for entries that don't specify one. Default: 4.",
    placeholder: "4",
  });

  addToggleSetting(
    host,
    contentEl,
    "showOutOfRange",
    "Show out-of-range entries",
    "If off, entries outside the scale start/end are hidden instead of clamped.",
  );

  addToggleSetting(
    host,
    contentEl,
    "excludeFalsy",
    "Exclude zero/falsy values",
    "If enabled, 0 or blank values will be ignored and won't break streaks.",
  );

  new Setting(contentEl)
    .setName("Combine values by")
    .setDesc(
      "How a day is scored when several values feed into it — several tracked properties, or several entries on the same date. Average scores a day on the values it actually has, so a missing evening entry doesn't darken the box.",
    )
    .addDropdown((dropdown) => {
      dropdown.addOption("sum", "Sum");
      dropdown.addOption("average", "Average");
      dropdown.setValue(host.state.aggregation);
      dropdown.onChange((value) => {
        host.state.aggregation = value as "sum" | "average";
        host.refresh();
      });
    });
}

/** Which chrome elements are visible, and the default tab. */
export function renderUiSection(host: HeatmapFormHost, contentEl: HTMLElement) {
  // The only toggle that doesn't re-render the preview: it changes nothing
  // visible, and re-running the preview on it would just be noise.
  new Setting(contentEl)
    .setName("Disable file creation")
    .setDesc("Clicking an empty box won't offer to create a new note.")
    .addToggle((toggle) => {
      toggle.setValue(host.state.disableFileCreation);
      toggle.onChange((value) => {
        host.state.disableFileCreation = value;
      });
    });

  addToggleSetting(host, contentEl, "hideTabs", "Hide tabs");
  addToggleSetting(host, contentEl, "hideYear", "Hide year");
  addToggleSetting(host, contentEl, "hideTitle", "Hide title");
  addToggleSetting(host, contentEl, "hideSubtitle", "Hide subtitle");
  addToggleSetting(host, contentEl, "showWeekNums", "Show week numbers");

  new Setting(contentEl).setName("Default view").addDropdown((dropdown) => {
    Object.values(IHeatmapView).forEach((v) => {
      dropdown.addOption(v, v);
    });
    dropdown.setValue(host.state.defaultView);
    dropdown.onChange((value) => {
      host.state.defaultView = value as IHeatmapView;
      host.refresh();
    });
  });
}
