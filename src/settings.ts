import i18n from "./localization/i18n";
import HeatmapTracker from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";
import languages from "./localization/languages.json";
import { IHeatmapView, WeekDisplayMode } from "./types";
import { PaletteSettings } from "./settings/palette.settings";

export default class HeatmapTrackerSettingsTab extends PluginSettingTab {
  plugin: HeatmapTracker;
  paletteSettings: PaletteSettings;


  constructor(app: App, plugin: HeatmapTracker) {
    super(app, plugin);
    this.plugin = plugin;
    this.paletteSettings = new PaletteSettings(this.plugin, this);
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

  private displayWeekDisplayModeSettings() {
    const { containerEl, } = this;
    new Setting(containerEl)
      .setName(i18n.t('settings.weekDisplayMode.label'))
      .setDesc(i18n.t('settings.weekDisplayMode.description'))
      .addDropdown(dropdown =>
        dropdown
          .addOptions({
            even: i18n.t('weekDisplayMode.even'),
            odd: i18n.t('weekDisplayMode.odd'),
            all: i18n.t('weekDisplayMode.all'),
            none: i18n.t('weekDisplayMode.none'),
          })
          .setValue(this.plugin.settings.weekDisplayMode.toString())
          .onChange(async (value) => {
            this.plugin.settings.weekDisplayMode = value as WeekDisplayMode;
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

  private displayShowWeekNumsSettings() {
    const { containerEl } = this;
    new Setting(containerEl)
      .setName(i18n.t('settings.showWeekNums'))
      .setDesc(i18n.t('settings.showWeekNumsDescription'))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showWeekNums)
        .onChange(async (value) => {
          this.plugin.settings.showWeekNums = value;
          await this.plugin.saveSettings();
        }));
  }

  private displayViewTabsSettings() {
    const { containerEl } = this;

    containerEl.createEl('h3', {
      text: i18n.t('settings.tabsVisibility')
    });

    for (const view of Object.values(IHeatmapView)) {
      new Setting(containerEl)
        .setName(`${i18n.t('tab')}: ${i18n.t(`view.${view}`)}`)
        .setDesc(i18n.t('settings.tabsVisibilityDescription', { viewKey: i18n.t(`view.${view}`) }))
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.viewTabsVisibility[view] ?? true)
          .onChange(async (value) => {
            this.plugin.settings.viewTabsVisibility[view] = value;
            await this.plugin.saveSettings();
          }));
    }
  }

  private displaySupportSection() {
    const { containerEl } = this;

    const supportSection = containerEl.createEl('div', {
      cls: 'heatmap-tracker-settings-support-section'
    });

    supportSection.createEl('h5', {
      cls: 'heatmap-tracker-settings-support-section__header',
      text: i18n.t('support.header')
    });

    supportSection.createEl('p', {
      cls: 'heatmap-tracker-settings-support-section__text',
      text: i18n.t('support.text1')
    });

    supportSection.createEl('p', {
      cls: 'heatmap-tracker-settings-support-section__text',
            text: i18n.t('support.text2')
    });

    supportSection.createEl('p', {
      cls: 'heatmap-tracker-settings-support-section__text--highlight',
         text: i18n.t('support.cta')
    });

    const supportSectionOptions = supportSection.createDiv({
      cls: 'heatmap-tracker-settings-support-section__options'
    });

    const buyMeACoffee = '<a href="https://www.buymeacoffee.com/mrubanau" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 42px !important;width: 150px !important;" ></a>';
    const buyMeACoffeeContainer = supportSectionOptions.createEl('div');
    buyMeACoffeeContainer.innerHTML = buyMeACoffee;

    const kofi = `<a href='https://ko-fi.com/X8X11E578R' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>`;
    const kofiContainer = supportSectionOptions.createEl('div');
    kofiContainer.innerHTML = kofi;
  }

  display() {
    const { containerEl } = this;

    containerEl.empty();

    this.displayLanguageSettings();
    this.displayWeekStartDaySettings();
    this.displayWeekDisplayModeSettings();
    this.displaySeparateMonthsSettings();
    this.displayShowWeekNumsSettings();

    this.displaySupportSection();

    this.displayViewTabsSettings();
    this.paletteSettings.displayPaletteSettings();
  }
}
