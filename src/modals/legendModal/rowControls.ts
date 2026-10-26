import i18n from "src/localization/i18n";
import { LegendEntry } from "src/utils/report/legend";
import { aggregateVisibility } from "./legendEntries";

/** A number input bound to an optional numeric field of a legend entry. */
export function numberInput(
  row: HTMLElement,
  options: {
    cls: string;
    placeholder: string;
    ariaLabel: string;
    get: () => number | undefined;
    set: (value: number | undefined) => void;
  },
): HTMLInputElement {
  const current = options.get();
  const input = row.createEl("input", {
    cls: options.cls,
    attr: {
      type: "number",
      step: "any",
      placeholder: options.placeholder,
      "aria-label": options.ariaLabel,
    },
    value: current !== undefined ? String(current) : "",
  });
  input.addEventListener("input", () => {
    const trimmed = input.value.trim();
    const parsed = Number(trimmed);
    options.set(trimmed === "" || Number.isNaN(parsed) ? undefined : parsed);
  });
  return input;
}

/** The "fixed value overriding the day's real value" input, shared by both modals. */
export function valueOverrideInput(
  row: HTMLElement,
  entry: LegendEntry,
): HTMLInputElement {
  return numberInput(row, {
    cls: "heatmap-legend-modal__value-input",
    placeholder: i18n.t("report.legendEditor.valuePlaceholder"),
    ariaLabel: i18n.t("report.legendEditor.valueTooltip"),
    get: () => entry.valueOverride,
    set: (value) => {
      entry.valueOverride = value;
    },
  });
}

/** Dims a row by its entries' shared visibility (see `aggregateVisibility`). */
export function applyVisibilityClasses(
  row: HTMLElement,
  entries: LegendEntry[],
) {
  const visibility = aggregateVisibility(entries);
  row.toggleClass("is-excluded", visibility === "summaryHidden");
  row.toggleClass("is-hidden", visibility === "hidden");
}

/** A color's swatch and its read-only name: colors come from the calendar, so they aren't editable. */
export function addColorCell(row: HTMLElement, color: string, name: string) {
  const swatch = row.createDiv({ cls: "heatmap-legend-modal__swatch" });
  swatch.style.backgroundColor = color;
  row.createSpan({ cls: "heatmap-legend-modal__color-text", text: name });
}
