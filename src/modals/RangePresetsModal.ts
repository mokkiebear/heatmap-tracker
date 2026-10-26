import { App, Modal, setIcon } from "obsidian";
import i18n from "src/localization/i18n";
import { RangePresetSetting, RangeRule } from "src/types";
import { DateSpan } from "src/views/ExportView/exportRange";
import {
  describeRuleLogic,
  describeSpan,
  isBuiltinPreset,
  newCustomPreset,
  presetRule,
  resetPresets,
} from "src/views/ExportView/rangePresets";
import { RowDragController, reorder } from "./legendModal/RowDragController";
import {
  renderCustomPresetForm,
  renderRenameBuiltinForm,
} from "./rangePresetsModal/customPresetForm";

/**
 * Popup for the Export tab's date-range preset buttons: show or hide each,
 * drag to reorder, rename any, and add, edit or delete custom presets.
 * Changes are saved on "Done" only, which stays pinned below the scrolling
 * list; closing any other way discards them.
 */
export class RangePresetsModal extends Modal {
  private presets: RangePresetSetting[];
  private editingId: string | null = null;
  private listEl!: HTMLElement;
  private formEl!: HTMLElement;
  /** What the dialog opened with, so Done without changes writes nothing. */
  private initial: string;
  /** Applies the open edit/rename form, if any, so Done doesn't lose it. */
  private flushForm: () => void = () => {};
  private drag = new RowDragController<RangePresetSetting[]>(
    (dragged, target) => {
      this.presets = reorder(this.presets, dragged, target);
      this.renderRows();
    },
  );

  constructor(
    app: App,
    presets: RangePresetSetting[],
    private resolve: (rule: RangeRule) => DateSpan | null,
    private labelFor: (preset: RangePresetSetting) => string,
    private onSave: (presets: RangePresetSetting[]) => void,
  ) {
    super(app);
    this.presets = presets.map((preset) => ({ ...preset }));
    this.initial = JSON.stringify(this.presets);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.modalEl.addClass("heatmap-range-presets-modal");
    this.setTitle(i18n.t("report.presetsDialog.title"));

    // Everything above the footer scrolls; the footer itself never does.
    const body = contentEl.createDiv({
      cls: "heatmap-range-presets-modal__body",
    });

    body.createEl("p", {
      cls: "heatmap-range-presets-modal__intro",
      text: i18n.t("report.presetsDialog.intro"),
    });

    this.listEl = body.createDiv({
      cls: "heatmap-range-presets-modal__list",
    });
    this.renderRows();

    this.formEl = body.createDiv({
      cls: "heatmap-range-presets-modal__form",
    });
    this.renderForm();

    const footer = contentEl.createDiv({
      cls: "heatmap-range-presets-modal__footer",
    });
    footer
      .createEl("button", {
        cls: "mod-warning",
        text: i18n.t("report.actions.reset"),
        attr: { title: i18n.t("report.presetsDialog.resetTooltip") },
      })
      .addEventListener("click", () => {
        this.presets = resetPresets(this.presets);
        // Reset replaces the built-ins, so a rename form open on one would
        // edit a preset no longer in the list. A custom edit stays open.
        const editing = this.presets.find((p) => p.id === this.editingId);
        if (editing && isBuiltinPreset(editing)) {
          this.editingId = null;
          this.renderForm();
        }
        this.renderRows();
      });
    footer
      .createEl("button", {
        cls: "mod-cta",
        text: i18n.t("report.actions.done"),
      })
      .addEventListener("click", () => {
        this.flushForm();
        if (JSON.stringify(this.presets) !== this.initial) {
          this.onSave(this.presets);
        }
        this.close();
      });
  }

  onClose() {
    this.contentEl.empty();
  }

  /** The rule in From → To terms, then the dates it covers today. */
  private detail(preset: RangePresetSetting): string {
    const rule = presetRule(preset);
    if (!rule) return "";
    return `${describeRuleLogic(rule)} · ${describeSpan(rule, this.resolve(rule))}`;
  }

  private renderRows() {
    const container = this.listEl;
    container.empty();

    for (const preset of this.presets) {
      const row = container.createDiv({
        cls: "heatmap-range-presets-modal__row",
      });
      row.toggleClass("is-hidden", !preset.visible);
      row.toggleClass("is-editing", preset.id === this.editingId);
      this.drag.wire(row, [preset], "heatmap-range-presets-modal__handle");

      this.iconButton(
        row,
        preset.visible ? "eye" : "eye-off",
        preset.visible
          ? i18n.t("report.presetsDialog.shown")
          : i18n.t("report.presetsDialog.hidden"),
        () => {
          preset.visible = !preset.visible;
          this.renderRows();
        },
      );

      const text = row.createDiv({ cls: "heatmap-range-presets-modal__text" });
      text.createDiv({
        cls: "heatmap-range-presets-modal__label",
        text: this.labelFor(preset),
      });
      text.createDiv({
        cls: "heatmap-range-presets-modal__detail",
        text: this.detail(preset),
      });

      this.iconButton(
        row,
        "pencil",
        isBuiltinPreset(preset)
          ? i18n.t("report.actions.rename")
          : i18n.t("report.actions.edit"),
        () => {
          this.editingId = preset.id;
          this.renderRows();
          this.renderForm();
        },
      );

      if (!isBuiltinPreset(preset)) {
        this.iconButton(row, "trash-2", i18n.t("report.actions.delete"), () => {
          this.presets = this.presets.filter((p) => p.id !== preset.id);
          if (this.editingId === preset.id) {
            this.editingId = null;
            this.renderForm();
          }
          this.renderRows();
        }).addClass("is-destructive");
      }
    }

    // Lets a row be dropped after the last one; rows only drop "before".
    const end = container.createDiv({
      cls: "heatmap-range-presets-modal__drop-end",
    });
    this.drag.wire(end, []);
  }

  private iconButton(
    row: HTMLElement,
    icon: string,
    ariaLabel: string,
    onClick: () => void,
  ): HTMLButtonElement {
    const button = row.createEl("button", {
      cls: "clickable-icon heatmap-range-presets-modal__icon-button",
      attr: { "aria-label": ariaLabel },
    });
    setIcon(button, icon);
    button.addEventListener("click", onClick);
    return button;
  }

  private renderForm() {
    const container = this.formEl;
    const editing = this.presets.find((p) => p.id === this.editingId);
    const closeForm = () => {
      this.editingId = null;
      this.renderRows();
      this.renderForm();
    };

    const builtinRule =
      editing && isBuiltinPreset(editing) && presetRule(editing);
    if (editing && builtinRule) {
      this.flushForm = renderRenameBuiltinForm(container, {
        preset: editing,
        rule: builtinRule,
        defaultLabel: this.labelFor({ ...editing, label: undefined }),
        resolve: this.resolve,
        onSubmit: (label) => {
          editing.label = label.trim() || undefined;
          closeForm();
        },
        onCancel: closeForm,
      });
      return;
    }

    this.flushForm = renderCustomPresetForm(container, {
      editing,
      resolve: this.resolve,
      onSubmit: (rule, label) => {
        if (editing) {
          editing.rule = rule;
          editing.label = label.trim() || undefined;
        } else {
          this.presets = [...this.presets, newCustomPreset(rule, label)];
        }
        closeForm();
      },
      onCancel: closeForm,
    });
  }
}
