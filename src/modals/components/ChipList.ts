import { DropdownComponent, Setting, setIcon } from "obsidian";

/**
 * A small "add from suggestions or type your own, shown as removable chips"
 * control. Used for both tracked properties and tags — same interaction,
 * different data source.
 */
export class ChipList {
  private chipsEl: HTMLElement;
  private dropdown: DropdownComponent | null = null;
  private customInputEl: HTMLInputElement | null = null;

  constructor(
    containerEl: HTMLElement,
    private options: {
      getValues: () => string[];
      add: (value: string) => void;
      remove: (value: string) => void;
      getSuggestions: () => string[];
      addPlaceholder: string;
      emptyLabel: string;
      onChange: () => void;
    },
  ) {
    this.chipsEl = containerEl.createDiv({
      cls: "heatmap-create-modal__chips",
    });
    this.renderChips();

    // One row, not two: picking from the vault's existing keys and typing a
    // new one are the same action, and two stacked Setting rows read as two
    // unrelated controls.
    const addRow = new Setting(containerEl).setClass(
      "heatmap-create-modal__add-property-row",
    );

    addRow.addDropdown((dropdown) => {
      this.dropdown = dropdown;
      this.refreshSuggestions();
      dropdown.onChange((value) => {
        if (!value) return;
        this.add(value);
        dropdown.setValue("");
      });
    });

    addRow.addText((text) => {
      text.setPlaceholder(options.addPlaceholder);
      this.customInputEl = text.inputEl;
      text.inputEl.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter") {
          evt.preventDefault();
          this.addFromCustomInput();
        }
      });
    });

    addRow.addButton((btn) =>
      btn.setButtonText("Add").onClick(() => this.addFromCustomInput()),
    );
  }

  refreshSuggestions() {
    const dropdown = this.dropdown;
    if (!dropdown) return;

    dropdown.selectEl.empty();
    dropdown.addOption("", "Add...");

    const values = this.options.getValues();
    for (const suggestion of this.options
      .getSuggestions()
      .filter((s) => !values.includes(s))) {
      dropdown.addOption(suggestion, suggestion);
    }
    dropdown.setValue("");
  }

  private addFromCustomInput() {
    const input = this.customInputEl;
    if (!input) return;
    this.add(input.value);
    input.value = "";
  }

  private add(value: string) {
    const trimmed = value.trim();
    if (!trimmed || this.options.getValues().includes(trimmed)) return;

    this.options.add(trimmed);
    this.renderChips();
    this.refreshSuggestions();
    this.options.onChange();
  }

  private remove(value: string) {
    this.options.remove(value);
    this.renderChips();
    this.refreshSuggestions();
    this.options.onChange();
  }

  private renderChips() {
    this.chipsEl.empty();
    const values = this.options.getValues();

    if (values.length === 0) {
      this.chipsEl.createSpan({
        cls: "heatmap-create-modal__chips-empty",
        text: this.options.emptyLabel,
      });
      return;
    }

    values.forEach((value) => {
      const chip = this.chipsEl.createDiv({
        cls: "heatmap-create-modal__chip",
      });
      chip.createSpan({ text: value });

      // `clickable-icon` is Obsidian's own icon-only button style: without it
      // the chip's X inherits the default button background and box-shadow,
      // which shows up as a grey plate inside the chip on hover.
      const removeBtn = chip.createEl("button", {
        cls: "clickable-icon heatmap-create-modal__chip-remove",
        attr: { "aria-label": `Remove ${value}` },
      });
      setIcon(removeBtn, "x");
      removeBtn.addEventListener("click", () => this.remove(value));
    });
  }
}
