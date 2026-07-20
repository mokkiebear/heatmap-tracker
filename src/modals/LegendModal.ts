import { App, Modal, Setting, setIcon } from "obsidian";
import { EMPTY_CELL_COLOR } from "../utils/report/heatmapHtml";
import { LegendEntry } from "../utils/report/legend";

function isBlankColor(color: string): boolean {
  return color.trim().toLowerCase() === EMPTY_CELL_COLOR.trim().toLowerCase();
}

/**
 * Popup editor for the report's {color, label} legend. The same list drives
 * both the legend rendered under the heatmap and the summary's day-type
 * breakdown (see src/utils/report/legend.ts). Rows can be dragged to reorder
 * (controls the order categories appear in the summary line) and toggled to
 * exclude a category from the summary line entirely (its days still count
 * correctly toward `Other`/matching — see `buildSummaryParts`).
 */
export class LegendModal extends Modal {
  private entries: LegendEntry[];
  private detectedColors: string[];
  private onSave: (entries: LegendEntry[]) => void;
  private listEl: HTMLElement | null = null;
  private dragFromIndex: number | null = null;

  constructor(
    app: App,
    initialEntries: LegendEntry[],
    detectedColors: string[],
    onSave: (entries: LegendEntry[]) => void,
  ) {
    super(app);
    this.entries = initialEntries.map((entry) => ({ ...entry }));
    this.detectedColors = detectedColors;
    this.onSave = onSave;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.modalEl.addClass("heatmap-legend-modal");
    this.setTitle("Calendar legend");

    contentEl.createEl("p", {
      cls: "heatmap-legend-modal__hint",
      text: "Define the meaning of each calendar color for legend and summary.",
    });

    this.listEl = contentEl.createDiv({ cls: "heatmap-legend-modal__list" });
    this.renderRows();

    const footnote = contentEl.createEl("p", { cls: "heatmap-legend-modal__footnote" });
    footnote.appendText("Drag rows to reorder. Hide a category to exclude it from the summary.");
    footnote.createEl("br");
    footnote.appendText("Optionally set fixed values to make every day in that category use the same value.");

    const buttonRow = contentEl.createDiv({ cls: "heatmap-legend-modal__button-row" });

    const addBtn = buttonRow.createEl("button", {
      cls: "mod-cta",
      text: "Add row",
    });
    addBtn.addEventListener("click", () => {
      this.entries.push({ color: "#7bc96f", label: "" });
      this.renderRows();
    });

    const resetBtn = buttonRow.createEl("button", {
      text: "Reset",
    });
    resetBtn.addEventListener("click", () => {
      this.entries = this.detectedColors.map((color) => ({ color, label: "" }));
      this.renderRows();
    });

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Done")
        .setCta()
        .onClick(() => {
          this.onSave(this.entries.filter((entry) => entry.label.trim() !== ""));
          this.close();
        }),
    );
  }

  onClose() {
    this.contentEl.empty();
  }

  private renderRows() {
    const container = this.listEl;
    if (!container) return;
    container.empty();

    if (this.entries.length === 0) {
      container.createSpan({
        cls: "heatmap-legend-modal__empty",
        text: "No legend entries yet.",
      });
    }

    this.entries.forEach((entry, index) => {
      const row = container.createDiv({ cls: "heatmap-legend-modal__row" });
      row.toggleClass("is-excluded", entry.includeInSummary === false);
      row.setAttribute("draggable", "true");

      row.addEventListener("dragstart", (evt) => {
        this.dragFromIndex = index;
        row.addClass("is-dragging");
        evt.dataTransfer?.setData("text/plain", String(index));
      });
      row.addEventListener("dragend", () => {
        this.dragFromIndex = null;
        row.removeClass("is-dragging");
      });
      row.addEventListener("dragover", (evt) => {
        evt.preventDefault();
      });
      row.addEventListener("drop", (evt) => {
        evt.preventDefault();
        const fromIndex = this.dragFromIndex;
        if (fromIndex === null || fromIndex === index) return;
        const [moved] = this.entries.splice(fromIndex, 1);
        this.entries.splice(index, 0, moved);
        this.renderRows();
      });

      const handle = row.createDiv({ cls: "heatmap-legend-modal__handle" });
      setIcon(handle, "grip-vertical");

      const swatch = row.createDiv({ cls: "heatmap-legend-modal__swatch" });
      swatch.style.backgroundColor = entry.color;

      const blank = isBlankColor(entry.color);
      const colorInput = row.createEl("input", {
        cls: "heatmap-legend-modal__color-input",
        attr: { type: "text", placeholder: "#7bc96f" },
        value: blank ? "Blank" : entry.color,
      });
      if (blank) {
        colorInput.disabled = true;
      } else {
        colorInput.addEventListener("input", () => {
          entry.color = colorInput.value;
          swatch.style.backgroundColor = colorInput.value;
        });
      }

      const labelInput = row.createEl("input", {
        cls: "heatmap-legend-modal__label-input",
        attr: { type: "text", placeholder: "Label (e.g. Workday)" },
        value: entry.label,
      });
      labelInput.addEventListener("input", () => {
        entry.label = labelInput.value;
      });

      const valueOverrideInput = row.createEl("input", {
        cls: "heatmap-legend-modal__value-input",
        attr: {
          type: "number",
          step: "any",
          placeholder: "value",
          title: "To set fixed value (overriding actual values)",
          "aria-label": "To set fixed value (overriding actual values)",
        },
        value: entry.valueOverride !== undefined ? String(entry.valueOverride) : "",
      });
      valueOverrideInput.addEventListener("input", () => {
        const trimmed = valueOverrideInput.value.trim();
        const parsed = Number(trimmed);
        entry.valueOverride = trimmed === "" || Number.isNaN(parsed) ? undefined : parsed;
      });

      const included = entry.includeInSummary !== false;
      const includeToggleLabel = included ? "Click to exclude from summary" : "Click to include in summary";
      const includeToggle = row.createEl("button", {
        cls: "heatmap-legend-modal__include-toggle",
        attr: {
          title: includeToggleLabel,
          "aria-label": includeToggleLabel,
        },
      });
      setIcon(includeToggle, included ? "eye" : "eye-off");
      includeToggle.addEventListener("click", () => {
        entry.includeInSummary = included ? false : true;
        this.renderRows();
      });

      const removeBtn = row.createEl("button", {
        cls: "heatmap-legend-modal__remove-button",
        attr: { "aria-label": "Remove row" },
      });
      setIcon(removeBtn, "x");
      removeBtn.addEventListener("click", () => {
        this.entries.splice(index, 1);
        this.renderRows();
      });
    });
  }
}
