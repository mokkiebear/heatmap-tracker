import { App, ButtonComponent, Modal, Setting } from "obsidian";
import { TrackerSettings } from "../types";
import {
  HeatmapModalFormState,
  buildHeatmapConfig,
  createInitialFormState,
  formStateFromConfig,
  validateHeatmapForm,
} from "./heatmapModal.utils";
import {
  HeatmapFormHost,
  addCollapsibleSection,
} from "./heatmapModal/formControls";
import { renderEssentialsSection } from "./heatmapModal/essentialsSection";
import { renderFilteringSection } from "./heatmapModal/filteringSection";
import {
  renderAppearanceSection,
  renderIntensitySection,
  renderLayoutSection,
  renderUiSection,
} from "./heatmapModal/appearanceSections";
import { HeatmapPreviewPanel } from "./heatmapModal/HeatmapPreviewPanel";

/** Collapsible sections, in display order. */
const SECTIONS: {
  title: string;
  render: (host: HeatmapFormHost, contentEl: HTMLElement) => void;
}[] = [
  { title: "Filtering", render: renderFilteringSection },
  { title: "Layout & date range", render: renderLayoutSection },
  { title: "Appearance", render: renderAppearanceSection },
  { title: "Intensity scale", render: renderIntensitySection },
  { title: "Visible elements & behavior", render: renderUiSection },
];

/**
 * The "Insert/Edit Heatmap Tracker" form. This file owns only the modal
 * shell: state, layout and the validate → preview loop. The fields
 * themselves live in `./heatmapModal/*Section(s).ts`, the form→config
 * mapping in `./heatmapModal.utils.ts`.
 */
export class HeatmapModal extends Modal {
  private formState: HeatmapModalFormState = createInitialFormState();
  private preview: HeatmapPreviewPanel | null = null;
  private submitButton: ButtonComponent | null = null;

  constructor(
    app: App,
    private settings: TrackerSettings,
    private onSubmit: (result: Record<string, unknown>) => void,
    /** Existing codeblock config to edit; omit to create a new heatmap. */
    private initialConfig?: Record<string, unknown>,
  ) {
    super(app);
  }

  private get isEditing(): boolean {
    return this.initialConfig !== undefined;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.modalEl.addClass("heatmap-create-modal");
    this.formState = this.initialConfig
      ? formStateFromConfig(this.initialConfig)
      : createInitialFormState();

    this.setTitle(
      this.isEditing ? "Edit Heatmap Tracker" : "Create new Heatmap Tracker",
    );

    const host: HeatmapFormHost = {
      app: this.app,
      settings: this.settings,
      state: this.formState,
      refresh: () => this.refresh(),
    };

    const body = contentEl.createDiv({ cls: "heatmap-create-modal-body" });
    const fieldsEl = body.createDiv({
      cls: "heatmap-create-modal-body__fields",
    });
    const previewColEl = body.createDiv({
      cls: "heatmap-create-modal-body__preview-col",
    });

    // Everything needed for a working heatmap stays visible; the rest is one
    // click away, so the form reads as "3 fields" rather than "40 settings".
    renderEssentialsSection(host, fieldsEl);
    SECTIONS.forEach(({ title, render }) =>
      render(host, addCollapsibleSection(fieldsEl, title)),
    );

    this.preview = new HeatmapPreviewPanel(
      this.app,
      this.settings,
      previewColEl,
    );
    this.renderSubmitSection(previewColEl);

    this.refresh();
  }

  onClose() {
    this.preview?.dispose();
    this.preview = null;
    this.contentEl.empty();
  }

  private renderSubmitSection(contentEl: HTMLElement) {
    new Setting(contentEl)
      .setClass("heatmap-create-modal__submit-row")
      .addButton((btn) => {
        this.submitButton = btn;
        btn
          .setButtonText(this.isEditing ? "Save changes" : "Insert Heatmap")
          .setCta()
          .onClick(() => {
            if (validateHeatmapForm(this.formState).length > 0) return;
            this.close();
            this.onSubmit(buildHeatmapConfig(this.formState));
          });
      });
  }

  private refresh() {
    const errors = validateHeatmapForm(this.formState);
    this.preview?.showErrors(errors);
    this.submitButton?.setDisabled(errors.length > 0);
    this.preview?.schedule(this.formState);
  }
}
