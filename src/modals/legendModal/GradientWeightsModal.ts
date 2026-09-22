import { App, Modal, Setting } from "obsidian";
import { LegendEntry, getLegendVisibility } from "src/utils/report/legend";
import { numberInput, valueOverrideInput } from "./rowControls";

/**
 * Per-palette-color fixed value and day-count weight, which don't fit in the
 * gradient-mode squashed row (which has room for one shared label only).
 * A weight of 0 already excludes a color, so there is no separate toggle.
 * Mutates the parent modal's entry objects in place — closing is saving.
 */
export class GradientWeightsModal extends Modal {
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

    this.renderRows(contentEl.createDiv({ cls: "heatmap-legend-modal__list" }));

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

  private renderRows(container: HTMLElement) {
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

      valueOverrideInput(
        row,
        entry,
        "Fixed value for this color, overriding its actual logged value",
      );

      numberInput(row, {
        cls: "heatmap-legend-modal__weight-input",
        placeholder: "weight",
        ariaLabel:
          "Day-count weight (e.g. 0.5 for a half day, or 0 to exclude entirely)",
        get: () => entry.countWeight,
        set: (value) => {
          entry.countWeight = value;
        },
      }).setAttribute("min", "0");
    });
  }
}
