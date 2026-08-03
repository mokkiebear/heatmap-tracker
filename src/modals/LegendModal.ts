import { App, Modal, Setting, setIcon } from "obsidian";
import { EMPTY_CELL_COLOR } from "../utils/report/heatmapHtml";
import {
  LegendEntry,
  LegendVisibility,
  getLegendVisibility,
  nextLegendVisibility,
  setLegendVisibility,
} from "../utils/report/legend";
import { normalizeColor } from "../utils/report/legendMatch";

function isBlankColor(color: string): boolean {
  return color.trim().toLowerCase() === EMPTY_CELL_COLOR.trim().toLowerCase();
}

const VISIBILITY_ICON: Record<LegendVisibility, string> = {
  shown: "eye",
  summaryHidden: "eye-off",
  hidden: "eye-closed",
};

const VISIBILITY_TITLE: Record<LegendVisibility, string> = {
  shown: "Shown in legend and summary - click to hide from summary",
  summaryHidden: "Shown in legend only, not summary - click to hide entirely",
  hidden: "Hidden entirely - click to show again",
};

/** The shared visibility if every entry agrees, otherwise "shown" as a neutral starting point for the next click. */
export function aggregateVisibility(entries: LegendEntry[]): LegendVisibility {
  const visibilities = entries.map(getLegendVisibility);
  const first = visibilities[0] ?? "shown";
  return visibilities.every((v) => v === first) ? first : "shown";
}

export type LegendDisplayMode = "separate" | "gradient";

/**
 * Merges `entries` with a default baseline, preserving `entries`' own
 * customizations *and* relative order — only appending brand-new colors (in
 * the baseline's own order) and dropping any entry whose color doesn't
 * appear in the baseline at all. This is the "Refresh" button's whole job:
 * fetch new colors and remove genuinely stale ones without disturbing
 * anything the user has already set up. Called with `LegendModal`'s own
 * `baseline` — every color used ANYWHERE in the whole calendar, not just the
 * export's current date range (see `ExportView.buildRefreshBaseline`) — so a
 * color only drops out here once it no longer appears at all, not merely
 * because the currently selected range doesn't happen to include it.
 */
export function mergeLegendWithDefaults(
  entries: LegendEntry[],
  defaults: LegendEntry[],
): LegendEntry[] {
  const isInDefaults = (color: string) =>
    defaults.some((d) => normalizeColor(d.color) === normalizeColor(color));
  const kept = entries.filter((entry) => isInDefaults(entry.color));
  const keptColors = new Set(kept.map((entry) => normalizeColor(entry.color)));
  const added = defaults.filter(
    (d) => !keptColors.has(normalizeColor(d.color)),
  );
  return [...kept, ...added];
}

/**
 * `entries` whose color is actually in `colorsList` (the configured
 * intensity palette), in the palette's own low-to-high order — not
 * `entries`' own order, which may have been drag-reordered for separate-mode
 * display and has no bearing on the gradient strip's fixed intensity
 * ordering. This is exactly the set of colors gradient mode squashes into
 * one row (see `LegendModal.renderGradientGroupRow`); any entry whose color
 * isn't in `colorsList` at all (a custom color used on individual days, or
 * the blank/background color) is never included here and keeps its own full
 * row instead.
 */
export function paletteEntriesInOrder(
  entries: LegendEntry[],
  colorsList: string[],
): LegendEntry[] {
  return colorsList
    .map((color) =>
      entries.find(
        (entry) => normalizeColor(entry.color) === normalizeColor(color),
      ),
    )
    .filter((entry): entry is LegendEntry => entry !== undefined);
}

/**
 * Moves `dragged` (one entry for a normal row, or every palette-color entry
 * at once for the gradient group row) to sit immediately before the first
 * entry of `target` that isn't itself part of `dragged` — matching the
 * drop-target highlight's own documented behavior ("dropping lands the
 * dragged row(s) just before this one"). A no-op (returns `entries`
 * unchanged) when `dragged` and `target` overlap at all (dropped on itself).
 * Works by entry identity, not index, so it applies equally whether one row
 * or an entire contiguous block is moving.
 */
export function reorderLegendEntries(
  entries: LegendEntry[],
  dragged: LegendEntry[],
  target: LegendEntry[],
): LegendEntry[] {
  const draggedSet = new Set(dragged);
  if (target.some((entry) => draggedSet.has(entry))) return entries;

  const rest = entries.filter((entry) => !draggedSet.has(entry));
  const anchor = target.find((entry) => rest.includes(entry));
  const insertIndex = anchor ? rest.indexOf(anchor) : rest.length;

  return [
    ...rest.slice(0, insertIndex),
    ...dragged,
    ...rest.slice(insertIndex),
  ];
}

/**
 * Popup opened from the gear icon on the gradient-mode squashed row (see
 * `LegendModal.renderGradientGroupRow`) — the squashed row only has room for
 * one shared label, not one control per palette color, so per-color day-
 * count weight and fixed value are set here instead. No separate
 * include/exclude toggle: a weight of 0 already excludes a color from the
 * shared total, so a second control for the same thing would be redundant
 * (bulk-toggling every palette color at once is still available via the
 * group eye button on the squashed row itself). Mutates the given entries in
 * place (the very same objects referenced by the parent modal's `entries`
 * array), so there's nothing to save back explicitly — closing this popup is
 * enough.
 */
class GradientWeightsModal extends Modal {
  private listEl: HTMLElement | null = null;

  constructor(
    app: App,
    private entries: LegendEntry[],
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.modalEl.addClass("heatmap-legend-modal");
    this.setTitle("Palette color settings");

    contentEl.createEl("p", {
      cls: "heatmap-legend-modal__hint heatmap-legend-modal__hint--italic",
      text: "For each color in the palette, you can optionally set a fixed value per day and specify how much it's weighted towards the shared day count.",
    });

    this.listEl = contentEl.createDiv({ cls: "heatmap-legend-modal__list" });
    this.renderRows();

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Done")
        .setCta()
        .onClick(() => this.close()),
    );
  }

  onClose() {
    this.contentEl.empty();
  }

  private renderRows() {
    const container = this.listEl;
    if (!container) return;
    container.empty();

    this.entries.forEach((entry) => {
      const row = container.createDiv({ cls: "heatmap-legend-modal__row" });
      const visibility = getLegendVisibility(entry);
      row.toggleClass("is-excluded", visibility === "summaryHidden");
      row.toggleClass("is-hidden", visibility === "hidden");

      const swatch = row.createDiv({ cls: "heatmap-legend-modal__swatch" });
      swatch.style.backgroundColor = entry.color;

      row.createSpan({
        cls: "heatmap-legend-modal__color-text",
        text: entry.color,
      });

      const valueOverrideInput = row.createEl("input", {
        cls: "heatmap-legend-modal__value-input",
        attr: {
          type: "number",
          step: "any",
          placeholder: "value",
          "aria-label":
            "Fixed value for this color, overriding its actual logged value",
        },
        value:
          entry.valueOverride !== undefined ? String(entry.valueOverride) : "",
      });
      valueOverrideInput.addEventListener("input", () => {
        const trimmed = valueOverrideInput.value.trim();
        const parsed = Number(trimmed);
        entry.valueOverride =
          trimmed === "" || Number.isNaN(parsed) ? undefined : parsed;
      });

      const weightInput = row.createEl("input", {
        cls: "heatmap-legend-modal__weight-input",
        attr: {
          type: "number",
          step: "any",
          min: "0",
          placeholder: "weight",
          "aria-label":
            "Day-count weight (e.g. 0.5 for a half day, or 0 to exclude entirely)",
        },
        value: entry.countWeight !== undefined ? String(entry.countWeight) : "",
      });
      weightInput.addEventListener("input", () => {
        const trimmed = weightInput.value.trim();
        const parsed = Number(trimmed);
        entry.countWeight =
          trimmed === "" || Number.isNaN(parsed) ? undefined : parsed;
      });
    });
  }
}

/**
 * Popup editor for the report's {color, label} legend. Rows are auto-
 * populated (one per configured intensity color, plus the blank/background
 * color) by the caller — see `ExportView`'s default-entries builder — since
 * every color the calendar can ever show is already known in advance; there
 * is deliberately no way to add an arbitrary extra row or delete one here,
 * only to customize the ones that exist. That population only happens
 * up front though — reopening this modal shows exactly what was last saved,
 * untouched, unless the user explicitly clicks "Refresh" (merge in any new
 * colors, drop any stale ones, keep everything else exactly as edited/
 * reordered — see `mergeLegendWithDefaults`) or "Reset" (discard all
 * customizations and start over from scratch). Both draw from the exact same
 * `baseline` — every color used ANYWHERE in the whole calendar, not just the
 * export's current date range (see `ExportView.buildRefreshBaseline`) — so
 * neither one silently drops a color just because none of its days happen to
 * fall within whatever range is currently selected.
 *
 * The same list drives both the legend rendered under the heatmap and the
 * summary's day-type breakdown (see `src/utils/report/legend.ts`). Rows can
 * be dragged (via the grip handle specifically, not the row at large) to
 * reorder — controls the order categories appear in separate-rows mode.
 * Colors themselves aren't editable here — they're sourced automatically
 * from the calendar's actual palette, so retyping one would just desync the
 * swatch from what the calendar really shows; shown as plain text next to
 * the swatch rather than a (disabled-looking) input.
 *
 * Each row's borderless eye button (unboxed, matching `GradientWeightsModal`)
 * cycles through three visibility states (see `LegendVisibility`): shown in
 * both the legend and the summary; shown in the legend only; hidden from
 * both. Its days still count correctly toward `Other`/matching either way
 * (see `buildSummaryModel`) — only its own display is affected.
 *
 * The legend-style dropdown switches between "separate" (one row per color,
 * each with its own label) and "gradient". In gradient mode, every row whose
 * color is actually in the configured intensity palette (`colorsList`) is
 * squashed into a single row: a mini GitHub-style swatch strip on the left
 * (see `renderGradientGroupRow`) instead of one swatch per color, a shared-
 * label input, a gear icon opening `GradientWeightsModal` to set each
 * palette color's day-count weight/fixed value, and a group eye button that
 * bulk-applies a visibility state to every palette color at once. This row
 * is draggable too, just like any other — dragging it moves every palette
 * color together as one contiguous block (see `reorderLegendEntries`),
 * without disturbing their relative order among themselves. Individual
 * palette colors' own labels are left untouched in memory while squashed —
 * they simply aren't shown — and reappear as soon as the user switches back
 * to "separate" mode. Any matched color outside the palette (including the
 * blank/background color) is never squashed — it always keeps its own full,
 * independent, draggable row in both modes.
 */
export class LegendModal extends Modal {
  private entries: LegendEntry[];
  private baseline: LegendEntry[];
  private colorsList: string[];
  private legendMode: LegendDisplayMode;
  private gradientLabel: string;
  private onSave: (
    entries: LegendEntry[],
    legendMode: LegendDisplayMode,
    gradientLabel: string,
  ) => void;
  private listEl: HTMLElement | null = null;
  /** The entries currently being dragged - a single entry for a normal row, or every palette-color entry at once for the gradient group row. */
  private dragPayload: LegendEntry[] | null = null;

  constructor(
    app: App,
    initialEntries: LegendEntry[],
    baseline: LegendEntry[],
    colorsList: string[],
    initialLegendMode: LegendDisplayMode,
    initialGradientLabel: string,
    onSave: (
      entries: LegendEntry[],
      legendMode: LegendDisplayMode,
      gradientLabel: string,
    ) => void,
  ) {
    super(app);
    this.entries = initialEntries.map((entry) => ({ ...entry }));
    // Every color used ANYWHERE in the whole calendar, not just within the
    // export's currently selected date range (see
    // `ExportView.buildRefreshBaseline`) - shared by "Refresh" (merge it in,
    // keeping existing customizations) and "Reset" (discard everything and
    // clone it fresh), so neither one shows a narrower set of colors than
    // the other depending on which is clicked.
    this.baseline = baseline;
    this.colorsList = colorsList;
    this.legendMode = initialLegendMode;
    this.gradientLabel = initialGradientLabel;
    this.onSave = onSave;
  }

  /** Normalized set of the configured intensity palette's own colors. */
  private paletteColorSet(): Set<string> {
    return new Set(this.colorsList.map(normalizeColor));
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

    if (this.legendMode !== "gradient") {
      this.entries.forEach((entry) => this.renderEntryRow(container, entry));
      return;
    }

    // The group row renders wherever the palette-color block currently sits
    // in `this.entries` (at the position of the first palette-color entry
    // encountered) rather than always first - that's what makes it draggable
    // to a genuinely different position, not just visually fixed up front.
    const paletteColors = this.paletteColorSet();
    const paletteBlock = this.entries.filter((entry) =>
      paletteColors.has(normalizeColor(entry.color)),
    );
    let groupRendered = false;

    this.entries.forEach((entry) => {
      if (paletteColors.has(normalizeColor(entry.color))) {
        if (!groupRendered) {
          this.renderGradientGroupRow(container, paletteBlock);
          groupRendered = true;
        }
        return;
      }
      this.renderEntryRow(container, entry);
    });
  }

  /**
   * Wires up drag-to-reorder for `row`, whose "identity" for reordering
   * purposes is `payload` (one entry for a normal row; every palette-color
   * entry at once for the gradient group row - see `reorderLegendEntries`).
   * Returns an `arm()` callback to wire to the row's own grip handle's
   * `mousedown` - a drag is only actually allowed to start if the initiating
   * mousedown was on that handle, so clicking/selecting text in the label or
   * number inputs elsewhere in the row can't accidentally start reordering.
   */
  private wireDraggable(row: HTMLElement, payload: LegendEntry[]): () => void {
    row.setAttribute("draggable", "true");
    let dragArmed = false;

    row.addEventListener("dragstart", (evt) => {
      if (!dragArmed) {
        evt.preventDefault();
        return;
      }
      this.dragPayload = payload;
      row.addClass("is-dragging");
      evt.dataTransfer?.setData("text/plain", "1");
      if (evt.dataTransfer) evt.dataTransfer.effectAllowed = "move";
    });
    row.addEventListener("dragend", () => {
      dragArmed = false;
      this.dragPayload = null;
      row.removeClass("is-dragging");
    });
    row.addEventListener("dragenter", (evt) => {
      if (!this.dragPayload || this.dragPayload === payload) return;
      evt.preventDefault();
      row.addClass("is-drag-over");
    });
    row.addEventListener("dragleave", (evt) => {
      // dragenter/dragleave fire on every nested-element boundary crossing
      // within the row too, not just when actually leaving it - only clear
      // the drop-target highlight once the pointer has genuinely left.
      const related = evt.relatedTarget as Node | null;
      if (related && row.contains(related)) return;
      row.removeClass("is-drag-over");
    });
    row.addEventListener("dragover", (evt) => {
      evt.preventDefault();
      if (evt.dataTransfer) evt.dataTransfer.dropEffect = "move";
    });
    row.addEventListener("drop", (evt) => {
      evt.preventDefault();
      row.removeClass("is-drag-over");
      this.handleDrop(payload);
    });

    return () => {
      dragArmed = true;
    };
  }

  private handleDrop(targetPayload: LegendEntry[]) {
    if (!this.dragPayload) return;
    this.entries = reorderLegendEntries(
      this.entries,
      this.dragPayload,
      targetPayload,
    );
    this.dragPayload = null;
    this.renderRows();
  }

  /**
   * The gradient-mode-only squashed row standing in for every palette-color
   * entry at once: a mini swatch strip (no HEX — it's several colors, not
   * one) instead of the usual single swatch, the shared label input, a gear
   * icon opening `GradientWeightsModal` for per-color weight/value, and a
   * group eye button that bulk-applies to every palette color at once.
   * Draggable via its own handle just like any other row - dropping it moves
   * `paletteBlock` (every palette-color entry, in `this.entries`' own current
   * relative order - not recomputed to intensity order) as one contiguous
   * block (see `reorderLegendEntries`). The swatch strip itself, and the
   * weights popup's own ordering, still always follow the palette's true
   * low-to-high intensity order (`paletteEntriesInOrder`) regardless of
   * where `paletteBlock` currently sits or how its members are internally
   * ordered - that's a display/data-entry concern, unrelated to this row's
   * position among the others.
   */
  private renderGradientGroupRow(
    container: HTMLElement,
    paletteBlock: LegendEntry[],
  ) {
    const intensityOrder = paletteEntriesInOrder(this.entries, this.colorsList);
    const groupVisibility = aggregateVisibility(intensityOrder);

    const row = container.createDiv({ cls: "heatmap-legend-modal__row" });
    row.toggleClass("is-excluded", groupVisibility === "summaryHidden");
    row.toggleClass("is-hidden", groupVisibility === "hidden");
    const arm = this.wireDraggable(row, paletteBlock);

    const handle = row.createDiv({ cls: "heatmap-legend-modal__handle" });
    setIcon(handle, "grip-vertical");
    handle.addEventListener("mousedown", arm);

    const strip = row.createDiv({
      cls: "heatmap-legend-modal__gradient-strip",
    });
    intensityOrder.forEach((entry) => {
      const swatch = strip.createDiv({
        cls: "heatmap-legend-modal__gradient-strip-swatch",
      });
      swatch.style.backgroundColor = entry.color;
    });

    const labelInput = row.createEl("input", {
      cls: "heatmap-legend-modal__label-input",
      attr: { type: "text", placeholder: "Shared label (e.g. Activity)" },
      value: this.gradientLabel,
    });
    labelInput.addEventListener("input", () => {
      this.gradientLabel = labelInput.value;
    });

    const gearBtn = row.createEl("button", {
      cls: "heatmap-legend-modal__gear-button clickable-icon",
      attr: {
        "aria-label":
          "Set each palette color's day-count weight and fixed value",
      },
    });
    setIcon(gearBtn, "settings");
    gearBtn.addEventListener("click", () => {
      new GradientWeightsModal(this.app, intensityOrder).open();
    });

    // Bulk-applies to every palette color at once - the gear icon above
    // still lets each color's weight/value be set independently.
    const groupIncludeToggle = row.createEl("button", {
      cls: "heatmap-legend-modal__include-toggle clickable-icon",
      attr: {
        "aria-label": `${VISIBILITY_TITLE[groupVisibility]} (applies to every palette color)`,
      },
    });
    setIcon(groupIncludeToggle, VISIBILITY_ICON[groupVisibility]);
    groupIncludeToggle.addEventListener("click", () => {
      const next = nextLegendVisibility(groupVisibility);
      intensityOrder.forEach((entry) => setLegendVisibility(entry, next));
      this.renderRows();
    });
  }

  private renderEntryRow(container: HTMLElement, entry: LegendEntry) {
    const row = container.createDiv({ cls: "heatmap-legend-modal__row" });
    const visibility = getLegendVisibility(entry);
    row.toggleClass("is-excluded", visibility === "summaryHidden");
    row.toggleClass("is-hidden", visibility === "hidden");
    const arm = this.wireDraggable(row, [entry]);

    const handle = row.createDiv({ cls: "heatmap-legend-modal__handle" });
    setIcon(handle, "grip-vertical");
    handle.addEventListener("mousedown", arm);

    const swatch = row.createDiv({ cls: "heatmap-legend-modal__swatch" });
    swatch.style.backgroundColor = entry.color;

    // Colors are sourced automatically from the calendar's real palette
    // (see the class doc comment) - never editable, so shown as plain text
    // next to the swatch rather than a (disabled-looking) input box.
    const blank = isBlankColor(entry.color);
    row.createSpan({
      cls: "heatmap-legend-modal__color-text",
      text: blank ? "Blank" : entry.color,
    });

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
        "aria-label": "To set fixed value (overriding actual values)",
      },
      value:
        entry.valueOverride !== undefined ? String(entry.valueOverride) : "",
    });
    valueOverrideInput.addEventListener("input", () => {
      const trimmed = valueOverrideInput.value.trim();
      const parsed = Number(trimmed);
      entry.valueOverride =
        trimmed === "" || Number.isNaN(parsed) ? undefined : parsed;
    });

    // Day-count weight only ever applies to palette colors being combined
    // in gradient mode - this row is only ever rendered for a color that
    // ISN'T in the palette (palette colors are squashed into the gradient
    // group row instead - see `renderGradientGroupRow`/`GradientWeightsModal`),
    // so there's nothing to weight here.

    const includeToggle = row.createEl("button", {
      cls: "heatmap-legend-modal__include-toggle clickable-icon",
      attr: { "aria-label": VISIBILITY_TITLE[visibility] },
    });
    setIcon(includeToggle, VISIBILITY_ICON[visibility]);
    includeToggle.addEventListener("click", () => {
      setLegendVisibility(entry, nextLegendVisibility(visibility));
      this.renderRows();
    });
  }
}
