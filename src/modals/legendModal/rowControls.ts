import i18n from "src/localization/i18n";
import { LegendEntry } from "src/utils/report/legend";

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
