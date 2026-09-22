import { App, Modal, Setting } from "obsidian";
import { LegendEntry } from "src/utils/report/legend";
import { normalizeColor } from "src/utils/report/legendMatch";
import { RowDragController } from "./legendModal/RowDragController";
import {
  LegendRowContext,
  renderEntryRow,
  renderGradientGroupRow,
} from "./legendModal/legendRows";
import {
  LegendDisplayMode,
  mergeLegendWithDefaults,
  reorderLegendEntries,
} from "./legendModal/legendEntries";

// Re-exported so existing importers (and tests) keep one entry point for the
// legend editor's pure helpers.
export {
  LegendDisplayMode,
  aggregateVisibility,
  mergeLegendWithDefaults,
  paletteEntriesInOrder,
  reorderLegendEntries,
} from "./legendModal/legendEntries";

/**
 * Popup editor for the report's {color, label} legend, driving both the legend
 * under the heatmap and the summary's day-type breakdown
 * (`src/utils/report/legend.ts`).
 *
 * Rows are auto-populated by the caller (one per intensity color plus the
 * blank/background color), so there is deliberately no add/delete here — only
 * customization. Reopening shows exactly what was last saved; "Refresh"
 * (`mergeLegendWithDefaults`) and "Reset" both work off `baseline`.
 *
 * Colors are not editable: they come from the calendar's real palette, so
 * retyping one would only desync the swatch from what the calendar shows.
 *
 * Rows drag by their grip handle to set separate-mode order. The eye button
 * cycles three visibility states (`LegendVisibility`) affecting display only —
 * the days still count toward the summary either way.
 *
 * In "gradient" mode every palette color squashes into one row: a swatch
 * strip, a shared label, a gear opening `GradientWeightsModal`, and a group
 * eye button. That row drags as one block. Colors outside the palette (and
 * the blank color) always keep their own row in both modes.
 *
 * Row markup lives in `./legendModal/legendRows.ts`, the pure list logic in
 * `./legendModal/legendEntries.ts`.
 */
export class LegendModal extends Modal {
  private entries: LegendEntry[];
  private listEl: HTMLElement | null = null;
  private drag = new RowDragController((dragged, target) => {
    this.entries = reorderLegendEntries(this.entries, dragged, target);
    this.renderRows();
  });

  constructor(
    app: App,
    initialEntries: LegendEntry[],
    /**
     * Every color used ANYWHERE in the whole calendar, not just within the
     * export's currently selected date range (see `buildRefreshBaseline`) -
     * shared by "Refresh" (merge it in, keeping existing customizations) and
     * "Reset" (discard everything and clone it fresh), so neither one shows
     * a narrower set of colors than the other depending on which is clicked.
     */
    private baseline: LegendEntry[],
    private colorsList: string[],
    private legendMode: LegendDisplayMode,
    private gradientLabel: string,
    private onSave: (
      entries: LegendEntry[],
      legendMode: LegendDisplayMode,
      gradientLabel: string,
    ) => void,
  ) {
    super(app);
    this.entries = initialEntries.map((entry) => ({ ...entry }));
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

    const footnote = contentEl.createEl("p", {
      cls: "heatmap-legend-modal__footnote",
    });
    footnote.appendText(
      "Drag rows to reorder. Click the eye to cycle through shown, summary-hidden, and fully hidden.",
    );
    footnote.createEl("br");
    footnote.appendText(
      "Optionally set fixed values to make every day in that category use the same value.",
    );

    this.renderButtonRow(contentEl);

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Done")
        .setCta()
        .onClick(() => {
          // Every row is already a real, meaningful color slot (auto-
          // populated by the caller) - there's no "untouched Add row" junk
          // to filter out anymore, so entries are saved exactly as edited.
          this.onSave(this.entries, this.legendMode, this.gradientLabel);
          this.close();
        }),
    );
  }

  onClose() {
    this.contentEl.empty();
  }

  private renderButtonRow(contentEl: HTMLElement) {
    const buttonRow = contentEl.createDiv({
      cls: "heatmap-legend-modal__button-row",
    });

    // "dropdown" is Obsidian's own class for select elements (applied
    // automatically by its DropdownComponent elsewhere) - without it, a bare
    // <select> picks up the same border/background/height as a <button> and
    // reads as one more button in the row instead of a distinct dropdown.
    const modeSelect = buttonRow.createEl("select", {
      cls: "heatmap-legend-modal__mode-select dropdown",
    });
    modeSelect.createEl("option", { value: "separate", text: "Separate rows" });
    modeSelect.createEl("option", {
      value: "gradient",
      text: "Single gradient row",
    });
    modeSelect.value = this.legendMode;
    modeSelect.addEventListener("change", () => {
      this.legendMode = modeSelect.value as LegendDisplayMode;
      this.renderRows();
    });

    const refreshBtn = buttonRow.createEl("button", {
      attr: {
        "aria-label":
          "Fetch new colors and drop stale ones, keeping everything else as-is",
      },
      text: "Refresh colors",
    });
    refreshBtn.addEventListener("click", () => {
      this.entries = mergeLegendWithDefaults(this.entries, this.baseline);
      this.renderRows();
    });

    const resetBtn = buttonRow.createEl("button", {
      cls: "mod-warning",
      attr: { "aria-label": "Discard all customizations and start over" },
      text: "Reset",
    });
    resetBtn.addEventListener("click", () => {
      this.entries = this.baseline.map((entry) => ({ ...entry }));
      this.renderRows();
    });
  }

  private get rowContext(): LegendRowContext {
    return {
      app: this.app,
      entries: this.entries,
      colorsList: this.colorsList,
      drag: this.drag,
      rerender: () => this.renderRows(),
      getGradientLabel: () => this.gradientLabel,
      setGradientLabel: (value) => {
        this.gradientLabel = value;
      },
    };
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
      return;
    }

    const ctx = this.rowContext;

    if (this.legendMode !== "gradient") {
      this.entries.forEach((entry) => renderEntryRow(ctx, container, entry));
      return;
    }

    // The group row renders wherever the palette-color block currently sits
    // in `this.entries` (at the position of the first palette-color entry
    // encountered) rather than always first - that's what makes it draggable
    // to a genuinely different position, not just visually fixed up front.
    const paletteColors = new Set(this.colorsList.map(normalizeColor));
    const paletteBlock = this.entries.filter((entry) =>
      paletteColors.has(normalizeColor(entry.color)),
    );
    let groupRendered = false;

    this.entries.forEach((entry) => {
      if (paletteColors.has(normalizeColor(entry.color))) {
        if (!groupRendered) {
          renderGradientGroupRow(ctx, container, paletteBlock);
          groupRendered = true;
        }
        return;
      }
      renderEntryRow(ctx, container, entry);
    });
  }
}
