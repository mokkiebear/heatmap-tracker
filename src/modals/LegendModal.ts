import { App, Modal, Setting } from "obsidian";
import i18n from "src/localization/i18n";
import { LegendEntry } from "src/utils/report/legend";
import { normalizeColor } from "src/utils/report/legendMatch";
import { RowDragController, reorder } from "./legendModal/RowDragController";
import {
  LegendRowContext,
  renderEntryRow,
  renderGradientGroupRow,
} from "./legendModal/legendRows";
import { mergeLegendWithDefaults } from "./legendModal/legendEntries";
import { LegendDisplayMode } from "src/types";

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
  private drag = new RowDragController<LegendEntry[]>((dragged, target) => {
    this.entries = reorder(this.entries, dragged, target);
    this.renderRows();
  });

  constructor(
    app: App,
    initialEntries: LegendEntry[],
    /** What "Refresh" merges in and "Reset" restores (see `buildRefreshBaseline`). */
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
    this.setTitle(i18n.t("report.legendEditor.title"));

    contentEl.createEl("p", {
      cls: "heatmap-legend-modal__hint",
      text: i18n.t("report.legendEditor.intro"),
    });

    this.listEl = contentEl.createDiv({ cls: "heatmap-legend-modal__list" });
    this.renderRows();

    const footnote = contentEl.createEl("p", {
      cls: "heatmap-legend-modal__footnote",
    });
    footnote.appendText(i18n.t("report.legendEditor.reorderHint"));
    footnote.createEl("br");
    footnote.appendText(i18n.t("report.legendEditor.valueHint"));

    this.renderButtonRow(contentEl);

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText(i18n.t("report.actions.done"))
        .setCta()
        .onClick(() => {
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

    // Obsidian's own dropdown class; a bare <select> in this row would be
    // styled like the buttons beside it.
    const modeSelect = buttonRow.createEl("select", {
      cls: "heatmap-legend-modal__mode-select dropdown",
    });
    modeSelect.createEl("option", {
      value: "separate",
      text: i18n.t("report.legendEditor.separateRows"),
    });
    modeSelect.createEl("option", {
      value: "gradient",
      text: i18n.t("report.legendEditor.gradientRow"),
    });
    modeSelect.value = this.legendMode;
    modeSelect.addEventListener("change", () => {
      this.legendMode = modeSelect.value as LegendDisplayMode;
      this.renderRows();
    });

    const refreshBtn = buttonRow.createEl("button", {
      attr: { "aria-label": i18n.t("report.legendEditor.refreshTooltip") },
      text: i18n.t("report.legendEditor.refreshColors"),
    });
    refreshBtn.addEventListener("click", () => {
      this.entries = mergeLegendWithDefaults(this.entries, this.baseline);
      this.renderRows();
    });

    const resetBtn = buttonRow.createEl("button", {
      cls: "mod-warning",
      attr: { "aria-label": i18n.t("report.legendEditor.resetTooltip") },
      text: i18n.t("report.actions.reset"),
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
        text: i18n.t("report.legendEditor.empty"),
      });
      return;
    }

    const ctx = this.rowContext;

    if (this.legendMode !== "gradient") {
      this.entries.forEach((entry) => renderEntryRow(ctx, container, entry));
      return;
    }

    // The group row sits where the first palette entry sits, which is what
    // lets it be dragged.
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
