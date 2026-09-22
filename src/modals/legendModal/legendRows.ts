import { App, setIcon } from "obsidian";
import {
  LegendEntry,
  getLegendVisibility,
  nextLegendVisibility,
  setLegendVisibility,
} from "src/utils/report/legend";
import { GradientWeightsModal } from "./GradientWeightsModal";
import { RowDragController } from "./RowDragController";
import { valueOverrideInput } from "./rowControls";
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
  drag: RowDragController;
  /** Re-renders the whole list after a visibility change. */
  rerender: () => void;
  getGradientLabel: () => string;
  setGradientLabel: (value: string) => void;
}

/** The grip handle that arms a row's drag; returns nothing, wires itself. */
function addDragHandle(row: HTMLElement, arm: () => void) {
  const handle = row.createDiv({ cls: "heatmap-legend-modal__handle" });
  setIcon(handle, "grip-vertical");
  handle.addEventListener("mousedown", arm);
}

/** The eye button cycling shown → summary-hidden → hidden. */
function addVisibilityToggle(
  row: HTMLElement,
  entries: LegendEntry[],
  rerender: () => void,
  ariaSuffix = "",
) {
  const visibility = aggregateVisibility(entries);
  const button = row.createEl("button", {
    cls: "heatmap-legend-modal__include-toggle clickable-icon",
    attr: { "aria-label": VISIBILITY_TITLE[visibility] + ariaSuffix },
  });
  setIcon(button, VISIBILITY_ICON[visibility]);
  button.addEventListener("click", () => {
    const next = nextLegendVisibility(visibility);
    entries.forEach((entry) => setLegendVisibility(entry, next));
    rerender();
  });
}

function applyVisibilityClasses(row: HTMLElement, entries: LegendEntry[]) {
  const visibility = aggregateVisibility(entries);
  row.toggleClass("is-excluded", visibility === "summaryHidden");
  row.toggleClass("is-hidden", visibility === "hidden");
}

/**
 * The gradient-mode-only squashed row standing in for every palette-color
 * entry at once: a mini swatch strip (no HEX — it's several colors, not
 * one) instead of the usual single swatch, the shared label input, a gear
 * icon opening `GradientWeightsModal` for per-color weight/value, and a
 * group eye button that bulk-applies to every palette color at once.
 * Draggable via its own handle just like any other row - dropping it moves
 * `paletteBlock` (every palette-color entry, in the list's own current
 * relative order - not recomputed to intensity order) as one contiguous
 * block (see `reorderLegendEntries`). The swatch strip itself, and the
 * weights popup's own ordering, still always follow the palette's true
 * low-to-high intensity order (`paletteEntriesInOrder`) regardless of where
 * `paletteBlock` currently sits or how its members are internally ordered -
 * that's a display/data-entry concern, unrelated to this row's position
 * among the others.
 */
export function renderGradientGroupRow(
  ctx: LegendRowContext,
  container: HTMLElement,
  paletteBlock: LegendEntry[],
) {
  const intensityOrder = paletteEntriesInOrder(ctx.entries, ctx.colorsList);

  const row = container.createDiv({ cls: "heatmap-legend-modal__row" });
  applyVisibilityClasses(row, intensityOrder);
  addDragHandle(row, ctx.drag.wire(row, paletteBlock));

  const strip = row.createDiv({ cls: "heatmap-legend-modal__gradient-strip" });
  intensityOrder.forEach((entry) => {
    const swatch = strip.createDiv({
      cls: "heatmap-legend-modal__gradient-strip-swatch",
    });
    swatch.style.backgroundColor = entry.color;
  });

  const labelInput = row.createEl("input", {
    cls: "heatmap-legend-modal__label-input",
    attr: { type: "text", placeholder: "Shared label (e.g. Activity)" },
    value: ctx.getGradientLabel(),
  });
  labelInput.addEventListener("input", () =>
    ctx.setGradientLabel(labelInput.value),
  );

  const gearBtn = row.createEl("button", {
    cls: "heatmap-legend-modal__gear-button clickable-icon",
    attr: {
      "aria-label": "Set each palette color's day-count weight and fixed value",
    },
  });
  setIcon(gearBtn, "settings");
  gearBtn.addEventListener("click", () => {
    new GradientWeightsModal(ctx.app, intensityOrder).open();
  });

  // Bulk-applies to every palette color at once - the gear icon above still
  // lets each color's weight/value be set independently.
  addVisibilityToggle(
    row,
    intensityOrder,
    ctx.rerender,
    " (applies to every palette color)",
  );
}

/** One color's own row: swatch, label, fixed value, visibility. */
export function renderEntryRow(
  ctx: LegendRowContext,
  container: HTMLElement,
  entry: LegendEntry,
) {
  const row = container.createDiv({ cls: "heatmap-legend-modal__row" });
  row.toggleClass(
    "is-excluded",
    getLegendVisibility(entry) === "summaryHidden",
  );
  row.toggleClass("is-hidden", getLegendVisibility(entry) === "hidden");
  addDragHandle(row, ctx.drag.wire(row, [entry]));

  const swatch = row.createDiv({ cls: "heatmap-legend-modal__swatch" });
  swatch.style.backgroundColor = entry.color;

  // Colors are sourced automatically from the calendar's real palette (see
  // the LegendModal doc comment) - never editable, so shown as plain text
  // next to the swatch rather than a (disabled-looking) input box.
  row.createSpan({
    cls: "heatmap-legend-modal__color-text",
    text: isBlankColor(entry.color) ? "Blank" : entry.color,
  });

  const labelInput = row.createEl("input", {
    cls: "heatmap-legend-modal__label-input",
    attr: { type: "text", placeholder: "Label (e.g. Workday)" },
    value: entry.label,
  });
  labelInput.addEventListener("input", () => {
    entry.label = labelInput.value;
  });

  valueOverrideInput(
    row,
    entry,
    "To set fixed value (overriding actual values)",
  );

  // Day-count weight only ever applies to palette colors being combined in
  // gradient mode - this row is only ever rendered for a color that ISN'T in
  // the palette (palette colors are squashed into the gradient group row
  // instead - see `renderGradientGroupRow`/`GradientWeightsModal`), so
  // there's nothing to weight here.

  addVisibilityToggle(row, [entry], ctx.rerender);
}
