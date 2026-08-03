import { setIcon } from "obsidian";
import i18n from "src/localization/i18n";
import HeatmapTracker from "src/main";
import HeatmapTrackerSettingsTab from "src/settings";
import { ColorsList } from "src/types";

export class PaletteSettings {
  plugin: HeatmapTracker;
  settings: HeatmapTrackerSettingsTab;

  constructor(plugin: HeatmapTracker, settings: HeatmapTrackerSettingsTab) {
    this.plugin = plugin;
    this.settings = settings;
  }

  private async deletePalette(paletteName: string) {
    delete this.plugin.settings.palettes[paletteName];

    await this.plugin.saveSettings();

    this.settings.display();
  }

  private addPaletteHeader(paletteContainer: HTMLElement, paletteName: string) {
    const paletteHeaderContainer = paletteContainer.createDiv({
      cls: "heatmap-tracker-settings-palettes__palette-header",
    });

    paletteHeaderContainer.createEl("h4", {
      text: `${i18n.t("settings.paletteName")}: ${paletteName}`,
    });

    if (paletteName !== "default") {
      const deleteColorButton = paletteHeaderContainer.createEl("button", {
        cls: "heatmap-tracker-settings-palettes__delete-palette",
      });

      setIcon(deleteColorButton, "trash");

      deleteColorButton.addEventListener("click", () =>
        this.deletePalette(paletteName),
      );
    }
  }

  private renderAddColorSection(
    container: HTMLElement,
    paletteName: string,
    paletteColors: ColorsList,
  ) {
    container.createDiv({
      text: i18n.t("settings.addNewColorToPalette", { paletteName }),
      cls: "heatmap-tracker-settings-palettes__add-color-header",
    });

    const inputContainer = container.createDiv({
      cls: "heatmap-tracker-settings-palettes__add-color-input-container",
    });

    const addColorInput = inputContainer.createEl("input", {
      cls: "heatmap-tracker-settings-palettes__add-color-input",
      attr: { placeholder: "#123456 / red / rgba()...", type: "text" },
    });

    const colorPreview = inputContainer.createDiv({
      cls: "heatmap-tracker-settings-palettes__add-color-preview",
    });

    const addColorButton = inputContainer.createEl("button", {
      cls: "mod-cta heatmap-tracker-settings-palettes__add-color-button",
      text: i18n.t("settings.addColor"),
    });

    // Add listeners.
    addColorInput.addEventListener("input", () => {
      colorPreview.style.backgroundColor = addColorInput.value;
    });

    addColorButton.addEventListener("click", () => {
      this.plugin.settings.palettes[paletteName] = [
        ...paletteColors,
        colorPreview.style.backgroundColor,
      ];

      this.plugin.saveSettings();

      this.settings.display();
    });
  }

  private renderAddNewPaletteSection(parent: HTMLElement) {
    const paletteContainer = parent.createDiv({
      cls: "heatmap-tracker-settings-palettes__new-palette-container",
    });

    paletteContainer.createEl("h4", {
      cls: "heatmap-tracker-settings-palettes__new-palette-header",
      text: i18n.t("settings.enterPaletteName"),
    });

    const newPaletteContent = paletteContainer.createDiv({
      cls: "heatmap-tracker-settings-palettes__new-palette-content",
    });

    const newPaletteInput = this.addNewPaletteInput(newPaletteContent);
    this.addNewPaletteButton(newPaletteContent, newPaletteInput);
  }

  private addNewPaletteInput(parent: HTMLElement) {
    const newPaletteInput = parent.createEl("input", {
      cls: "heatmap-tracker-settings-palettes__new-palette-input",
      attr: { placeholder: i18n.t("settings.paletteName"), type: "text" },
    });

    return newPaletteInput;
  }

  private addNewPaletteButton(
    parent: HTMLElement,
    newPaletteInput: HTMLInputElement,
  ) {
    const addColorButton = parent.createEl("button", {
      cls: "mod-cta heatmap-tracker-settings-palettes__new-palette-button",
      text: i18n.t("settings.addNewPalette"),
    });

    addColorButton.addEventListener("click", async () => {
      if (newPaletteInput.value) {
        this.plugin.settings.palettes[newPaletteInput.value] = [];

        await this.plugin.saveSettings();

        this.settings.display();
      }
    });
  }

  private displayColorHelp(parent: HTMLElement) {
    parent.createEl("p", {
      text: i18n.t("settings.addPaletteNote"),
    });
    parent.createEl("p", {
      text: i18n.t("settings.colorsUsageNote"),
    });
  }

  private renderPalette(
    parent: HTMLElement,
    paletteName: string,
    paletteColors: ColorsList,
  ) {
    const paletteContainer = parent.createDiv({
      cls: "heatmap-tracker-settings-palettes__palette-container",
    });

    this.addPaletteHeader(paletteContainer, paletteName);

    const paletteContent = paletteContainer.createDiv({
      cls: "heatmap-tracker-settings-palettes__palette-content",
    });

    const colorsContainer = paletteContent.createEl("div", {
      cls: "heatmap-tracker-settings-palettes__palette-colors",
    });

    for (const colorIndex in paletteColors) {
      const color = paletteColors[colorIndex];

      const paletteColor = colorsContainer.createEl("div", {
        cls: "heatmap-tracker-settings-palettes__palette-color",
      });

      paletteColor.createEl("div", {
        cls: "heatmap-tracker-settings-palettes__index",
        text: `${Number(colorIndex) + 1}.`,
      });

      const colorPreview = paletteColor.createEl("div", {
        cls: "heatmap-tracker-settings-palettes__color-box",
        attr: {
          style: `background-color: ${color}`,
        },
      });

      const colorInput = paletteColor.createEl("input", {
        cls: "heatmap-tracker-settings-palettes__color-input",
        attr: { type: "text" },
        value: color,
      });

      if (paletteName === "default") {
        colorInput.disabled = true;
      }

      if (paletteName !== "default") {
        // “Save” button to confirm the typed color
        const saveButton = paletteColor.createEl("button", {
          cls: "clickable-icon heatmap-tracker-settings-palettes__save-color",
          attr: { "aria-label": i18n.t("settings.saveColor"), disabled: true },
        });
        setIcon(saveButton, "check");

        // Update the color preview whenever user types
        colorInput.addEventListener("input", (event) => {
          const newColor = (event as any).target.value;

          colorPreview.style.backgroundColor = newColor;

          saveButton.disabled = newColor === color;
        });

        saveButton.addEventListener("click", async () => {
          paletteColors[colorIndex] = colorPreview.style.backgroundColor;
          this.plugin.settings.palettes[paletteName] = paletteColors;

          await this.plugin.saveSettings();
          this.settings.display();
        });

        const removeColorButton = paletteColor.createEl("button", {
          cls: "clickable-icon heatmap-tracker-settings-palettes__delete-color",
          attr: { "aria-label": i18n.t("settings.removeColor") },
        });
        setIcon(removeColorButton, "x");

        removeColorButton.addEventListener("click", async () => {
          paletteColors.splice(Number(colorIndex), 1);
          this.plugin.settings.palettes[paletteName] = paletteColors;

          await this.plugin.saveSettings();
          this.settings.display();
        });
      }
    }

    if (paletteName !== "default") {
      const addColorContainer = paletteContent.createDiv({
        cls: "heatmap-tracker-settings-palettes__add-color-container",
      });

      this.renderAddColorSection(addColorContainer, paletteName, paletteColors);
    }
  }

  public displayPaletteSettings() {
    const palettesContainer = this.settings.containerEl.createDiv({
      cls: "heatmap-tracker-settings-palettes__container",
    });

    palettesContainer.createEl("h3", { text: i18n.t("settings.palettes") });
    this.displayColorHelp(palettesContainer);

    for (const [paletteName, paletteColors] of Object.entries(
      this.plugin.settings.palettes,
    )) {
      this.renderPalette(palettesContainer, paletteName, paletteColors);
    }

    this.renderAddNewPaletteSection(palettesContainer);
  }
}
