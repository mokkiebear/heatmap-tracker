import { App, Setting, setIcon } from "obsidian";
import { TrackerSettings } from "src/types";
import { HeatmapModalFormState } from "../heatmapModal.utils";

/**
 * What a section renderer is allowed to touch: the form state it edits, the
 * plugin settings/vault it reads suggestions from, and the "something
 * changed" callback that re-validates and re-renders the preview.
 */
export interface HeatmapFormHost {
  app: App;
  settings: TrackerSettings;
  state: HeatmapModalFormState;
  refresh: () => void;
}

/** Form fields the toggle/number helpers below are allowed to bind to. */
export type BooleanFormKey = {
  [K in keyof HeatmapModalFormState]: HeatmapModalFormState[K] extends boolean
    ? K
    : never;
}[keyof HeatmapModalFormState];

export type NumericTextFormKey =
  "daysToShow" | "monthsToShow" | "defaultIntensity";

/** Shared `id` of the property `<datalist>`, created by the essentials section. */
export const PROPERTY_DATALIST_ID = "heatmap-create-modal-property-list";

/**
 * A boolean form field. Every toggle in this modal does the same three
 * things, so they are declared rather than hand-written.
 */
export function addToggleSetting(
  host: HeatmapFormHost,
  contentEl: HTMLElement,
  key: BooleanFormKey,
  name: string,
  desc?: string,
) {
  const setting = new Setting(contentEl).setName(name);
  if (desc) setting.setDesc(desc);

  setting.addToggle((toggle) => {
    toggle.setValue(host.state[key]);
    toggle.onChange((value) => {
      host.state[key] = value;
      host.refresh();
    });
  });

  return setting;
}

/** A number field kept as raw text, so it can be empty while typing. */
export function addNumberSetting(
  host: HeatmapFormHost,
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
    text.setValue(host.state[key]);
    text.onChange((value) => {
      host.state[key] = value;
      host.refresh();
    });
  });

  return setting;
}

/** A text field bound to a string form field. */
export function addTextSetting(
  host: HeatmapFormHost,
  contentEl: HTMLElement,
  key: "path" | "heatmapTitle" | "heatmapSubtitle",
  name: string,
  desc: string,
  onChange?: () => void,
) {
  return new Setting(contentEl)
    .setName(name)
    .setDesc(desc)
    .addText((text) =>
      text.setValue(host.state[key]).onChange((value) => {
        host.state[key] = value;
        onChange?.();
        host.refresh();
      }),
    );
}

/**
 * A native `<details>` group. Collapsed by default — progressive disclosure,
 * so the form reads as "3 fields" rather than "40 settings" — and no JS
 * toggle state to keep in sync.
 */
export function addCollapsibleSection(
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
  // triangle (which `list-style: none` in the stylesheet removes).
  setIcon(
    summary.createSpan({ cls: "heatmap-create-modal__section-chevron" }),
    "chevron-right",
  );
  summary.createSpan({ text: title });

  return details.createDiv({ cls: "heatmap-create-modal__section-body" });
}

/** A plain "Add ..." button row, used by the filter and custom-color editors. */
export function addListButton(
  container: HTMLElement,
  text: string,
  onClick: () => void,
): HTMLButtonElement {
  const btn = container.createEl("button", {
    cls: "heatmap-create-modal__add-button",
    text,
  });
  btn.addEventListener("click", onClick);
  return btn;
}
