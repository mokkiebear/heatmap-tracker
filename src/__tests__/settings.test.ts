import HeatmapTrackerSettingsTab from "src/settings";
import { IHeatmapView, WeekDisplayMode } from "src/types";

jest.mock("src/settings/palette.settings", () => ({
  PaletteSettings: jest.fn().mockImplementation(() => ({
    displayPaletteSettings: jest.fn(),
  })),
}));

jest.mock("obsidian", () => {
  class MockDropdown {
    options: Record<string, string> = {};
    value = "";
    private handler?: (value: string) => Promise<void> | void;

    addOptions(options: Record<string, string>) {
      this.options = options;
      return this;
    }

    setValue(value: string) {
      this.value = value;
      return this;
    }

    onChange(handler: (value: string) => Promise<void> | void) {
      this.handler = handler;
      return this;
    }

    trigger(value: string) {
      this.value = value;
      return this.handler?.(value);
    }
  }

  class MockToggle {
    value = false;
    private handler?: (value: boolean) => Promise<void> | void;

    setValue(value: boolean) {
      this.value = value;
      return this;
    }

    onChange(handler: (value: boolean) => Promise<void> | void) {
      this.handler = handler;
      return this;
    }

    trigger(value: boolean) {
      this.value = value;
      return this.handler?.(value);
    }
  }

  class MockSetting {
    static instances: MockSetting[] = [];

    static clear() {
      this.instances = [];
    }

    name?: string;
    desc?: string;
    dropdowns: MockDropdown[] = [];
    toggles: MockToggle[] = [];

    constructor(public containerEl: HTMLElement) {
      this.dropdowns = [];
      this.toggles = [];
      MockSetting.instances.push(this);
    }

    setName(name: string) {
      this.name = name;
      return this;
    }

    setDesc(desc?: string) {
      this.desc = desc;
      return this;
    }

    addDropdown(callback: (dropdown: MockDropdown) => void) {
      const dropdown = new MockDropdown();
      this.dropdowns.push(dropdown);
      callback(dropdown);
      return this;
    }

    addToggle(callback: (toggle: MockToggle) => void) {
      const toggle = new MockToggle();
      this.toggles.push(toggle);
      callback(toggle);
      return this;
    }
  }

  class PluginSettingTab {
    containerEl: HTMLElement;
    constructor(public app: unknown, public plugin: unknown) {
      this.containerEl = document.createElement("div");
    }
  }

  return {
    App: class {},
    PluginSettingTab,
    Setting: MockSetting,
  };
});

jest.mock("src/localization/i18n", () => ({
  __esModule: true,
  default: {
    t: jest.fn((key: string) => key),
    changeLanguage: jest.fn(),
  },
}));

type DropdownStub = {
  value?: string;
  trigger: (value: string) => Promise<void> | void;
  options?: Record<string, string>;
};

type ToggleStub = {
  value?: boolean;
  trigger: (value: boolean) => Promise<void> | void;
};

type SettingInstance = {
  name?: string;
  dropdowns: DropdownStub[];
  toggles: ToggleStub[];
};

type SettingMockClass = {
  instances: SettingInstance[];
  clear: () => void;
};

const { Setting: SettingMock } = jest.requireMock("obsidian") as {
  Setting: SettingMockClass;
};

const { default: i18nMock } = jest.requireMock("src/localization/i18n") as {
  default: { t: jest.Mock; changeLanguage: jest.Mock };
};

const applyElementOptions = (
  element: HTMLElement,
  options?: { cls?: string; text?: string; attr?: Record<string, string> }
) => {
  if (!options) {
    return element;
  }

  if (options.cls) {
    options.cls.split(" ").forEach((cls) => cls && element.classList.add(cls));
  }

  if (options.text) {
    element.textContent = options.text;
  }

  if (options.attr) {
    Object.entries(options.attr).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  return element;
};

beforeAll(() => {
  const proto = HTMLElement.prototype as any;

  proto.createDiv = function (options?: {
    cls?: string;
    text?: string;
    attr?: Record<string, string>;
  }) {
    const div = applyElementOptions(document.createElement("div"), options);
    this.appendChild(div);
    return div;
  };

  proto.createEl = function (
    tag: string,
    options?: { cls?: string; text?: string; attr?: Record<string, string> }
  ) {
    const element = applyElementOptions(
      document.createElement(tag),
      options
    );
    this.appendChild(element);
    return element;
  };

  proto.empty = function () {
    this.innerHTML = "";
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  SettingMock.clear();
  document.body.innerHTML = "";
});

const createPlugin = () => ({
  settings: {
    palettes: {},
    weekStartDay: 1,
    weekDisplayMode: "all" as WeekDisplayMode,
    separateMonths: false,
    language: "en",
    viewTabsVisibility: {
      [IHeatmapView.HeatmapTracker]: false,
      [IHeatmapView.Legend]: true,
    },
  },
  saveSettings: jest.fn().mockResolvedValue(undefined),
});

const createSettingsTab = () => {
  const plugin = createPlugin();
  const tab = new HeatmapTrackerSettingsTab({} as any, plugin as any);
  return { plugin, tab };
};

describe("HeatmapTrackerSettingsTab", () => {
  it("renders all settings sections and toggles", () => {
    const { tab } = createSettingsTab();
    tab.containerEl.createDiv({ cls: "stale" });
    tab.display();

    expect(tab.containerEl.querySelector(".stale")).toBeNull();

    const supportHeader = tab.containerEl.querySelector(
      ".heatmap-tracker-settings-support-section__header"
    );
    expect(supportHeader?.textContent).toBe("support.header");

    const supportParagraphs = tab.containerEl.querySelectorAll(
      ".heatmap-tracker-settings-support-section__text, .heatmap-tracker-settings-support-section__text--highlight"
    );
    expect(supportParagraphs).toHaveLength(3);

    const options = tab.containerEl.querySelectorAll(
      ".heatmap-tracker-settings-support-section__options div"
    );
    expect(options).toHaveLength(2);

    const viewHeader = Array.from(tab.containerEl.querySelectorAll("h3")).find(
      (el) => el.textContent === "settings.tabsVisibility"
    );
    expect(viewHeader).toBeTruthy();

    const viewSettings = SettingMock.instances.filter((instance) =>
      instance.name?.startsWith("tab: ")
    );
    expect(viewSettings).toHaveLength(Object.values(IHeatmapView).length);

    const trackerToggle = viewSettings.find((instance) =>
      instance.name?.includes(IHeatmapView.HeatmapTracker)
    )?.toggles[0];
    expect(trackerToggle?.value).toBe(false);

    const documentationToggle = viewSettings.find((instance) =>
      instance.name?.includes(IHeatmapView.Documentation)
    )?.toggles[0];
    expect(documentationToggle?.value).toBe(true);

    expect(tab.paletteSettings.displayPaletteSettings).toHaveBeenCalledTimes(1);
  });

  it("updates plugin settings when dropdowns and toggles change", async () => {
    const { plugin, tab } = createSettingsTab();
    const rerenderSpy = jest.spyOn(tab, "display");
    tab.display();
    rerenderSpy.mockImplementation(() => undefined);
    rerenderSpy.mockClear();

    const findSetting = (name: string) =>
      SettingMock.instances.find((instance) => instance.name === name)!;

    const languageSetting = findSetting("settings.language");
    await languageSetting.dropdowns[0].trigger("de");
    expect(i18nMock.changeLanguage).toHaveBeenCalledWith("de");
    expect(plugin.settings.language).toBe("de");
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
    expect(rerenderSpy).toHaveBeenCalledTimes(1);

    const weekStartSetting = findSetting("settings.weekStartDay");
    await weekStartSetting.dropdowns[0].trigger("2");
    expect(plugin.settings.weekStartDay).toBe(2);
    expect(plugin.saveSettings).toHaveBeenCalledTimes(2);

    const weekDisplaySetting = findSetting("settings.weekDisplayMode.label");
    await weekDisplaySetting.dropdowns[0].trigger("none");
    expect(plugin.settings.weekDisplayMode).toBe("none");
    expect(plugin.saveSettings).toHaveBeenCalledTimes(3);

    const separateMonthsSetting = findSetting("settings.separateMonths");
    await separateMonthsSetting.toggles[0].trigger(true);
    expect(plugin.settings.separateMonths).toBe(true);
    expect(plugin.saveSettings).toHaveBeenCalledTimes(4);

    const viewSetting = SettingMock.instances.find((instance) =>
      instance.name?.includes(IHeatmapView.Legend)
    )!;
    await viewSetting.toggles[0].trigger(false);
    expect(
      plugin.settings.viewTabsVisibility[IHeatmapView.Legend]
    ).toBe(false);
    expect(plugin.saveSettings).toHaveBeenCalledTimes(5);

    rerenderSpy.mockRestore();
  });
});
