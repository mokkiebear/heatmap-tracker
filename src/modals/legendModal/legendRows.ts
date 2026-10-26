import i18n from "src/localization/i18n";
import { App, setIcon } from "obsidian";
import {
  LegendEntry,
  nextLegendVisibility,
  setLegendVisibility,
} from "src/utils/report/legend";
import { GradientWeightsModal } from "./GradientWeightsModal";
import { RowDragController } from "./RowDragController";
import {
  addColorCell,
  applyVisibilityClasses,
  valueOverrideInput,
} from "./rowControls";
import {
  VISIBILITY_ICON,
  VISIBILITY_TITLE,
  aggregateVisibility,
  isBlankColor,
  paletteEntriesInOrder,
} from "./legendEntries";

/** What a row renderer needs from the modal that owns the list. */
export interface LegendRowContext {
  app: App;
  entries: LegendEntry[];
  colorsList: string[];
  drag: RowDragController<LegendEntry[]>;
  /** Re-renders the whole list after a visibility change. */
  rerender: () => void;
  getGradientLabel: () => string;
  setGradientLabel: (value: string) => void;
}

/** The eye button cycling shown → summary-hidden → hidden. */
function addVisibilityToggle(
  row: HTMLElement,
  entries: LegendEntry[],
  rerender: () => void,
  isGroup = false,
) {
  const visibility = aggregateVisibility(entries);
  const state = VISIBILITY_TITLE[visibility]();
  const button = row.createEl("button", {
    cls: "heatmap-legend-modal__include-toggle clickable-icon",
    attr: {
      "aria-label": isGroup
        ? i18n.t("report.legendEditor.groupToggle", { state })
        : state,
    },
  });
  setIcon(button, VISIBILITY_ICON[visibility]);
  button.addEventListener("click", () => {
    const next = nextLegendVisibility(visibility);
    entries.forEach((entry) => setLegendVisibility(entry, next));
    rerender();
  });
}

/**
 * Gradient mode's single row for every palette color: a swatch strip in
 * intensity order, the shared label, a gear for per-color weights and fixed
 * values, and an eye that applies to all of them. It drags as one block.
 */
export function renderGradientGroupRow(
  ctx: LegendRowContext,
  container: HTMLElement,
  paletteBlock: LegendEntry[],
) {
  const intensityOrder = paletteEntriesInOrder(ctx.entries, ctx.colorsList);

  const row = container.createDiv({ cls: "heatmap-legend-modal__row" });
  applyVisibilityClasses(row, intensityOrder);
  ctx.drag.wire(row, paletteBlock, "heatmap-legend-modal__handle");

  const strip = row.createDiv({ cls: "heatmap-legend-modal__gradient-strip" });
  intensityOrder.forEach((entry) => {
    const swatch = strip.createDiv({
      cls: "heatmap-legend-modal__gradient-strip-swatch",
    });
    swatch.style.backgroundColor = entry.color;
  });

  const labelInput = row.createEl("input", {
    cls: "heatmap-legend-modal__label-input",
    attr: {
      type: "text",
      placeholder: i18n.t("report.legendEditor.sharedLabelPlaceholder"),
    },
    value: ctx.getGradientLabel(),
  });
  labelInput.addEventListener("input", () =>
    ctx.setGradientLabel(labelInput.value),
  );

  const gearBtn = row.createEl("button", {
    cls: "heatmap-legend-modal__gear-button clickable-icon",
    attr: {
      "aria-label": i18n.t("report.legendEditor.weightsTooltip"),
    },
  });
  setIcon(gearBtn, "settings");
  gearBtn.addEventListener("click", () => {
    new GradientWeightsModal(ctx.app, intensityOrder).open();
  });

  addVisibilityToggle(row, intensityOrder, ctx.rerender, true);
}

/** One color's own row: swatch, label, fixed value, visibility. */
export function renderEntryRow(
  ctx: LegendRowContext,
  container: HTMLElement,
  entry: LegendEntry,
) {
  const row = container.createDiv({ cls: "heatmap-legend-modal__row" });
  applyVisibilityClasses(row, [entry]);
  ctx.drag.wire(row, [entry], "heatmap-legend-modal__handle");
  addColorCell(
    row,
    entry.color,
    isBlankColor(entry.color)
      ? i18n.t("report.legendEditor.blank")
      : entry.color,
  );

  const labelInput = row.createEl("input", {
    cls: "heatmap-legend-modal__label-input",
    attr: {
      type: "text",
      placeholder: i18n.t("report.legendEditor.labelPlaceholder"),
    },
    value: entry.label,
  });
  labelInput.addEventListener("input", () => {
    entry.label = labelInput.value;
  });

  valueOverrideInput(row, entry);
  addVisibilityToggle(row, [entry], ctx.rerender);
}
