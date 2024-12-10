import i18n from "./localization/i18n";
import HeatmapTracker from "./main";
import { App, PluginSettingTab, setIcon, Setting } from "obsidian";
import languages from "./localization/languages.json";
import { ColorsList } from "./types";

export default class HeatmapTrackerSettingsTab extends PluginSettingTab {
  plugin: HeatmapTracker;

  constructor(app: App, plugin: HeatmapTracker) {
    super(app, plugin);
    this.plugin = plugin;
  }


  private async deletePalette(paletteName: string) {
    delete this.plugin.settings.palettes[paletteName];

    await this.plugin.saveSettings();

    this.display();
  }

  private addPaletteHeader(paletteContainer: HTMLElement, paletteName: string) {
    const paletteHeaderContainer = paletteContainer.createDiv({
      cls: "heatmap-tracker-settings-palettes__palette-header",
    });
    paletteHeaderContainer.createEl("h4", { text: `${i18n.t('settings.paletteName')}: ${paletteName}` });
    if (paletteName !== "default") {
      const deleteColorButton = paletteHeaderContainer.createEl("button", {
        cls: "heatmap-tracker-settings-palettes__delete-palette",
      });

      setIcon(deleteColorButton, "trash");

      deleteColorButton.addEventListener("click", () => this.deletePalette(paletteName));

    }
  }

  private renderAddColorSection(container: HTMLElement, paletteName: string, paletteColors: ColorsList) {
    container.createDiv({
      text: i18n.t('settings.addNewColorToPalette', { paletteName }),
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
      text: i18n.t('settings.addColor'),
    });

    // Add listeners.
    addColorInput.addEventListener("input", () => {
      colorPreview.style.backgroundColor = addColorInput.value;
    });

    addColorButton.addEventListener("click", () => {
      this.plugin.settings.palettes[paletteName] = [...paletteColors, colorPreview.style.backgroundColor];

      this.plugin.saveSettings();

      this.display();
    }
    );
  }

  private displayPaletteSettings() {
    const palettesContainer = this.containerEl.createDiv({
      cls: "heatmap-tracker-settings-palettes__container"
    });

    palettesContainer.createEl("h3", { text: i18n.t('settings.palettes'), });
    this.displayColorHelp(palettesContainer);

    for (const [paletteName, paletteColors] of Object.entries(this.plugin.settings.palettes)) {
      const paletteContainer = palettesContainer.createDiv({
        cls: "heatmap-tracker-settings-palettes__palette-container",
      });

      this.addPaletteHeader(paletteContainer, paletteName);

      const paletteContent = paletteContainer.createDiv({ cls: "heatmap-tracker-settings-palettes__palette-content", });

      const colorsContainer = paletteContent.createEl('div', { cls: "heatmap-tracker-settings-palettes__palette-colors", });

      for (const colorIndex in paletteColors) {
        const color = paletteColors[colorIndex];

        const paletteColor = colorsContainer.createEl('div', {
          cls: "heatmap-tracker-settings-palettes__palette-color",
        });

        paletteColor.createEl("div", {
          cls: "heatmap-tracker-settings-palettes__index",
          text: `${Number(colorIndex) + 1}.`,
        });

        paletteColor.createEl("div", {
          cls: "heatmap-tracker-settings-palettes__color-box",
          attr: {
            style: `background-color: ${color}`,
          },
        });

        paletteColor.createEl("div", {
          cls: "heatmap-tracker-settings-palettes__color-name",
          text: color,
        });

        if (paletteName !== "default") {
          const removeColorButton = paletteColor.createEl("button", {
            cls: "clickable-icon heatmap-tracker-settings-palettes__delete-color",
            attr: { "aria-label": i18n.t('settings.removeColor') },
          });

          setIcon(removeColorButton, "x");

          removeColorButton.addEventListener("click", () => {
            const colorIndex = paletteColors.indexOf(color);

            paletteColors.splice(colorIndex, 1);

            this.plugin.settings.palettes[paletteName] = paletteColors;

            this.plugin.saveSettings();

            this.display();
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

    this.addNewPalette(palettesContainer);
  }

  private addNewPalette(parent: HTMLElement) {
    const paletteContainer = parent.createDiv({
      cls: "heatmap-tracker-settings-palettes__new-palette-container",
    });

    paletteContainer.createEl("h4", {
      cls: "heatmap-tracker-settings-palettes__new-palette-header",
      text: i18n.t('settings.enterPaletteName'),
    });
    
    const newPaletteContent = paletteContainer.createDiv({
      cls: "heatmap-tracker-settings-palettes__new-palette-content"
    });

    const newPaletteInput = this.addNewPaletteInput(newPaletteContent);
    this.addNewPaletteButton(newPaletteContent, newPaletteInput);
  }

  private addNewPaletteInput(parent: HTMLElement) {
    const newPaletteInput = parent.createEl("input", {
      cls: "heatmap-tracker-settings-palettes__new-palette-input",
      attr: { placeholder: i18n.t('settings.paletteName'), type: "text" },
    });

    return newPaletteInput;
  }

  private addNewPaletteButton(parent: HTMLElement, newPaletteInput: HTMLInputElement) {
    const addColorButton = parent.createEl("button", {
      cls: "mod-cta heatmap-tracker-settings-palettes__new-palette-button",
      text: i18n.t('settings.addNewPalette'),
    });

    addColorButton.addEventListener("click", async () => {
      if (newPaletteInput.value) {
        this.plugin.settings.palettes[newPaletteInput.value] = [];

        await this.plugin.saveSettings();

        this.display();
      }
    });
  }


  private displayColorHelp(parent: HTMLElement) {
    parent.createEl("p", {
      text: i18n.t('settings.addPaletteNote'),
    });
    parent.createEl("p", {
      text: i18n.t('settings.colorsUsageNote'),
    });
  }

  private displayWeekStartDaySettings() {
    const { containerEl, } = this;
    new Setting(containerEl)
      .setName(i18n.t('settings.weekStartDay'))
      .setDesc(i18n.t('settings.weekStartDayDescription'))
      .addDropdown(dropdown =>
        dropdown
          .addOptions({
            0: i18n.t('weekdaysLong.Sunday'),
            1: i18n.t('weekdaysLong.Monday'),
            2: i18n.t('weekdaysLong.Tuesday'),
            3: i18n.t('weekdaysLong.Wednesday'),
            4: i18n.t('weekdaysLong.Thursday'),
            5: i18n.t('weekdaysLong.Friday'),
            6: i18n.t('weekdaysLong.Saturday'),
          })
          .setValue(this.plugin.settings.weekStartDay.toString())
          .onChange(async (value) => {
            this.plugin.settings.weekStartDay = Number(value);
            await this.plugin.saveSettings();
          })
      );
  }

  private displayLanguageSettings() {
    new Setting(this.containerEl)
      .setName(i18n.t("settings.language"))
      .setDesc(i18n.t("settings.chooseYourPreferredLanguage"))
      .addDropdown((dropdown) => {
        dropdown
          .addOptions(languages)
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            i18n.changeLanguage(value);
            this.plugin.settings.language = value;
            await this.plugin.saveSettings();
            this.display(); // Refresh the settings page
          });
      });
  }

  private displaySeparateMonthsSettings() {
    const { containerEl } = this;
    new Setting(containerEl)
      .setName(i18n.t('settings.separateMonths'))
      .setDesc(i18n.t('settings.separateMonthsDescription'))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.separateMonths)
        .onChange(async (value) => {
          this.plugin.settings.separateMonths = value;
          await this.plugin.saveSettings();
        }));
  }

  display() {
    const { containerEl } = this;

    containerEl.empty();

    this.displayLanguageSettings();

    this.displayWeekStartDaySettings();

    this.displaySeparateMonthsSettings();

    this.displayPaletteSettings();
  }
}
